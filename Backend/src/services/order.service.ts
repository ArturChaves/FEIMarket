import { z } from 'zod';
import { types } from 'cassandra-driver';
import { pool } from '../config/postgres';
import { Product } from '../models/Product';
import { cartRepository } from '../repositories/cart.repository';
import { orderRepository } from '../repositories/order.repository';
import { cassandraRepository } from '../repositories/cassandra.repository';
import { AppError } from '../utils/AppError';

const checkoutSchema = z.object({ userId: z.string().uuid() });

interface ProductSnapshot {
  productId:   string;
  productName: string;
  sellerId:    string;
  unitPrice:   number;
  quantity:    number;
  subtotal:    number;
}

export async function checkout(body: unknown) {
  const { userId } = checkoutSchema.parse(body);

  const cartHash = await cartRepository.getAll(userId);
  if (Object.keys(cartHash).length === 0) throw new AppError(400, 'Carrinho vazio');

  const cartEntries = Object.entries(cartHash).map(([productId, qty]) => ({
    productId,
    quantity: parseInt(qty, 10),
  }));

  const productIds    = cartEntries.map(e => e.productId);
  const foundProducts = await Product.find({ _id: { $in: productIds }, is_active: true }).lean();
  const productMap    = new Map(foundProducts.map(p => [String(p._id), p]));

  const snapshots: ProductSnapshot[] = [];
  for (const entry of cartEntries) {
    const product = productMap.get(entry.productId);
    if (!product) throw new AppError(400, `Produto ${entry.productId} não encontrado ou inativo`);
    if (product.stock < entry.quantity) throw new AppError(400, `Estoque insuficiente para "${product.title}"`);
    snapshots.push({
      productId:   String(product._id),
      productName: product.title,
      sellerId:    product.seller_id,
      unitPrice:   product.price,
      quantity:    entry.quantity,
      subtotal:    product.price * entry.quantity,
    });
  }

  const total = snapshots.reduce((sum, s) => sum + s.subtotal, 0);

  const balance = await orderRepository.getBalance(userId);
  if (balance < total) throw new AppError(400, 'Saldo insuficiente');

  const selfPurchase = snapshots.find(s => s.sellerId === userId);
  if (selfPurchase) throw new AppError(400, `Não é permitido comprar seu próprio produto "${selfPurchase.productName}"`);

  const client    = await pool.connect();
  const itemRows: Awaited<ReturnType<typeof orderRepository.createItem>>[] = [];
  let orderRow:   Awaited<ReturnType<typeof orderRepository.createOrder>>;

  try {
    await client.query('BEGIN');

    orderRow = await orderRepository.createOrder(client, userId, total);

    for (const snap of snapshots) {
      const item = await orderRepository.createItem(
        client, orderRow.id, snap.sellerId, snap.productId,
        snap.productName, snap.quantity, snap.unitPrice
      );
      itemRows.push(item);
      await orderRepository.createTransaction(client, userId, snap.sellerId, item.id, snap.subtotal);
    }

    await orderRepository.debitBalance(client, userId, total);

    const sellerTotals = new Map<string, number>();
    for (const snap of snapshots) {
      sellerTotals.set(snap.sellerId, (sellerTotals.get(snap.sellerId) ?? 0) + snap.subtotal);
    }
    for (const [sellerId, amount] of sellerTotals) {
      await orderRepository.creditBalance(client, sellerId, amount);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  for (const snap of snapshots) {
    await Product.findByIdAndUpdate(snap.productId, { $inc: { stock: -snap.quantity } });
  }

  await cartRepository.clear(userId);

  for (const snap of snapshots) {
    await cassandraRepository.insertPurchase(
      types.Uuid.fromString(userId),
      orderRow!.id,
      snap.productId,
      snap.productName,
      snap.quantity,
      snap.subtotal
    );
  }

  return {
    order: {
      id:        orderRow!.id,
      client_id: orderRow!.client_id,
      total:     parseFloat(orderRow!.total),
      items:     itemRows.map(item => ({
        id:           item.id,
        product_id:   item.product_id,
        product_name: item.product_name,
        quantity:     item.quantity,
        unit_price:   parseFloat(item.unit_price),
        subtotal:     parseFloat(item.subtotal),
      })),
    },
  };
}

export async function getOrders(userId: string) {
  const orders = await orderRepository.findByUserId(userId);
  const productIds = Array.from(new Set(orders.flatMap(o => o.items.map(i => i.product_id))));
  
  if (productIds.length > 0) {
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map(p => [String(p._id), p]));
    
    for (const order of orders) {
      for (const item of order.items) {
        const prod = productMap.get(item.product_id);
        if (prod && prod.images && prod.images.length > 0) {
          (item as any).product_image = prod.images[0];
        }
      }
    }
  }
  return orders;
}

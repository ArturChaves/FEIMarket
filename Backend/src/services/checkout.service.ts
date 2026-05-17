import type { PoolClient } from 'pg';
import { types } from 'cassandra-driver';
import { pool } from '../config/postgres';
import { redis } from '../config/redis';
import { cassandra } from '../config/cassandra';
import { Product } from '../models/Product';
import { redisKeys } from '../utils/redisKeys';

interface ProductSnapshot {
  productId:   string;
  productName: string;
  sellerId:    string;
  unitPrice:   number;
  quantity:    number;
  subtotal:    number;
}

interface OrderRow {
  id:         string;
  client_id:  string;
  total:      string;
  created_at: Date;
  updated_at: Date;
}

interface OrderItemRow {
  id:           string;
  order_id:     string;
  seller_id:    string;
  product_id:   string;
  product_name: string;
  quantity:     number;
  unit_price:   string;
  subtotal:     string;
}

export interface CheckoutResult {
  order: {
    id:        string;
    client_id: string;
    total:     number;
    items: Array<{
      id:           string;
      product_id:   string;
      product_name: string;
      quantity:     number;
      unit_price:   number;
      subtotal:     number;
    }>;
  };
}

export async function processCheckout(userId: string): Promise<CheckoutResult> {
  // 1. Redis: lê o carrinho
  const cartHash = await redis.hgetall(redisKeys.cart(userId));
  if (!cartHash || Object.keys(cartHash).length === 0) throw new Error('Carrinho vazio');

  const cartEntries = Object.entries(cartHash).map(([productId, qty]) => ({
    productId,
    quantity: parseInt(qty, 10),
  }));

  // 2. MongoDB: valida estoque e captura snapshots de preço e seller_id
  const snapshots: ProductSnapshot[] = [];
  for (const entry of cartEntries) {
    const product = await Product.findOne({ _id: entry.productId, is_active: true }).lean();
    if (!product) throw new Error(`Produto ${entry.productId} não encontrado ou inativo`);
    if (product.stock < entry.quantity)
      throw new Error(`Estoque insuficiente para "${product.title}"`);
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

  // 3. PostgreSQL: valida saldo do comprador
  const balanceResult = await pool.query<{ balance: string }>(
    'SELECT balance FROM users WHERE id = $1',
    [userId]
  );
  const balance = parseFloat(balanceResult.rows[0]?.balance ?? '0');
  if (balance < total) throw new Error('Saldo insuficiente');

  const selfPurchase = snapshots.find(s => s.sellerId === userId);
  if (selfPurchase)
    throw new Error(`Não é permitido comprar seu próprio produto "${selfPurchase.productName}"`);

  // 5. PostgreSQL: transação atômica — qualquer erro faz ROLLBACK
  const client: PoolClient = await pool.connect();
  let orderRow!: OrderRow;
  const orderItemRows: OrderItemRow[] = [];

  try {
    await client.query('BEGIN');

    const orderResult = await client.query<OrderRow>(
      'INSERT INTO orders (client_id, total) VALUES ($1, $2) RETURNING *',
      [userId, total]
    );
    orderRow = orderResult.rows[0]!;

    for (const snap of snapshots) {
      const itemResult = await client.query<OrderItemRow>(
        `INSERT INTO order_items (order_id, seller_id, product_id, product_name, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [orderRow.id, snap.sellerId, snap.productId, snap.productName, snap.quantity, snap.unitPrice]
      );
      const item = itemResult.rows[0]!;
      orderItemRows.push(item);

      await client.query(
        'INSERT INTO transactions (client_id, seller_id, order_item_id, amount) VALUES ($1, $2, $3, $4)',
        [userId, snap.sellerId, item.id, snap.subtotal]
      );
    }

    // PostgreSQL: debita saldo do comprador
    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [total, userId]);

    const sellerTotals = new Map<string, number>();
    for (const snap of snapshots) {
      sellerTotals.set(snap.sellerId, (sellerTotals.get(snap.sellerId) ?? 0) + snap.subtotal);
    }
    // PostgreSQL: credita saldo de cada vendedor distinto
    for (const [sellerId, amount] of sellerTotals) {
      await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, sellerId]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // 6. MongoDB: decrementa estoque após commit no PostgreSQL
  for (const snap of snapshots) {
    await Product.findByIdAndUpdate(snap.productId, { $inc: { stock: -snap.quantity } });
  }

  // 7. Redis: limpa o carrinho
  await redis.del(redisKeys.cart(userId));

  // 8. Cassandra: registra histórico de compra para cada item
  for (const snap of snapshots) {
    await cassandra.execute(
      `INSERT INTO marketplace.purchase_history
       (user_id, purchased_at, purchase_id, order_id, product_id, product_name, quantity, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        types.Uuid.fromString(userId),
        new Date(),
        types.Uuid.random(),
        orderRow.id,
        snap.productId,
        snap.productName,
        snap.quantity,
        snap.subtotal,
      ],
      { prepare: true }
    );
  }

  return {
    order: {
      id:        orderRow.id,
      client_id: orderRow.client_id,
      total:     parseFloat(orderRow.total),
      items:     orderItemRows.map(item => ({
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

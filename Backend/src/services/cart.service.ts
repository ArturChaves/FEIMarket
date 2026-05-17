import { z } from 'zod';
import { cartRepository } from '../repositories/cart.repository';
import { productRepository } from '../repositories/product.repository';
import { AppError } from '../utils/AppError';

const addItemSchema = z.object({
  productId: z.string(),
  quantity:  z.number().int().positive(),
});

const updateItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export async function getCart(userId: string) {
  const cartHash = await cartRepository.getAll(userId);
  if (Object.keys(cartHash).length === 0) return [];

  const productIds = Object.keys(cartHash);
  const products   = await productRepository.findByIds(productIds);
  const productMap = new Map(products.map(p => [String(p._id), p]));

  return Object.entries(cartHash).flatMap(([productId, quantityStr]) => {
    const product = productMap.get(productId);
    if (!product) return [];
    return [{
      productId,
      quantity:    parseInt(quantityStr, 10),
      title:       product.title,
      price:       product.price,
      seller_name: product.seller_name,
      images:      product.images,
      stock:       product.stock,
    }];
  });
}

export async function addItem(userId: string, body: unknown) {
  const { productId, quantity } = addItemSchema.parse(body);

  const product = await productRepository.findById(productId);
  if (!product) throw new AppError(404, 'Produto não encontrado');

  const existing   = await cartRepository.getItem(userId, productId);
  const currentQty = existing ? parseInt(existing, 10) : 0;
  const newQty     = currentQty + quantity;

  if (product.stock < newQty) throw new AppError(400, 'Estoque insuficiente');

  await cartRepository.setItem(userId, productId, newQty);
}

export async function updateItem(userId: string, productId: string, body: unknown) {
  const { quantity } = updateItemSchema.parse(body);

  const product = await productRepository.findById(productId);
  if (!product) throw new AppError(404, 'Produto não encontrado');
  if (product.stock < quantity) throw new AppError(400, 'Estoque insuficiente');

  await cartRepository.setItem(userId, productId, quantity);
}

export async function removeItem(userId: string, productId: string) {
  await cartRepository.removeItem(userId, productId);
}

export async function clearCart(userId: string) {
  await cartRepository.clear(userId);
}

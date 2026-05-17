import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { redis } from '../config/redis';
import { Product } from '../models/Product';
import { redisKeys } from '../utils/redisKeys';

interface CartItem {
  productId:   string;
  quantity:    number;
  title:       string;
  price:       number;
  seller_name: string;
  images:      string[];
  stock:       number;
}

export async function getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params as { userId: string };

    // Redis: busca todos os itens do carrinho
    const cartHash = await redis.hgetall(redisKeys.cart(userId));

    if (!cartHash || Object.keys(cartHash).length === 0) {
      res.json({ items: [] });
      return;
    }

    // MongoDB: busca dados atuais de cada produto no carrinho
    const items: CartItem[] = [];
    for (const [productId, quantityStr] of Object.entries(cartHash)) {
      const product = await Product.findOne({ _id: productId, is_active: true }).lean();
      if (!product) continue;
      items.push({
        productId,
        quantity:    parseInt(quantityStr, 10),
        title:       product.title,
        price:       product.price,
        seller_name: product.seller_name,
        images:      product.images,
        stock:       product.stock,
      });
    }

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params as { userId: string };
    const { productId, quantity } = z.object({
      productId: z.string(),
      quantity:  z.number().int().positive(),
    }).parse(req.body);

    // MongoDB: valida que o produto existe e tem estoque suficiente
    const product = await Product.findOne({ _id: productId, is_active: true }).lean();
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }
    if (product.stock < quantity) {
      res.status(400).json({ error: 'Estoque insuficiente' });
      return;
    }

    // Redis: adiciona ou atualiza quantidade no carrinho
    await redis.hset(redisKeys.cart(userId), productId, quantity);

    res.json({ message: 'Item adicionado ao carrinho' });
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, productId } = req.params as { userId: string; productId: string };
    const { quantity } = z.object({
      quantity: z.number().int().positive(),
    }).parse(req.body);

    // Redis: atualiza a quantidade do item
    await redis.hset(redisKeys.cart(userId), productId, quantity);

    res.json({ message: 'Quantidade atualizada' });
  } catch (err) {
    next(err);
  }
}

export async function removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, productId } = req.params as { userId: string; productId: string };

    // Redis: remove o item do carrinho
    await redis.hdel(redisKeys.cart(userId), productId);

    res.json({ message: 'Item removido do carrinho' });
  } catch (err) {
    next(err);
  }
}

export async function clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params as { userId: string };

    // Redis: limpa o carrinho inteiro
    await redis.del(redisKeys.cart(userId));

    res.json({ message: 'Carrinho limpo' });
  } catch (err) {
    next(err);
  }
}

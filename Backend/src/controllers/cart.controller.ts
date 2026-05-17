import type { Request, Response, NextFunction } from 'express';
import * as cartService from '../services/cart.service';

export async function getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await cartService.getCart(req.params['userId']!);
    res.json({ items });
  } catch (err) { next(err); }
}

export async function addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await cartService.addItem(req.params['userId']!, req.body);
    res.json({ message: 'Item adicionado ao carrinho' });
  } catch (err) { next(err); }
}

export async function updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await cartService.updateItem(req.params['userId']!, req.params['productId']!, req.body);
    res.json({ message: 'Quantidade atualizada' });
  } catch (err) { next(err); }
}

export async function removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await cartService.removeItem(req.params['userId']!, req.params['productId']!);
    res.json({ message: 'Item removido do carrinho' });
  } catch (err) { next(err); }
}

export async function clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await cartService.clearCart(req.params['userId']!);
    res.json({ message: 'Carrinho limpo' });
  } catch (err) { next(err); }
}

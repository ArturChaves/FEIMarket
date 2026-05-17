import type { Request, Response, NextFunction } from 'express';
import * as orderService from '../services/order.service';

export async function checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await orderService.checkout(req.body);
    res.status(201).json({ ...result, message: 'Compra realizada com sucesso' });
  } catch (err) { next(err); }
}

export async function getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await orderService.getOrders(req.params['userId']!);
    res.json({ orders });
  } catch (err) { next(err); }
}

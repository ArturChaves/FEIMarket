import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../config/postgres';
import { processCheckout } from '../services/checkout.service';

export async function checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.body);
    const result = await processCheckout(userId);
    res.status(201).json({ ...result, message: 'Compra realizada com sucesso' });
  } catch (err) {
    next(err);
  }
}

export async function getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params as { userId: string };

    // PostgreSQL: busca orders com seus itens ordenados por data
    const result = await pool.query<{
      order_id:     string;
      total:        string;
      created_at:   Date;
      item_id:      string;
      product_id:   string;
      product_name: string;
      quantity:     number;
      unit_price:   string;
      subtotal:     string;
      seller_id:    string;
    }>(
      `SELECT
         o.id          AS order_id,
         o.total,
         o.created_at,
         oi.id         AS item_id,
         oi.product_id,
         oi.product_name,
         oi.quantity,
         oi.unit_price,
         oi.subtotal,
         oi.seller_id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.client_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const ordersMap = new Map<string, {
      id:         string;
      total:      number;
      created_at: Date;
      items: Array<{
        id:           string;
        product_id:   string;
        product_name: string;
        quantity:     number;
        unit_price:   number;
        subtotal:     number;
        seller_id:    string;
      }>;
    }>();

    for (const row of result.rows) {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          id:         row.order_id,
          total:      parseFloat(row.total),
          created_at: row.created_at,
          items:      [],
        });
      }
      ordersMap.get(row.order_id)!.items.push({
        id:           row.item_id,
        product_id:   row.product_id,
        product_name: row.product_name,
        quantity:     row.quantity,
        unit_price:   parseFloat(row.unit_price),
        subtotal:     parseFloat(row.subtotal),
        seller_id:    row.seller_id,
      });
    }

    res.json({ orders: Array.from(ordersMap.values()) });
  } catch (err) {
    next(err);
  }
}

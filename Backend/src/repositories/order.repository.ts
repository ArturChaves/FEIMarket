import type { PoolClient } from 'pg';
import { pool } from '../config/postgres';

export interface OrderRow {
  id:         string;
  client_id:  string;
  total:      string;
  created_at: Date;
}

export interface OrderItemRow {
  id:           string;
  order_id:     string;
  seller_id:    string;
  product_id:   string;
  product_name: string;
  quantity:     number;
  unit_price:   string;
  subtotal:     string;
}

export interface OrderItem {
  id:           string;
  product_id:   string;
  product_name: string;
  quantity:     number;
  unit_price:   number;
  subtotal:     number;
  seller_id:    string;
}

export interface Order {
  id:         string;
  total:      number;
  created_at: Date;
  items:      OrderItem[];
}

export const orderRepository = {
  async createOrder(client: PoolClient, clientId: string, total: number): Promise<OrderRow> {
    const { rows } = await client.query<OrderRow>(
      'INSERT INTO orders (client_id, total) VALUES ($1, $2) RETURNING *',
      [clientId, total]
    );
    return rows[0]!;
  },

  async createItem(
    client: PoolClient,
    orderId: string, sellerId: string, productId: string,
    productName: string, quantity: number, unitPrice: number
  ): Promise<OrderItemRow> {
    const { rows } = await client.query<OrderItemRow>(
      `INSERT INTO order_items (order_id, seller_id, product_id, product_name, quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [orderId, sellerId, productId, productName, quantity, unitPrice]
    );
    return rows[0]!;
  },

  async createTransaction(
    client: PoolClient,
    buyerId: string, sellerId: string, orderItemId: string, amount: number
  ): Promise<void> {
    await client.query(
      'INSERT INTO transactions (client_id, seller_id, order_item_id, amount) VALUES ($1, $2, $3, $4)',
      [buyerId, sellerId, orderItemId, amount]
    );
  },

  async debitBalance(client: PoolClient, userId: string, amount: number): Promise<void> {
    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, userId]);
  },

  async creditBalance(client: PoolClient, sellerId: string, amount: number): Promise<void> {
    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, sellerId]);
  },

  async getBalance(userId: string): Promise<number> {
    const { rows } = await pool.query<{ balance: string }>(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );
    return parseFloat(rows[0]?.balance ?? '0');
  },

  async findByUserId(userId: string): Promise<Order[]> {
    const { rows } = await pool.query<{
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
      `SELECT o.id AS order_id, o.total, o.created_at,
              oi.id AS item_id, oi.product_id, oi.product_name,
              oi.quantity, oi.unit_price, oi.subtotal, oi.seller_id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.client_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const map = new Map<string, Order>();
    for (const row of rows) {
      if (!map.has(row.order_id)) {
        map.set(row.order_id, {
          id:         row.order_id,
          total:      parseFloat(row.total),
          created_at: row.created_at,
          items:      [],
        });
      }
      map.get(row.order_id)!.items.push({
        id:           row.item_id,
        product_id:   row.product_id,
        product_name: row.product_name,
        quantity:     row.quantity,
        unit_price:   parseFloat(row.unit_price),
        subtotal:     parseFloat(row.subtotal),
        seller_id:    row.seller_id,
      });
    }
    return Array.from(map.values());
  },
};

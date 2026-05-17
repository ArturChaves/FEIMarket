import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/postgres';
import { cassandra } from '../config/cassandra';
import { types } from 'cassandra-driver';

export async function getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    // 1. PostgreSQL: Busca dados do usuário
    const userResult = await pool.query<{
      id: string;
      name: string;
      email: string;
      role: string;
      balance: string;
      is_active: boolean;
      created_at: Date;
    }>(
      'SELECT id, name, email, role, balance, is_active, created_at FROM users WHERE id = $1',
      [id]
    );

    const dbUser = userResult.rows[0];
    if (!dbUser) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const safeUser = {
      ...dbUser,
      balance: parseFloat(dbUser.balance),
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${dbUser.name}`
    };

    // 2. Cassandra: Busca atividades
    let lastLogin = null;
    let lastView = null;
    let lastPurchase = null;

    try {
      const loginRes = await cassandra.execute(
        'SELECT logged_at, ip_address, device FROM marketplace.login_history WHERE user_id = ? LIMIT 1',
        [types.Uuid.fromString(id)],
        { prepare: true }
      );
      if (loginRes.rowLength > 0) {
        const row = loginRes.rows[0]!;
        lastLogin = {
          logged_at: row.get('logged_at'),
          ip_address: row.get('ip_address'),
          device: row.get('device'),
        };
      }
    } catch (err) {
      console.error('Failed to query Cassandra login_history', err);
    }

    try {
      const viewRes = await cassandra.execute(
        'SELECT product_name, price, viewed_at FROM marketplace.product_views WHERE user_id = ? LIMIT 1',
        [types.Uuid.fromString(id)],
        { prepare: true }
      );
      if (viewRes.rowLength > 0) {
        const row = viewRes.rows[0]!;
        lastView = {
          product_name: row.get('product_name'),
          price: parseFloat(row.get('price')?.toString() || '0'),
          viewed_at: row.get('viewed_at'),
        };
      }
    } catch (err) {
      console.error('Failed to query Cassandra product_views', err);
    }

    try {
      const purchaseRes = await cassandra.execute(
        'SELECT product_name, quantity, total, purchased_at FROM marketplace.purchase_history WHERE user_id = ? LIMIT 1',
        [types.Uuid.fromString(id)],
        { prepare: true }
      );
      if (purchaseRes.rowLength > 0) {
        const row = purchaseRes.rows[0]!;
        lastPurchase = {
          product_name: row.get('product_name'),
          quantity: row.get('quantity'),
          total: parseFloat(row.get('total')?.toString() || '0'),
          purchased_at: row.get('purchased_at'),
        };
      }
    } catch (err) {
      console.error('Failed to query Cassandra purchase_history', err);
    }

    res.json({
      user: safeUser,
      activity: {
        last_login: lastLogin,
        last_view: lastView,
        last_purchase: lastPurchase,
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const result = await pool.query<{
      id: string; name: string; email: string; role: string; balance: string; is_active: boolean; created_at: Date;
    }>(
      'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, balance, is_active, created_at',
      [name, id]
    );

    const updated = result.rows[0];
    if (!updated) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json({
      user: {
        ...updated,
        balance: parseFloat(updated.balance),
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${updated.name}`
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function addBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Valor inválido para adicionar ao saldo' });
      return;
    }

    const result = await pool.query<{
      id: string; name: string; email: string; role: string; balance: string; is_active: boolean; created_at: Date;
    }>(
      'UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, balance, is_active, created_at',
      [amount, id]
    );

    const updated = result.rows[0];
    if (!updated) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json({
      message: 'Saldo adicionado com sucesso',
      user: {
        ...updated,
        balance: parseFloat(updated.balance),
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${updated.name}`
      }
    });
  } catch (err) {
    next(err);
  }
}

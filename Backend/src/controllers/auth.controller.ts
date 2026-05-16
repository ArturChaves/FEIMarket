import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { types } from 'cassandra-driver';
import { pool } from '../config/postgres';
import { cassandra } from '../config/cassandra';

const registerSchema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const password_hash = await bcrypt.hash(password, 10);

    // PostgreSQL: cria o usuário
    const result = await pool.query<{
      id: string; name: string; email: string; role: string; balance: string;
    }>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, balance`,
      [name, email, password_hash]
    );

    const user = result.rows[0];
    if (!user) throw new Error('Falha ao criar usuário');

    // Cassandra: registra o evento de criação na login_history
    await cassandra.execute(
      `INSERT INTO marketplace.login_history (user_id, logged_at, login_id, ip_address, device)
       VALUES (?, ?, ?, ?, ?)`,
      [
        types.Uuid.fromString(user.id),
        new Date(),
        types.Uuid.random(),
        req.ip ?? 'unknown',
        req.headers['user-agent'] ?? 'unknown',
      ],
      { prepare: true }
    );

    res.status(201).json({ user: { ...user, balance: parseFloat(user.balance) } });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // PostgreSQL: busca o usuário pelo email
    const result = await pool.query<{
      id: string; name: string; email: string; role: string;
      balance: string; password_hash: string; is_active: boolean;
    }>(
      'SELECT id, name, email, role, balance, password_hash, is_active FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Usuário inativo' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    // Cassandra: registra o login
    await cassandra.execute(
      `INSERT INTO marketplace.login_history (user_id, logged_at, login_id, ip_address, device)
       VALUES (?, ?, ?, ?, ?)`,
      [
        types.Uuid.fromString(user.id),
        new Date(),
        types.Uuid.random(),
        req.ip ?? 'unknown',
        req.headers['user-agent'] ?? 'unknown',
      ],
      { prepare: true }
    );

    const { password_hash: _, is_active: __, ...safeUser } = user;
    res.json({ user: { ...safeUser, balance: parseFloat(safeUser.balance) } });
  } catch (err) {
    next(err);
  }
}

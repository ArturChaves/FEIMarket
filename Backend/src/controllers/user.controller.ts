import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { types } from 'cassandra-driver';
import crypto from 'crypto';
import path from 'path';
import { pool } from '../config/postgres';
import { cassandra } from '../config/cassandra';
import { minio } from '../config/minio';
import { requireEnv } from '../utils/env';

const BUCKET    = 'marketplace-avatars';
const MINIO_URL = requireEnv('MINIO_PUBLIC_URL');

const updateSchema = z.object({
  name:  z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params as { userId: string };

    // PostgreSQL: busca dados do usuário
    const userResult = await pool.query<{
      id: string; name: string; email: string; role: string; balance: string;
    }>(
      'SELECT id, name, email, role, balance FROM users WHERE id = $1 AND is_active = TRUE',
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const user = userResult.rows[0]!;
    const uuid = types.Uuid.fromString(userId);

    // Cassandra: busca último login, última visualização e última compra em paralelo
    const [loginResult, viewResult, purchaseResult] = await Promise.all([
      cassandra.execute(
        'SELECT * FROM marketplace.login_history WHERE user_id = ? LIMIT 1',
        [uuid],
        { prepare: true }
      ),
      cassandra.execute(
        'SELECT * FROM marketplace.product_views WHERE user_id = ? LIMIT 1',
        [uuid],
        { prepare: true }
      ),
      cassandra.execute(
        'SELECT * FROM marketplace.purchase_history WHERE user_id = ? LIMIT 1',
        [uuid],
        { prepare: true }
      ),
    ]);

    res.json({
      user:      { ...user, balance: parseFloat(user.balance) },
      cassandra: {
        last_login:    loginResult.rows[0]    ?? null,
        last_view:     viewResult.rows[0]     ?? null,
        last_purchase: purchaseResult.rows[0] ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params as { userId: string };
    const fields = updateSchema.parse(req.body);

    if (!fields.name && !fields.email) {
      res.status(400).json({ error: 'Informe ao menos um campo para atualizar' });
      return;
    }

    const setClauses: string[] = [];
    const values: unknown[]    = [];
    let idx = 1;

    if (fields.name)  { setClauses.push(`name = $${idx++}`);  values.push(fields.name); }
    if (fields.email) { setClauses.push(`email = $${idx++}`); values.push(fields.email); }

    setClauses.push('updated_at = NOW()');
    values.push(userId);

    // PostgreSQL: atualiza o perfil
    const result = await pool.query<{
      id: string; name: string; email: string; role: string; balance: string;
    }>(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} AND is_active = TRUE RETURNING id, name, email, role, balance`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const user = result.rows[0]!;
    res.json({ user: { ...user, balance: parseFloat(user.balance) } });
  } catch (err) {
    next(err);
  }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId } = req.params as { userId: string };
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'Nenhuma imagem enviada' });
      return;
    }

    const ext      = path.extname(file.originalname);
    const filename = `${userId}-${crypto.randomUUID()}${ext}`;

    // MinIO: faz upload do avatar
    await minio.putObject(BUCKET, filename, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    const avatar_url = `${MINIO_URL}/${BUCKET}/${filename}`;

    res.json({ avatar_url });
  } catch (err) {
    next(err);
  }
}

import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/postgres';

export async function adminGuard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.query['userId'] as string | undefined;

  if (!userId) {
    res.status(401).json({ error: 'userId obrigatório' });
    return;
  }

  try {
    const result = await pool.query<{ role: string }>(
      'SELECT role FROM users WHERE id = $1 AND is_active = TRUE',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    if (result.rows[0]?.role !== 'admin') {
      res.status(403).json({ error: 'Acesso restrito a administradores' });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Error as MongooseError } from 'mongoose';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: err.errors[0]?.message ?? 'Dados inválidos' });
    return;
  }

  if (err instanceof MongooseError.CastError) {
    res.status(404).json({ error: 'Recurso não encontrado' });
    return;
  }

  const pgErr = err as { code?: string };
  if (pgErr.code === '23505') {
    res.status(409).json({ error: 'Registro já existe' });
    return;
  }

  const message = err instanceof Error ? err.message : 'Erro interno do servidor';
  res.status(500).json({ error: message });
}

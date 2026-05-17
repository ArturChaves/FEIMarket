import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.registerUser(req.body, req.ip ?? 'unknown', req.headers['user-agent'] ?? 'unknown');
    res.status(201).json(result);
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.loginUser(req.body, req.ip ?? 'unknown', req.headers['user-agent'] ?? 'unknown');
    res.json(result);
  } catch (err) { next(err); }
}

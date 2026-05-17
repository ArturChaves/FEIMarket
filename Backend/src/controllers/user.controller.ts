import type { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await userService.getProfile(req.params['userId']!);
    res.json(result);
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await userService.updateProfile(req.params['userId']!, req.body);
    res.json(result);
  } catch (err) { next(err); }
}

export async function addBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await userService.addBalance(req.params['userId']!, req.body);
    res.json(result);
  } catch (err) { next(err); }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) { res.status(400).json({ error: 'Nenhuma imagem enviada' }); return; }
    const result = await userService.uploadAvatar(req.params['userId']!, req.file);
    res.json(result);
  } catch (err) { next(err); }
}

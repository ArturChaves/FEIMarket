import type { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';

export async function getPostgresStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json(await adminService.getPostgresStats()); } catch (err) { next(err); }
}

export async function getMongoStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json(await adminService.getMongoStats()); } catch (err) { next(err); }
}

export async function getRedisStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json(await adminService.getRedisStats()); } catch (err) { next(err); }
}

export async function getCassandraStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json(await adminService.getCassandraStats()); } catch (err) { next(err); }
}

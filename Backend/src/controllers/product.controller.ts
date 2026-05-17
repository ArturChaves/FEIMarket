import type { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await productService.listProducts(req.query as Record<string, unknown>);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await productService.getProduct(req.params['id']!, req.query['userId'] as string | undefined);
    res.json(result);
  } catch (err) { next(err); }
}

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productService.createProduct(req.body, req.files as Express.Multer.File[] ?? []);
    res.status(201).json({ product });
  } catch (err) { next(err); }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productService.updateProduct(req.params['id']!, req.body, req.files as Express.Multer.File[] ?? []);
    res.json({ product });
  } catch (err) { next(err); }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await productService.deleteProduct(req.params['id']!, req.body);
    res.json({ message: 'Produto removido com sucesso' });
  } catch (err) { next(err); }
}

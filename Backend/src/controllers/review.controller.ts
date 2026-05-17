import type { Request, Response, NextFunction } from 'express';
import * as reviewService from '../services/review.service';

export async function getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reviews = await reviewService.getReviews(req.params['id']!);
    res.json({ reviews });
  } catch (err) { next(err); }
}

export async function createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const review = await reviewService.createReview(req.params['id']!, req.body);
    res.status(201).json({ review });
  } catch (err) { next(err); }
}

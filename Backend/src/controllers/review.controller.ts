import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Review } from '../models/Review';

const createSchema = z.object({
  userId:  z.string().uuid(),
  rating:  z.number().int().min(1).max(5),
  comment: z.string().min(1),
});

export async function getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    // MongoDB: busca reviews do produto
    const reviews = await Review.find({ product_id: id }).lean();

    res.json({ reviews });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { userId, rating, comment } = createSchema.parse(req.body);

    // MongoDB: cria a review
    const review = await Review.create({
      product_id: id,
      user_id:    userId,
      rating,
      comment,
    });

    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

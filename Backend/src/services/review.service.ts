import { z } from 'zod';
import { reviewRepository } from '../repositories/review.repository';

const createSchema = z.object({
  userId:  z.string().uuid(),
  rating:  z.number().int().min(1).max(5),
  comment: z.string().min(1),
});

export async function getReviews(productId: string) {
  return reviewRepository.findByProductId(productId);
}

export async function createReview(productId: string, body: unknown) {
  const { userId, rating, comment } = createSchema.parse(body);
  return reviewRepository.create(productId, userId, rating, comment);
}

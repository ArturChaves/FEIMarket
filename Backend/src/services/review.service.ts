import { z } from 'zod';
import { reviewRepository } from '../repositories/review.repository';
import { userRepository } from '../repositories/user.repository';

const createSchema = z.object({
  userId:  z.string().uuid(),
  rating:  z.number().int().min(1).max(5),
  comment: z.string().min(1),
});

export async function getReviews(productId: string) {
  const reviews = await reviewRepository.findByProductId(productId);
  const userIds = [...new Set(reviews.map(r => r.user_id))];
  const userNames = await userRepository.findNamesByIds(userIds);
  return reviews.map(r => ({
    ...r,
    user_name: userNames[r.user_id] || 'Usuário'
  }));
}

export async function createReview(productId: string, body: unknown) {
  const { userId, rating, comment } = createSchema.parse(body);
  const review = await reviewRepository.create(productId, userId, rating, comment);
  const userName = await userRepository.findSellerName(userId);
  return {
    ...review.toObject(),
    user_name: userName || 'Usuário'
  };
}

import { Review } from '../models/Review';

export const reviewRepository = {
  async findByProductId(productId: string) {
    return Review.find({ product_id: productId }).lean();
  },

  async create(productId: string, userId: string, rating: number, comment: string) {
    return Review.create({ product_id: productId, user_id: userId, rating, comment });
  },
};

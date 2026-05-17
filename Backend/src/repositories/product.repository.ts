import type { PipelineStage } from 'mongoose';
import { isValidObjectId } from 'mongoose';
import { Product } from '../models/Product';
import { Review } from '../models/Review';
import { redis } from '../config/redis';
import { redisKeys, type SearchOrder } from '../utils/redisKeys';

export interface ProductFilter {
  is_active: boolean;
  $text?: { $search: string };
  category?: string;
  price?: { $gte?: number; $lte?: number };
}

interface AggregationFacetResult {
  data: Record<string, unknown>[];
  count: Array<{ total: number }>;
}

export interface MongoStats {
  products: { total: number; active: number; per_category: Record<string, number> };
  reviews:  { total: number; avg_rating: number | null };
}

const SEARCH_TTL = 300;

export const productRepository = {
  isValidId(id: string): boolean {
    return isValidObjectId(id);
  },

  async list(filter: ProductFilter, sort: Record<string, 1 | -1>, skip: number, limit: number) {
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    return { products, total };
  },

  async listWithRating(filter: ProductFilter, skip: number, limit: number) {
    const pipeline: PipelineStage[] = [
      { $match: filter },
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'product_id', as: 'reviews' } },
      { $addFields: { avg_rating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] } } },
      { $sort: { avg_rating: -1 as const } },
      { $facet: {
          data:  [{ $skip: skip }, { $limit: limit }],
          count: [{ $count: 'total' }],
      }},
    ];
    const [result] = await Product.aggregate<AggregationFacetResult>(pipeline);
    return { products: result?.data ?? [], total: result?.count[0]?.total ?? 0 };
  },

  async findById(id: string) {
    return Product.findOne({ _id: id, is_active: true }).lean();
  },

  async findByIdForWrite(id: string) {
    return Product.findOne({ _id: id, is_active: true });
  },

  async findByIds(ids: string[]) {
    return Product.find({ _id: { $in: ids }, is_active: true }).lean();
  },

  async create(data: Record<string, unknown>) {
    return Product.create(data);
  },

  async update(id: string, data: Record<string, unknown>) {
    return Product.findByIdAndUpdate(id, data, { new: true }).lean();
  },

  async softDelete(id: string) {
    await Product.findByIdAndUpdate(id, { is_active: false });
  },

  async getCached(key: string): Promise<string | null> {
    return redis.get(key);
  },

  async setCached(key: string, data: unknown): Promise<void> {
    await redis.setex(key, SEARCH_TTL, JSON.stringify(data));
  },

  async invalidateSearchCache(): Promise<void> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [next, found] = await redis.scan(cursor, 'MATCH', redisKeys.searchPattern(), 'COUNT', 100);
      cursor = next;
      keys.push(...found);
    } while (cursor !== '0');
    if (keys.length > 0) await redis.del(keys);
  },

  async buildCacheKey(
    search: string, category: string, minPrice: string, maxPrice: string,
    page: string, order: SearchOrder
  ): Promise<string> {
    return redisKeys.search(search, category, minPrice, maxPrice, page, order);
  },

  async getMongoStats(): Promise<MongoStats> {
    const [total, active, categoryAgg, totalReviews, ratingAgg] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ is_active: true }),
      Product.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Review.countDocuments(),
      Review.aggregate<{ avg_rating: number }>([
        { $group: { _id: null, avg_rating: { $avg: '$rating' } } },
      ]),
    ]);
    return {
      products: {
        total,
        active,
        per_category: Object.fromEntries(categoryAgg.map(c => [c._id, c.count])),
      },
      reviews: {
        total:      totalReviews,
        avg_rating: ratingAgg[0] ? Math.round(ratingAgg[0].avg_rating * 100) / 100 : null,
      },
    };
  },
};

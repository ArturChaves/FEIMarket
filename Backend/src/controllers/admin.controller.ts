import type { Request, Response, NextFunction } from 'express';
import { pool } from '../config/postgres';
import { Product } from '../models/Product';
import { Review } from '../models/Review';
import { redis } from '../config/redis';
import { cassandra } from '../config/cassandra';

export async function getPostgresStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [usersResult, ordersResult] = await Promise.all([
      pool.query<{ total: string; active: string }>(`
        SELECT
          COUNT(*)                            AS total,
          COUNT(*) FILTER (WHERE is_active)   AS active
        FROM users
      `),
      pool.query<{ total_orders: string; total_revenue: string; products_sold: string }>(`
        SELECT
          COUNT(DISTINCT o.id)   AS total_orders,
          COALESCE(SUM(o.total), 0)            AS total_revenue,
          COALESCE(SUM(oi.quantity), 0)        AS products_sold
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
      `),
    ]);

    const users  = usersResult.rows[0]!;
    const orders = ordersResult.rows[0]!;

    res.json({
      users: {
        total:  parseInt(users.total, 10),
        active: parseInt(users.active, 10),
      },
      orders: {
        total:         parseInt(orders.total_orders, 10),
        total_revenue: parseFloat(orders.total_revenue),
        products_sold: parseInt(orders.products_sold, 10),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMongoStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [totalProducts, activeProducts, categoryAgg, totalReviews, ratingAgg] = await Promise.all([
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

    res.json({
      products: {
        total:              totalProducts,
        active:             activeProducts,
        per_category:       Object.fromEntries(categoryAgg.map(c => [c._id, c.count])),
      },
      reviews: {
        total:      totalReviews,
        avg_rating: ratingAgg[0] ? Math.round(ratingAgg[0].avg_rating * 100) / 100 : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getRedisStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const info = await redis.info('clients');
    const memory = await redis.info('memory');

    const connected_clients = parseInt(
      (info.match(/connected_clients:(\d+)/) ?? [])[1] ?? '0',
      10
    );
    const used_memory_human = (memory.match(/used_memory_human:(\S+)/) ?? [])[1] ?? 'N/A';

    const cartKeys = await redis.keys('cart:*');
    const searchKeys = await redis.keys('search:*');

    res.json({
      connected_clients,
      used_memory_human,
      keys: {
        cart:   cartKeys.length,
        search: searchKeys.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCassandraStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [loginResult, viewResult, purchaseResult] = await Promise.all([
      cassandra.execute('SELECT COUNT(*) FROM marketplace.login_history',    [], { prepare: true }),
      cassandra.execute('SELECT COUNT(*) FROM marketplace.product_views',    [], { prepare: true }),
      cassandra.execute('SELECT COUNT(*) FROM marketplace.purchase_history', [], { prepare: true }),
    ]);

    res.json({
      total_logins:    loginResult.rows[0]   ? Number(loginResult.rows[0]!['count'])    : 0,
      total_views:     viewResult.rows[0]    ? Number(viewResult.rows[0]!['count'])     : 0,
      total_purchases: purchaseResult.rows[0] ? Number(purchaseResult.rows[0]!['count']) : 0,
    });
  } catch (err) {
    next(err);
  }
}

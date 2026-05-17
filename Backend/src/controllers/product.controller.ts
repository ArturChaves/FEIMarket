import type { Request, Response, NextFunction } from 'express';
import type { PipelineStage } from 'mongoose';
import { z } from 'zod';
import { types } from 'cassandra-driver';
import crypto from 'crypto';
import path from 'path';
import { Product } from '../models/Product';
import { Review } from '../models/Review';
import { pool } from '../config/postgres';
import { redis } from '../config/redis';
import { cassandra } from '../config/cassandra';
import { minio } from '../config/minio';
import { redisKeys, type SearchOrder } from '../utils/redisKeys';
import { parsePaginationParams } from '../utils/formatters';
import { requireEnv } from '../utils/env';

interface ProductFilter {
  is_active: boolean;
  $text?: { $search: string };
  category?: string;
  price?: { $gte?: number; $lte?: number };
}

interface AggregationFacetResult {
  data: Record<string, unknown>[];
  count: Array<{ total: number }>;
}

const BUCKET      = 'marketplace-products';
const SEARCH_TTL  = 300;
const MINIO_URL   = requireEnv('MINIO_PUBLIC_URL');

async function invalidateSearchCache(): Promise<void> {
  const keys = await redis.keys(redisKeys.searchPattern());
  if (keys.length > 0) await redis.del(...keys);
}

const createSchema = z.object({
  userId:      z.string().uuid(),
  title:       z.string().min(1),
  description: z.string().min(1),
  price:       z.coerce.number().positive(),
  stock:       z.coerce.number().int().min(0),
  category:    z.string().min(1),
  attributes:  z.string().optional(),
});

const updateSchema = z.object({
  userId:      z.string().uuid(),
  title:       z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price:       z.coerce.number().positive().optional(),
  stock:       z.coerce.number().int().min(0).optional(),
  category:    z.string().min(1).optional(),
  attributes:  z.string().optional(),
});

export async function listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search   = String(req.query['search']   ?? '');
    const category = String(req.query['category'] ?? '');
    const minPrice = String(req.query['minPrice'] ?? '');
    const maxPrice = String(req.query['maxPrice'] ?? '');
    const order    = (req.query['order'] as SearchOrder) ?? 'time';
    const { page, limit, skip } = parsePaginationParams(req.query['page'], req.query['limit']);

    const cacheKey = redisKeys.search(search, category, minPrice, maxPrice, String(page), order);

    // Redis: tenta retornar do cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const filter: ProductFilter = { is_active: true };
    if (search)   filter.$text    = { $search: search };
    if (category) filter.category = category;

    const priceFilter: { $gte?: number; $lte?: number } = {};
    if (minPrice) priceFilter.$gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
    if (priceFilter.$gte !== undefined || priceFilter.$lte !== undefined) filter.price = priceFilter;

    let products: Record<string, unknown>[];
    let total: number;

    if (order === 'rating') {
      // MongoDB: aggregation para ordenar por média de avaliações
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
      products = result?.data  ?? [];
      total    = result?.count[0]?.total ?? 0;
    } else {
      const sortMap: Record<string, { [key: string]: 1 | -1 }> = {
        time:  { created_at: -1 },
        price: { price: 1 },
      };
      const sort = sortMap[order] ?? { created_at: -1 };
      // MongoDB: busca com filtros, ordenação e paginação
      [products, total] = await Promise.all([
        Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Product.countDocuments(filter),
      ]);
    }

    const response = { products, total, page, totalPages: Math.ceil(total / limit) };

    // Redis: armazena resultado no cache por 5 minutos
    await redis.setex(cacheKey, SEARCH_TTL, JSON.stringify(response));

    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const userId = req.query['userId'] as string | undefined;

    // MongoDB: busca produto ativo
    const product = await Product.findOne({ _id: id, is_active: true }).lean();
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    // MongoDB: busca reviews do produto
    const reviews = await Review.find({ product_id: id }).lean();

    if (userId) {
      // Cassandra: registra visualização com snapshot de nome e preço
      await cassandra.execute(
        `INSERT INTO marketplace.product_views (user_id, viewed_at, view_id, product_id, product_name, price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          types.Uuid.fromString(userId),
          new Date(),
          types.Uuid.random(),
          String(product._id),
          product.title,
          product.price,
        ],
        { prepare: true }
      );
    }

    res.json({ product, reviews });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data  = createSchema.parse(req.body);
    const files = req.files as Express.Multer.File[] | undefined;

    // PostgreSQL: valida que o usuário existe e busca o nome
    const userResult = await pool.query<{ id: string; name: string }>(
      'SELECT id, name FROM users WHERE id = $1 AND is_active = TRUE',
      [data.userId]
    );
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const sellerName = userResult.rows[0]?.name ?? '';

    // MinIO: faz upload de cada imagem e gera URLs públicas
    const imageUrls: string[] = [];
    for (const file of files ?? []) {
      const ext      = path.extname(file.originalname);
      const filename = `${crypto.randomUUID()}${ext}`;
      await minio.putObject(BUCKET, filename, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });
      imageUrls.push(`${MINIO_URL}/${BUCKET}/${filename}`);
    }

    // MongoDB: cria o produto com o nome do vendedor
    const product = await Product.create({
      seller_id:   data.userId,
      seller_name: sellerName,
      title:       data.title,
      description: data.description,
      price:       data.price,
      stock:       data.stock,
      category:    data.category,
      images:      imageUrls,
      attributes:  data.attributes ? JSON.parse(data.attributes) : {},
    });

    // Redis: invalida cache de busca para o novo produto aparecer
    await invalidateSearchCache();

    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { userId, attributes, ...fields } = updateSchema.parse(req.body);
    const files = req.files as Express.Multer.File[] | undefined;

    // MongoDB: verifica se o produto existe e pertence ao usuário
    const existing = await Product.findOne({ _id: id, is_active: true });
    if (!existing) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }
    if (existing.seller_id !== userId) {
      res.status(403).json({ error: 'Sem permissão para editar este produto' });
      return;
    }

    const updateFields: Record<string, unknown> = { ...fields };

    if (attributes) updateFields['attributes'] = JSON.parse(attributes);

    if (files && files.length > 0) {
      // MinIO: faz upload das novas imagens e substitui as anteriores
      const imageUrls: string[] = [];
      for (const file of files) {
        const ext      = path.extname(file.originalname);
        const filename = `${crypto.randomUUID()}${ext}`;
        await minio.putObject(BUCKET, filename, file.buffer, file.size, {
          'Content-Type': file.mimetype,
        });
        imageUrls.push(`${MINIO_URL}/${BUCKET}/${filename}`);
      }
      updateFields['images'] = imageUrls;
    }

    // MongoDB: atualiza o produto
    const product = await Product.findByIdAndUpdate(id, updateFields, { new: true }).lean();

    // Redis: invalida todo o cache de busca
    await invalidateSearchCache();

    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.body);

    // MongoDB: verifica se o produto existe e pertence ao usuário
    const existing = await Product.findOne({ _id: id, is_active: true });
    if (!existing) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }
    if (existing.seller_id !== userId) {
      res.status(403).json({ error: 'Sem permissão para excluir este produto' });
      return;
    }

    // MongoDB: soft delete — mantém o produto no banco, apenas desativa
    await Product.findByIdAndUpdate(id, { is_active: false });

    // Redis: invalida cache para o produto não aparecer mais nas buscas
    await invalidateSearchCache();

    res.json({ message: 'Produto removido com sucesso' });
  } catch (err) {
    next(err);
  }
}

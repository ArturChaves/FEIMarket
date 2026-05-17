import { z } from 'zod';
import { types } from 'cassandra-driver';
import crypto from 'crypto';
import path from 'path';
import { productRepository, type ProductFilter } from '../repositories/product.repository';
import { reviewRepository } from '../repositories/review.repository';
import { userRepository } from '../repositories/user.repository';
import { cassandraRepository } from '../repositories/cassandra.repository';
import { minio } from '../config/minio';
import { type SearchOrder } from '../utils/redisKeys';
import { parsePaginationParams } from '../utils/formatters';
import { requireEnv } from '../utils/env';
import { AppError } from '../utils/AppError';

const BUCKET    = 'marketplace-products';
const MINIO_URL = requireEnv('MINIO_PUBLIC_URL');

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
  is_active:   z.coerce.boolean().optional(),
});

async function uploadFiles(files: Express.Multer.File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const filename = `${crypto.randomUUID()}${path.extname(file.originalname)}`;
    await minio.putObject(BUCKET, filename, file.buffer, file.size, { 'Content-Type': file.mimetype });
    urls.push(`${MINIO_URL}/${BUCKET}/${filename}`);
  }
  return urls;
}

function extractFilename(url: string): string {
  const prefix = `${MINIO_URL}/${BUCKET}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : '';
}

export async function listProducts(query: Record<string, unknown>) {
  const search   = String(query['search']   ?? '');
  const category = String(query['category'] ?? '');
  const minPrice = String(query['minPrice'] ?? '');
  const maxPrice = String(query['maxPrice'] ?? '');
  const orderRaw = (query['order'] ?? query['sortBy'] ?? query['sort'] ?? 'recent') as SearchOrder;
  const { page, limit, skip } = parsePaginationParams(query['page'], query['limit']);
  
  const sellerId = (query['sellerId'] || query['seller_id']) ? String(query['sellerId'] || query['seller_id']) : '';

  // Skip cache for seller-specific inventory views
  if (!sellerId) {
    const cacheKey = await productRepository.buildCacheKey(search, category, minPrice, maxPrice, String(page), orderRaw);
    const cached   = await productRepository.getCached(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const filter: any = {};
  if (sellerId) {
    filter.seller_id = sellerId;
  } else {
    filter.is_active = true;
  }

  if (search)   filter.$text    = { $search: search };
  if (category) filter.category = category;

  const priceFilter: { $gte?: number; $lte?: number } = {};
  if (minPrice) priceFilter.$gte = parseFloat(minPrice);
  if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
  if (priceFilter.$gte !== undefined || priceFilter.$lte !== undefined) filter.price = priceFilter;

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    recent:     { created_at: -1 },
    time:       { created_at: -1 },
    oldest:     { created_at: 1 },
    price_asc:  { price: 1 },
    price:      { price: 1 },
    price_desc: { price: -1 },
  };

  const isRatingSort = orderRaw === 'rating';

  const { products, total } = isRatingSort
    ? await productRepository.listWithRating(filter, skip, limit)
    : await productRepository.list(filter, sortMap[orderRaw] ?? { created_at: -1 }, skip, limit);

  const response = { products, total, page, totalPages: Math.ceil(total / limit) };
  
  if (!sellerId) {
    const cacheKey = await productRepository.buildCacheKey(search, category, minPrice, maxPrice, String(page), orderRaw);
    await productRepository.setCached(cacheKey, response);
  }
  
  return response;
}

export async function getProduct(id: string, userId?: string) {
  if (!productRepository.isValidId(id)) throw new AppError(404, 'Produto não encontrado');

  const [product, reviews] = await Promise.all([
    productRepository.findById(id),
    reviewRepository.findByProductId(id),
  ]);

  if (!product) throw new AppError(404, 'Produto não encontrado');

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const productWithRating = {
    ...product,
    rating: Math.round(avgRating * 10) / 10
  };

  if (userId) {
    await cassandraRepository.insertView(
      types.Uuid.fromString(userId),
      String(product._id),
      product.title as string,
      product.price as number
    );
  }

  return { product: productWithRating, reviews };
}

export async function createProduct(body: unknown, files: Express.Multer.File[]) {
  const data       = createSchema.parse(body);
  const sellerName = await userRepository.findSellerName(data.userId);
  if (!sellerName) throw new AppError(404, 'Usuário não encontrado');

  const images  = await uploadFiles(files);
  const product = await productRepository.create({
    seller_id:   data.userId,
    seller_name: sellerName,
    title:       data.title,
    description: data.description,
    price:       data.price,
    stock:       data.stock,
    category:    data.category,
    images,
    attributes:  data.attributes ? JSON.parse(data.attributes) : {},
  });

  await productRepository.invalidateSearchCache();
  return product;
}

export async function updateProduct(id: string, body: unknown, files: Express.Multer.File[]) {
  const { userId, attributes, ...fields } = updateSchema.parse(body);

  const existing = await productRepository.findByIdForWrite(id);
  if (!existing) throw new AppError(404, 'Produto não encontrado');
  if (existing.seller_id !== userId) throw new AppError(403, 'Sem permissão para editar este produto');

  const updateData: Record<string, unknown> = { ...fields };
  if (attributes) updateData['attributes'] = JSON.parse(attributes);

  let oldImages: string[] = [];
  if (files.length > 0) {
    oldImages = existing.images as string[];
    updateData['images'] = await uploadFiles(files);
  }

  const product = await productRepository.update(id, updateData);

  await Promise.allSettled(
    oldImages.map(url => {
      const filename = extractFilename(url);
      return filename ? minio.removeObject(BUCKET, filename) : Promise.resolve();
    })
  );

  await productRepository.invalidateSearchCache();
  return product;
}

export async function deleteProduct(id: string, body: unknown) {
  const { userId } = z.object({ userId: z.string().uuid() }).parse(body);

  const existing = await productRepository.findByIdForWrite(id);
  if (!existing) throw new AppError(404, 'Produto não encontrado');
  if (existing.seller_id !== userId) throw new AppError(403, 'Sem permissão para excluir este produto');

  const oldImages = existing.images as string[];
  await productRepository.softDelete(id);

  await Promise.allSettled(
    oldImages.map(url => {
      const filename = extractFilename(url);
      return filename ? minio.removeObject(BUCKET, filename) : Promise.resolve();
    })
  );

  await productRepository.invalidateSearchCache();
}

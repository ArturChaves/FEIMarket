import { z } from 'zod';
import { types } from 'cassandra-driver';
import crypto from 'crypto';
import path from 'path';
import { userRepository } from '../repositories/user.repository';
import { cassandraRepository } from '../repositories/cassandra.repository';
import { minio } from '../config/minio';
import { requireEnv } from '../utils/env';
import { AppError } from '../utils/AppError';

const BUCKET    = 'marketplace-avatars';
const MINIO_URL = requireEnv('MINIO_PUBLIC_URL');

const updateSchema = z.object({
  name:  z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export async function getProfile(userId: string) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError(404, 'Usuário não encontrado');

  const uuid = types.Uuid.fromString(userId);
  const [last_login, last_view, last_purchase] = await Promise.all([
    cassandraRepository.getLastLogin(uuid),
    cassandraRepository.getLastView(uuid),
    cassandraRepository.getLastPurchase(uuid),
  ]);

  return {
    user:      { ...user, balance: parseFloat(user.balance) },
    cassandra: { last_login, last_view, last_purchase },
  };
}

export async function updateProfile(userId: string, body: unknown) {
  const fields = updateSchema.parse(body);
  if (!fields.name && !fields.email) throw new AppError(400, 'Informe ao menos um campo para atualizar');

  const user = await userRepository.update(userId, fields);
  if (!user) throw new AppError(404, 'Usuário não encontrado');

  return { user: { ...user, balance: parseFloat(user.balance) } };
}

export async function uploadAvatar(userId: string, file: Express.Multer.File) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError(404, 'Usuário não encontrado');

  const filename   = `${userId}-${crypto.randomUUID()}${path.extname(file.originalname)}`;
  await minio.putObject(BUCKET, filename, file.buffer, file.size, { 'Content-Type': file.mimetype });
  const avatar_url = `${MINIO_URL}/${BUCKET}/${filename}`;

  await userRepository.updateAvatarUrl(userId, avatar_url);

  if (user.avatar_url) {
    const prefix      = `${MINIO_URL}/${BUCKET}/`;
    const oldFilename = user.avatar_url.startsWith(prefix) ? user.avatar_url.slice(prefix.length) : '';
    if (oldFilename) await minio.removeObject(BUCKET, oldFilename).catch(() => undefined);
  }

  return { avatar_url };
}

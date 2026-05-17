import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { types } from 'cassandra-driver';
import { userRepository } from '../repositories/user.repository';
import { cassandraRepository } from '../repositories/cassandra.repository';
import { AppError } from '../utils/AppError';

const registerSchema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export async function registerUser(body: unknown, ip: string, userAgent: string) {
  const { name, email, password } = registerSchema.parse(body);
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.create(name, email, passwordHash);
  await cassandraRepository.insertLogin(types.Uuid.fromString(user.id), ip, userAgent);
  return { user: { ...user, balance: parseFloat(user.balance) } };
}

export async function loginUser(body: unknown, ip: string, userAgent: string) {
  const { email, password } = loginSchema.parse(body);
  const user = await userRepository.findByEmail(email);

  if (!user) throw new AppError(401, 'Credenciais inválidas');
  if (!user.is_active) throw new AppError(403, 'Usuário inativo');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError(401, 'Credenciais inválidas');

  await cassandraRepository.insertLogin(types.Uuid.fromString(user.id), ip, userAgent);

  const { password_hash: _, is_active: __, ...safeUser } = user;
  return { user: { ...safeUser, balance: parseFloat(safeUser.balance) } };
}

import mongoose from 'mongoose';
import { requireEnv } from '../utils/env';

export async function connectMongo(): Promise<void> {
  await mongoose.connect(requireEnv('MONGODB_URI'));
}

export async function checkMongo(): Promise<string> {
  try {
    if (mongoose.connection.readyState === 1) return 'connected';
    return 'disconnected';
  } catch {
    return 'disconnected';
  }
}

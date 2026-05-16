import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectMongo(): Promise<void> {
  await mongoose.connect(process.env['MONGODB_URI'] as string);
}

export async function checkMongo(): Promise<string> {
  try {
    if (mongoose.connection.readyState === 1) return 'connected';
    return 'disconnected';
  } catch {
    return 'disconnected';
  }
}

import * as Minio from 'minio';
import dotenv from 'dotenv';

dotenv.config();

export const minio = new Minio.Client({
  endPoint: process.env['MINIO_ENDPOINT'] as string,
  port: parseInt(process.env['MINIO_PORT'] as string),
  useSSL: process.env['MINIO_USE_SSL'] === 'true',
  accessKey: process.env['MINIO_ACCESS_KEY'] as string,
  secretKey: process.env['MINIO_SECRET_KEY'] as string,
});

export async function checkMinio(): Promise<string> {
  try {
    await minio.listBuckets();
    return 'connected';
  } catch {
    return 'disconnected';
  }
}

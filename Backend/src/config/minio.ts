import * as Minio from 'minio';
import { requireEnv } from '../utils/env';

export const minio = new Minio.Client({
  endPoint:  requireEnv('MINIO_ENDPOINT'),
  port:      parseInt(requireEnv('MINIO_PORT'), 10),
  useSSL:    requireEnv('MINIO_USE_SSL') === 'true',
  accessKey: requireEnv('MINIO_ACCESS_KEY'),
  secretKey: requireEnv('MINIO_SECRET_KEY'),
});

export async function checkMinio(): Promise<string> {
  try {
    await minio.listBuckets();
    return 'connected';
  } catch {
    return 'disconnected';
  }
}

import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import cors from 'cors';
import { connectMongo } from './config/mongo';
import { connectCassandra } from './config/cassandra';
import { redis } from './config/redis';
import { checkPostgres } from './config/postgres';
import { checkMongo } from './config/mongo';
import { checkRedis } from './config/redis';
import { checkCassandra } from './config/cassandra';
import { checkMinio } from './config/minio';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import usersRoutes from './routes/users.routes';

const app = express();
const PORT = process.env['PORT'] ?? 4000;

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', async (_req, res) => {
  const [postgres, mongo, redisStatus, cassandra, minio] = await Promise.all([
    checkPostgres(),
    checkMongo(),
    checkRedis(),
    checkCassandra(),
    checkMinio(),
  ]);

  res.json({
    status: 'ok',
    databases: { postgres, mongo, redis: redisStatus, cassandra, minio },
  });
});

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/users', usersRoutes);

app.use(errorHandler);

async function bootstrap() {
  await connectMongo();
  await connectCassandra();
  await redis.connect();
  

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

process.on('SIGTERM', async () => {
  await redis.quit();
  process.exit(0);
});

bootstrap();

export default app;

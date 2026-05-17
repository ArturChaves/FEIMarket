import { Router } from 'express';
import { adminGuard } from '../middlewares/adminGuard';
import { getPostgresStats, getMongoStats, getRedisStats, getCassandraStats, getLatencyStats } from '../controllers/admin.controller';

const router = Router();

router.get('/stats/postgres',  adminGuard, getPostgresStats);
router.get('/stats/mongo',     adminGuard, getMongoStats);
router.get('/stats/redis',     adminGuard, getRedisStats);
router.get('/stats/cassandra', adminGuard, getCassandraStats);
router.get('/stats/latency',   adminGuard, getLatencyStats);

export default router;

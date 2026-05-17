import { Router } from 'express';
import { adminGuard } from '../middlewares/adminGuard';
import { getPostgresStats, getMongoStats, getRedisStats, getCassandraStats } from '../controllers/admin.controller';

const router = Router();

router.get('/stats/postgres',  adminGuard, getPostgresStats);
router.get('/stats/mongo',     adminGuard, getMongoStats);
router.get('/stats/redis',     adminGuard, getRedisStats);
router.get('/stats/cassandra', adminGuard, getCassandraStats);

export default router;

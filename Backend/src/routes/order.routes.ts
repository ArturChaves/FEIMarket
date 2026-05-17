import { Router } from 'express';
import { checkout, getOrders } from '../controllers/order.controller';

const router = Router();

router.post('/checkout', checkout);
router.get('/:userId',   getOrders);

export default router;

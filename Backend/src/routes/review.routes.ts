import { Router } from 'express';
import { getReviews, createReview } from '../controllers/review.controller';

const router = Router({ mergeParams: true });

router.get('/',  getReviews);
router.post('/', createReview);

export default router;

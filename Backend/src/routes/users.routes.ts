import { Router } from 'express';
import { getUserProfile, updateUserProfile, addBalance } from '../controllers/user.controller';

const router = Router();

router.get('/:id/profile', getUserProfile);
router.put('/:id/profile', updateUserProfile);
router.post('/:id/add-balance', addBalance);

export default router;

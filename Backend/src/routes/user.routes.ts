import { Router } from 'express';
import { getProfile, updateProfile, uploadAvatar, addBalance } from '../controllers/user.controller';
import { upload } from '../middlewares/upload';

const router = Router();

router.get('/:userId/profile',               getProfile);
router.put('/:userId/profile',               updateProfile);
router.patch('/:userId/balance',                         addBalance);
router.post('/:userId/add-balance',                     addBalance);
router.post('/:userId/avatar',  upload.single('avatar'), uploadAvatar);

export default router;

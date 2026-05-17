import { Router } from 'express';
import { getProfile, updateProfile, uploadAvatar } from '../controllers/user.controller';
import { upload } from '../middlewares/upload';

const router = Router();

router.get('/:userId/profile',               getProfile);
router.put('/:userId/profile',               updateProfile);
router.post('/:userId/avatar', upload.single('avatar'), uploadAvatar);

export default router;

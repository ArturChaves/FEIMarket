import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import { upload } from '../middlewares/upload';

const router = Router();

router.get('/',       listProducts);
router.get('/:id',    getProduct);
router.post('/',      upload.array('images'), createProduct);
router.put('/:id',    upload.array('images'), updateProduct);
router.delete('/:id', deleteProduct);

export default router;

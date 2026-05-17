import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} from '../controllers/cart.controller';

const router = Router();

router.get('/:userId',                     getCart);
router.post('/:userId/items',              addItem);
router.put('/:userId/items/:productId',    updateItem);
router.delete('/:userId/items/:productId', removeItem);
router.delete('/:userId',                  clearCart);

export default router;

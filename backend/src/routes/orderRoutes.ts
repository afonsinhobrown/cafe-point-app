import { Router } from 'express';
import { createOrder, getOrders, updateOrderStatus } from '../controllers/orderController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.post('/', createOrder);
router.get('/', getOrders);
router.patch('/:id/status', updateOrderStatus);

export default router;
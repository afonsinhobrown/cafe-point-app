import { Router } from 'express';
import { createOrder, getOrders, updateOrderStatus } from '../controllers/orderController';
import { authenticate, allowRoles } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

// Permissões por papel
const canManageOrders = allowRoles(['ADMIN', 'SUPER_ADMIN', 'WAITER']);
const canHandleKitchen = allowRoles(['ADMIN', 'SUPER_ADMIN', 'KITCHEN', 'WAITER']);

router.post('/', canManageOrders, createOrder);
router.get('/', canHandleKitchen, getOrders);
router.patch('/:id/status', canHandleKitchen, updateOrderStatus);

export default router;
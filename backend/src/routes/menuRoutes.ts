import { Router } from 'express';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController';
import { authenticate, isAdmin, allowRoles } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.get('/', authenticate, allowRoles(['ADMIN', 'SUPER_ADMIN', 'WAITER', 'KITCHEN', 'REGISTRAR']), getMenu);
router.post('/', authenticate, isAdmin, requireTenant, createMenuItem);
router.put('/:id', authenticate, isAdmin, requireTenant, updateMenuItem);
router.delete('/:id', authenticate, isAdmin, requireTenant, deleteMenuItem);

export default router;
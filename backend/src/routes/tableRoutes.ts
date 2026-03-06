import { Router } from 'express';
import { getTables, createTable, updateTable, deleteTable, updateTableStatus } from '../controllers/tableController';
import { authenticate, isAdmin, allowRoles } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.get('/', allowRoles(['ADMIN', 'SUPER_ADMIN', 'WAITER']), getTables);
router.post('/', isAdmin, createTable);
router.put('/:id', isAdmin, updateTable);
router.delete('/:id', isAdmin, deleteTable);
router.patch('/:id/status', allowRoles(['ADMIN', 'SUPER_ADMIN', 'WAITER']), updateTableStatus);

export default router;
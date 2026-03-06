import { Router } from 'express';
import { getExpenses, createExpense, deleteExpense } from '../controllers/expenseController';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticateToken);
router.use(requireTenant);

router.get('/', getExpenses as any);
router.post('/', isAdmin, createExpense as any);
router.delete('/:id', isAdmin, deleteExpense as any);

export default router;

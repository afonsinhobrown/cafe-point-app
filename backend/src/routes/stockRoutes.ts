import { Router } from 'express';
import { getStockMovements, createManualMovement } from '../controllers/stockController';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticateToken);
router.use(requireTenant);

router.get('/movements', getStockMovements);
router.post('/movements', createManualMovement);

export default router;

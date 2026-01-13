import { Router } from 'express';
import { getStockMovements, createManualMovement } from '../controllers/stockController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/movements', getStockMovements);
router.post('/movements', createManualMovement);

export default router;

import { Router } from 'express';
import { getBillingStats, getOrderHistory } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', getBillingStats);
router.get('/history', getOrderHistory);

export default router;

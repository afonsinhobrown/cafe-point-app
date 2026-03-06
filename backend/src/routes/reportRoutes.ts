import { Router } from 'express';
import { getBillingStats, getOrderHistory } from '../controllers/reportController';
import { getAdvancedAnalytics } from '../controllers/analyticsController';
import { getAdvancedReports } from '../controllers/advancedReportsController';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.get('/stats', getBillingStats);
router.get('/history', getOrderHistory);
router.get('/super-reports', getAdvancedReports);
router.get('/advanced', getAdvancedAnalytics);

export default router;

import { Router } from 'express';
import { getBillingStats, getOrderHistory } from '../controllers/reportController';
import { getAdvancedAnalytics } from '../controllers/analyticsController';
import { getAdvancedReports } from '../controllers/advancedReportsController';
import { allowRoles, authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

const canAccessBasicReports = allowRoles(['ADMIN', 'SUPER_ADMIN', 'WAITER']);
const canAccessAdvancedReports = allowRoles(['ADMIN', 'SUPER_ADMIN']);

router.get('/stats', canAccessBasicReports, getBillingStats);
router.get('/history', canAccessBasicReports, getOrderHistory);
router.get('/super-reports', canAccessAdvancedReports, getAdvancedReports);
router.get('/advanced', canAccessAdvancedReports, getAdvancedAnalytics);

export default router;

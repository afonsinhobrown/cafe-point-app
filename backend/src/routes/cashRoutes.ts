import { Router } from 'express';
import { allowRoles, authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import {
    closeCashSession,
    createCashMovement,
    getCashMovements,
    getCashStatus,
    openCashSession
} from '../controllers/cashController';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

const canManageCash = allowRoles(['ADMIN', 'SUPER_ADMIN', 'WAITER']);

router.get('/status', canManageCash, getCashStatus);
router.post('/open', canManageCash, openCashSession);
router.post('/close', canManageCash, closeCashSession);
router.get('/movements', canManageCash, getCashMovements);
router.post('/movements', canManageCash, createCashMovement);

export default router;

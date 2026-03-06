import { Router } from 'express';
import { getPlans, getMySubscription, requestUpgrade } from '../controllers/subscriptionController';
import { authenticateToken } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

// Endpoint público para listar planos (pode ser usado na LP)
router.get('/plans', getPlans);

// Endpoints protegidos do Restaurante
router.get('/me', authenticateToken, requireTenant, getMySubscription);
router.post('/upgrade', authenticateToken, requireTenant, requestUpgrade);

export default router;

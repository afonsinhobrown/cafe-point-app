import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import authRoutes from './authRoutes';
import tableRoutes from './tableRoutes';
import orderRoutes from './orderRoutes';
import menuRoutes from './menuRoutes';
import locationRoutes from './locationRoutes';
import reportRoutes from './reportRoutes';
import stockRoutes from './stockRoutes';
import catalogRoutes from './catalogRoutes';
import adminRoutes from './adminRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import teamRoutes from './teamRoutes';
import restaurantRoutes from './restaurantRoutes';
import expenseRoutes from './expenseRoutes';
import cashRoutes from './cashRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tables', tableRoutes);
router.use('/orders', orderRoutes);
router.use('/menu', menuRoutes);
router.use('/locations', locationRoutes);
router.use('/expenses', expenseRoutes);
router.use('/cash', cashRoutes);
router.use('/reports', authenticateToken, isAdmin, reportRoutes);
router.use('/stock', authenticateToken, isAdmin, stockRoutes);
router.use('/catalog', authenticateToken, isAdmin, catalogRoutes);
router.use('/admin', authenticateToken, adminRoutes);
router.use('/subscription', authenticateToken, isAdmin, subscriptionRoutes);
router.use('/team', authenticateToken, isAdmin, teamRoutes);
router.use('/restaurant', authenticateToken, restaurantRoutes);

import { setupSuperAdmin } from '../controllers/setupController';

// Rota de Emergência
router.get('/setup-admin', setupSuperAdmin as any);

export default router;
import { Router } from 'express';
import authRoutes from './authRoutes';
import tableRoutes from './tableRoutes';
import orderRoutes from './orderRoutes';
import menuRoutes from './menuRoutes';
import locationRoutes from './locationRoutes';
import reportRoutes from './reportRoutes';
import stockRoutes from './stockRoutes';
import catalogRoutes from './catalogRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tables', tableRoutes);
router.use('/orders', orderRoutes);
router.use('/menu', menuRoutes);
router.use('/locations', locationRoutes);
router.use('/reports', reportRoutes);
router.use('/stock', stockRoutes);
router.use('/catalog', catalogRoutes);

export default router;
import { Router } from 'express';
import {
    getAdminStats,
    getAllRestaurants,
    approveRestaurant,
    suspendRestaurant,
    getAdminPlans,
    getAdminFinance,
    createPlan,         // NOVO
    updatePlan,         // NOVO
    getAdminDevices,    // NOVO
    approveDevice,      // NOVO
    blockDevice,        // NOVO
    getRestaurantPlanHistory // NOVO
} from '../controllers/adminController';
import { isSuperAdmin } from '../middleware/auth';

const router = Router();

// Middleware Global de Segurança (Só Super Admin acessa aqui)
router.use(isSuperAdmin);

// Dashboard
router.get('/stats', getAdminStats);
router.get('/finance', getAdminFinance);

// Restaurantes
router.get('/restaurants', getAllRestaurants);
router.post('/restaurants/:id/approve', approveRestaurant);
router.post('/restaurants/:id/suspend', suspendRestaurant);
router.get('/restaurants/:id/history', getRestaurantPlanHistory); // NOVO

// Planos (CRUD Real)
router.get('/plans', getAdminPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);

// Dispositivos (Gestão Real)
router.get('/devices', getAdminDevices);
router.post('/devices/:id/approve', approveDevice);
router.post('/devices/:id/block', blockDevice);

export default router;

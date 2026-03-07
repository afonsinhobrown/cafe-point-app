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
    getRestaurantPlanHistory, // NOVO
    applyPlanToRestaurant,
    getCashBoxes,
    createCashBox,
    updateCashBox,
    deleteCashBox
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
router.post('/restaurants/:id/apply-plan', applyPlanToRestaurant);

// Planos (CRUD Real)
router.get('/plans', getAdminPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);

// Dispositivos (Gestão Real)
router.get('/devices', getAdminDevices);
router.post('/devices/:id/approve', approveDevice);
router.post('/devices/:id/block', blockDevice);

// Cash Boxes (Caixas/Gavetas)
router.get('/restaurants/:restaurantId/cashboxes', getCashBoxes);
router.post('/restaurants/:restaurantId/cashboxes', createCashBox);
router.put('/restaurants/:restaurantId/cashboxes/:boxId', updateCashBox);
router.delete('/restaurants/:restaurantId/cashboxes/:boxId', deleteCashBox);

export default router;

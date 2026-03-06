import { Router } from 'express';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../controllers/locationController';
import { authenticate, isAdmin, allowRoles } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';

const router = Router();

router.use(authenticate);
router.use(requireTenant);

router.get('/', allowRoles(['ADMIN', 'SUPER_ADMIN', 'WAITER']), getLocations);
router.post('/', isAdmin, createLocation);
router.put('/:id', isAdmin, updateLocation);
router.delete('/:id', isAdmin, deleteLocation);

export default router;

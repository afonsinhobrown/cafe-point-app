import { Router } from 'express';
import { getBrands, createBrand, deleteBrand, getSuppliers, createSupplier, deleteSupplier } from '../controllers/catalogController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/brands', getBrands);
router.post('/brands', isAdmin, createBrand);
router.delete('/brands/:id', isAdmin, deleteBrand);

router.get('/suppliers', getSuppliers);
router.post('/suppliers', isAdmin, createSupplier);
router.delete('/suppliers/:id', isAdmin, deleteSupplier);

export default router;

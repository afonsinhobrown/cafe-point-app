import { Router } from 'express';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../controllers/menuController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getMenu);
router.post('/', authenticate, createMenuItem);
router.put('/:id', authenticate, updateMenuItem);
router.delete('/:id', authenticate, deleteMenuItem);

export default router;
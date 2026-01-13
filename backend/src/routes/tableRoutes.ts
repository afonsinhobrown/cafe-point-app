import { Router } from 'express';
import { getTables, createTable, updateTable, deleteTable, updateTableStatus } from '../controllers/tableController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/', getTables);
router.post('/', createTable);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);
router.patch('/:id/status', updateTableStatus);

export default router;
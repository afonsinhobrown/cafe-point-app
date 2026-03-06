import { Router } from 'express';
import { getTeamMembers, addTeamMember, removeTeamMember } from '../controllers/teamController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();

// Todas rotas protegidas
router.use(authenticateToken);

// Apenas Admin do restaurante (ou Super Admin) pode gerir equipe
router.get('/', isAdmin, getTeamMembers);
router.post('/', isAdmin, addTeamMember);
router.delete('/:id', isAdmin, removeTeamMember);

export default router;

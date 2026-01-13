import { Router } from 'express';
import * as AuthController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Rota normal (POST)
router.post('/login', AuthController.login);

// 🚨 ROTA DE EMERGÊNCIA (GET) para contornar bloqueio de POST em Tuneis Mobile
// Uso: /api/auth/login-via-get?email=admin&password=123
router.get('/login-via-get', async (req, res) => {
    // Adapter para fazer o controller achar que é um POST com body
    req.body = req.query;
    return AuthController.login(req, res);
});
router.get('/profile', authenticate, AuthController.getProfile);

export default router;
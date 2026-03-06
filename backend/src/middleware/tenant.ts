import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireTenant = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Verifica se o usuário autenticado tem um restaurantId vinculado
    if (!req.user || !req.user.restaurantId) {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Identificação do restaurante inválida ou ausente (Tenant ID missing).'
        });
    }

    // Opcional: Aqui poderíamos validar se o Tenant está ativo no cache/banco
    // Por performance, confiamos no token JWT que tem validade curta, 
    // mas para sistemas críticos, validaríamos no Redis/DB aqui.

    next();
};

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';  // ← MUDAR PARA IMPORT *

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
        name: string;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Dev bypass: permitir chamadas sem token em ambiente de desenvolvimento
    const devBypass = process.env.NODE_ENV !== 'production' || process.env.SKIP_AUTH === 'true';
    if (!token && devBypass) {
        req.user = {
            id: parseInt(process.env.DEV_USER_ID || '1'),
            username: process.env.DEV_USER_EMAIL || 'admin',
            role: (process.env.DEV_USER_ROLE || 'ADMIN'),
            name: process.env.DEV_USER_NAME || 'Dev User'
        };
        return next();
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acesso negado. Token não fornecido.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido.'
        });
    }
};

export const authenticateToken = authenticate;

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Acesso negado. Requer privilégios de administrador.'
        });
    }
    next();
};
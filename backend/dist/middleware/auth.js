"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt = __importStar(require("jsonwebtoken")); // ← MUDAR PARA IMPORT *
const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    // Dev bypass: permitir chamadas sem token em ambiente de desenvolvimento
    const devBypass = process.env.NODE_ENV !== 'production' || process.env.SKIP_AUTH === 'true';
    if (!token && devBypass) {
        req.user = {
            id: parseInt(process.env.DEV_USER_ID || '1'),
            email: process.env.DEV_USER_EMAIL || 'admin@cafepoint.local',
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido.'
        });
    }
};
exports.authenticate = authenticate;

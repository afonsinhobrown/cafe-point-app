import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';

import routes from './routes';
import { setupSocket } from './utils/socket';
import { verifyLicense } from './utils/licenseManager';
import { authenticate } from './middleware/auth';
import prisma from './config/database';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
});

// Middleware para tornar o io acessível nas rotas
app.use((req, res, next) => {
    (req as any).io = io;
    next();
});

// ✅ SaaS Mode: Sem verificação de arquivo local
// Licenças são validadas por autenticação + banco de dados
// Não há fallback offline se não conseguir conectar ao banco
app.use((req, res, next) => {
    // Pular verificação para license-status e arquivos estáticos
    if (req.path === '/api/license-status' || !req.path.startsWith('/api')) {
        return next();
    }
    // Para todas as rotas de API, a autenticação (middleware) verifica licença via banco
    next();
});

// Middleware
app.use((req, res, next) => { // Logging simples
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

// Configuração CORS Robusta
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ Forçar Headers para evitar bloqueios de Preflight
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// ✅ Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        time: new Date().toISOString()
    });
});

// ✅ License Status - SaaS Mode (Internet Obrigatória)
app.get('/api/license-status', authenticate, async (req, res) => {
    try {
        const user = (req as any).user;

        if (!user || !user.restaurantId) {
            return res.status(401).json({
                valid: false,
                message: 'Autenticação obrigatória',
                licenseError: true
            });
        }

        // 🔴 MODO SAAS: Buscar APENAS do banco de dados
        // SEM FALLBACK OFFLINE
        const license = await prisma.license.findUnique({
            where: { restaurantId: user.restaurantId },
            include: { plan: true }
        });

        if (!license) {
            return res.status(404).json({
                valid: false,
                message: 'Licença não encontrada para este restaurante',
                daysRemaining: 0,
                licenseError: true
            });
        }

        // Verificar expiração
        const now = new Date();
        let endDate = license.endDate ? new Date(license.endDate) : null;
        if (!endDate && license.startDate && license.plan?.duration) {
            endDate = new Date(license.startDate);
            endDate.setDate(endDate.getDate() + license.plan.duration);
        }
        if (!endDate) {
            return res.status(500).json({
                valid: false,
                message: 'Data de expiração não configurada',
                licenseError: true
            });
        }
        const diffTime = endDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Se expirou, retornar com dias zerados
        const isValid = daysRemaining > 0;

        return res.json({
            valid: isValid,
            daysRemaining: Math.max(0, daysRemaining),
            expiryDate: endDate,
            startDate: license.startDate,
            restaurantName: user.restaurantName || 'Restaurante',
            planName: license.plan?.name,
            planId: license.planId,
            status: license.status,
            source: 'DATABASE',  // Sempre database (SaaS)
            message: isValid ? 'Licença ativa' : 'Licença expirada'
        });

    } catch (error) {
        console.error('💥 Erro ao verificar status de licença:', error);

        // Se não conseguir conectar ao banco, retornar erro
        return res.status(503).json({
            valid: false,
            message: 'Serviço indisponível. Verifique sua conexão de internet e tente novamente.',
            licenseError: true,
            daysRemaining: 0,
            source: 'ERROR'
        });
    }
});

// ✅ Rotas da API
app.use('/api', routes);

// Socket.io
setupSocket(io);

// ✅ Servir Arquivos Estáticos do Frontend (Produção)
// Resolve both layouts: dist/public (local build) and /app/public (Docker image copy).
const publicCandidates = [
    path.join(__dirname, '../public'),
    path.join(process.cwd(), 'public')
];
const publicPath = publicCandidates.find((p) => fs.existsSync(p)) || publicCandidates[0];

const uploadsCandidates = [
    path.join(__dirname, '../uploads'),
    path.join(process.cwd(), 'uploads')
];
const uploadsPath = uploadsCandidates.find((p) => fs.existsSync(p)) || uploadsCandidates[0];

try {
    if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log('✅ Uploads directory created');
    }
    if (fs.existsSync(publicPath)) {
        console.log('📂 Static Path:', publicPath);
        app.use(express.static(publicPath));
    } else {
        console.warn('⚠️ Public path not found. Candidates:', publicCandidates);
    }
    app.use('/uploads', express.static(uploadsPath));
} catch (error) {
    console.error('❌ Error setting up static paths:', error);
}

// ✅ Fallback para SPA (React Router)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: 'Frontend nao encontrado. Verifique a pasta public.' });
    }
});

// ✅ 404 Handler
app.all('*', (req, res) => {
    res.status(404).json({ error: 'Rota nao encontrada' });
});

export default httpServer;
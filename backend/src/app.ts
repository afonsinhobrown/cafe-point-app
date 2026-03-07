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

// ✅ Verificação de Licença Global
app.use((req, res, next) => {
    if (req.path === '/api/license-status' || !req.path.startsWith('/api')) {
        return next();
    }

    const license = verifyLicense();
    if (!license.valid) {
        console.log(`🚫 [LICENSE BLOCK] Path: ${req.path} | Reason: ${license.error}`);
        return res.status(403).json({
            success: false,
            licenseError: true,
            message: license.error,
            machineId: license.machineId
        });
    }
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

// ✅ License Status (Autenticado - para usuários logados)
app.get('/api/license-status', authenticate, async (req, res) => {
    try {
        // Obter usuário autenticado para licença real do restaurante
        const user = (req as any).user;

        if (user && user.restaurantId) {
            // Buscar licença real do banco de dados
            const license = await prisma.license.findUnique({
                where: { restaurantId: user.restaurantId },
                include: { plan: true }
            });

            if (license && license.endDate) {
                const now = new Date();
                const endDate = new Date(license.endDate);
                const diffTime = endDate.getTime() - now.getTime();
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return res.json({
                    valid: daysRemaining > 0,
                    daysRemaining: Math.max(0, daysRemaining),
                    expiryDate: license.endDate,
                    startDate: license.startDate,
                    restaurantName: user.restaurantName || 'Restaurante',
                    planName: license.plan?.name,
                    status: license.status
                });
            }
        }

        // Se não encontrou licença no banco, retornar erro
        return res.status(404).json({
            valid: false,
            message: 'Licença não encontrada para este restaurante',
            daysRemaining: 0
        });
    } catch (error) {
        console.error('Erro ao obter status de licença:', error);
        res.status(500).json({ valid: false, message: 'Erro ao verificar licença' });
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
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

// ✅ License Status
app.get('/api/license-status', (req, res) => {
    const result = verifyLicense();
    if (!result.valid) {
        return res.status(403).json({
            valid: false,
            message: result.error,
            machineId: result.machineId,
            licenseError: true
        });
    }
    res.json({
        valid: true,
        daysRemaining: result.daysRemaining,
        expiryDate: result.data?.expiryDate,
        restaurantName: result.data?.restaurantName,
        machineId: result.machineId
    });
});

// ✅ Rotas da API
app.use('/api', routes);

// Socket.io
setupSocket(io);

// ✅ Servir Arquivos Estáticos do Frontend (Produção)
// NOTA: O instalador copia o frontend para 'backend/dist/public'
// Como este ficheiro compilado vive em 'backend/dist/src/app.js', subir um nível (../) leva a 'backend/dist'.
// Portanto '../public' aponta corretamente para 'backend/dist/public'.
const publicPath = path.join(__dirname, '../public');
const uploadsPath = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

console.log('📂 Static Path:', publicPath);
app.use(express.static(publicPath));
app.use('/uploads', express.static(uploadsPath));

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
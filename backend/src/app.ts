import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';

import routes from './routes';
import { setupSocket } from './utils/socket';

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

// Middleware
// app.use(helmet()); // Desativado temporariamente para debug
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});
// Configuração CORS Robusta (Credenciais + Origem Dinâmica)
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ Forçar Headers para evitar bloqueios de Preflight (OPTIONS) em Mobile
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.header("Access-Control-Allow-Credentials", "true");

    // Se for OPTIONS (Preflight), responde OK imediatamente
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Rota raiz (/) redirecionada para o Frontend (React) pelo handler estático abaixo

// ✅ Health Check (Mais detalhado)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        serverTime: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        service: 'CaféPoint API'
    });
});

// ✅ Rotas da API
app.use('/api', routes);

// Socket.io (Restaurado)
setupSocket(io);

// ✅ Servir Arquivos Estáticos do Frontend (Produção)
// O Vite gera o build na pasta 'dist', nós copiamos para 'public' no backend
const publicPath = path.join(process.cwd(), 'public');
console.log('📂 Static Path:', publicPath);
app.use(express.static(publicPath));

// ✅ Fallback para SPA (React Router) - Qualquer rota não-API retorna o index.html
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next(); // Se for API, passa para o handler 404 abaixo
    }
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('❌ Erro ao servir index.html:', err);
            res.status(404).json({ error: 'Frontend não encontrado. Execute o script de build.' });
        }
    });
});

// ✅ Rota padrão para 404 (Tratamento de erro da API)
app.all('*', (req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.originalUrl,
        method: req.method,
        availableMainEndpoints: ['/api/auth', '/api/orders', '/api/menu']
    });
});

export default httpServer;
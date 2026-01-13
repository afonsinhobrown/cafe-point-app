import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    build: {
        target: 'es2015', // 📱 Compatibilidade melhorada para mobile
        outDir: 'dist',
    },
    server: {
        port: 3000,
        host: true,
        hmr: {
            clientPort: 443
        },
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
                secure: false,
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('❌ Proxy Error:', err);
                    });
                    proxy.on('proxyReq', (_proxyReq, req, _res) => {
                        console.log('➡️ Enviando Pedido:', req.method, req.url);
                    });
                    proxy.on('proxyRes', (proxyRes, req, _res) => {
                        console.log('⬅️ Recebendo Resposta:', proxyRes.statusCode, req.url);
                    });
                }
            }
        },
        allowedHosts: [
            'cafepoint-app.serveousercontent.com',
            '.serveo.net',
            '.serveousercontent.com'
        ]
    }
})
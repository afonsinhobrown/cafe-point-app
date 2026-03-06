import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            devOptions: { enabled: true },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'Cafe Point SaaS',
                short_name: 'CafePoint',
                description: 'Sistema de Gestão de Restaurantes Premium',
                theme_color: '#0ea5e9',
                background_color: '#020617',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
    build: {
        target: 'es2015',
        outDir: 'dist',
    },
    server: {
        port: 3000,
        host: true,
        // hmr: {
        //    clientPort: 443
        // },
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
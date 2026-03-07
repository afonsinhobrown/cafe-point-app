import axios from 'axios';

const API_BASE_URL = '/api';
console.log('🔗 API Base URL (v3 - Relativo):', API_BASE_URL);

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para adicionar token às requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }
);

// Interceptor para tratar erros e offline
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Tratar erro de Autenticação (401)
        if (error.response?.status === 401) {
            console.warn('⚠️ Sessão expirada ou inválida. Limpando dados...');

            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Evitar loop infinito de recarga se já estivermos na página de login
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login?expired=true';
            }

            return Promise.reject(error);
        }

        // Tratar erro de Conexão (Offline) apenas para mutações
        if (!error.response && error.code === 'ERR_NETWORK') {
            const method = originalRequest.method?.toLowerCase();
            if (['post', 'put', 'patch', 'delete'].includes(method || '')) {
                console.log('📶 Detectado modo offline. Enfileirando requisição:', originalRequest.url);

                // Import dinâmico para evitar dependências circulares
                const { queueOfflineRequest } = await import('./db');
                await queueOfflineRequest(originalRequest.url, method!, originalRequest.data);

                // Retornar um sucesso "falso" para a UI continuar fluindo
                return Promise.resolve({
                    data: {
                        success: true,
                        data: {},
                        message: 'Operação salva offline',
                        offline: true
                    }
                });
            }
        }

        // Tratar erro de Licença (403)
        if (error.response?.status === 403 && error.response.data?.licenseError) {
            console.error('🛑 Bloqueio de Licença Detectado via API.');
            // Forçar reload da página para o App.tsx assumir o controle do bloqueio
            if (!window.location.pathname.includes('/license-error')) {
                window.location.reload();
            }
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

// Menu
export const getMenu = (params?: any) => api.get('/menu', { params });
export const createMenuItem = (data: any) => api.post('/menu', data);
export const updateMenuItem = (id: number, data: any) => api.put(`/menu/${id}`, data);
export const deleteMenuItem = (id: number) => api.delete(`/menu/${id}`);
export const createOrder = (data: any) => api.post('/orders', data);
export const getOrders = (params?: any) => api.get('/orders', { params });
export const updateOrderStatus = (id: number, status: string) => api.patch(`/orders/${id}/status`, { status });

// Tables
export const getTables = () => api.get('/tables');
export const createTable = (data: any) => api.post('/tables', data);
export const updateTable = (id: number, data: any) => api.put(`/tables/${id}`, data);
export const deleteTable = (id: number) => api.delete(`/tables/${id}`);

// Stock
export const getStockMovements = (params?: any) => api.get('/stock/movements', { params });
export const createStockMovement = (data: any) => api.post('/stock/movements', data);

// Locations
export const getLocations = () => api.get('/locations');
export const createLocation = (data: any) => api.post('/locations', data);
export const updateLocation = (id: number, data: any) => api.put(`/locations/${id}`, data);
export const deleteLocation = (id: number) => api.delete(`/locations/${id}`);

// Catalog (Brands & Suppliers)
export const getBrands = () => api.get('/catalog/brands');
export const createBrand = (data: any) => api.post('/catalog/brands', data);
export const deleteBrand = (id: number) => api.delete(`/catalog/brands/${id}`);

export const getSuppliers = () => api.get('/catalog/suppliers');
export const createSupplier = (data: any) => api.post('/catalog/suppliers', data);
export const deleteSupplier = (id: number) => api.delete(`/catalog/suppliers/${id}`);

// Reports & History
export const getStats = (period: string) => api.get(`/reports/stats?period=${period}`);
export const getOrderHistory = (params: any) => api.get('/reports/history', { params });

// Cash / Caixa
export const getCashStatus = () => api.get('/cash/status');
export const openCashSession = (data: { openingBalance: number; notes?: string }) => api.post('/cash/open', data);
export const closeCashSession = (data: { closingBalance?: number; notes?: string }) => api.post('/cash/close', data);
export const getCashMovements = (params?: any) => api.get('/cash/movements', { params });
export const createCashMovement = (data: { type: 'ENTRY' | 'WITHDRAWAL' | 'INTERNAL_TRANSFER'; amount: number; description?: string }) => api.post('/cash/movements', data);

// Auth (SaaS)
export const registerRestaurant = (data: any) => api.post('/auth/register-restaurant', data);

// Super Admin
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminRestaurants = (params?: any) => api.get('/admin/restaurants', { params });
export const updateRestaurantStatus = (id: number, status: string) => api.put(`/admin/restaurants/${id}/status`, { status });

// License
export const getLicenseStatus = () => api.get('/license-status');

// Restaurant Settings
export const getRestaurantSettings = () => api.get('/restaurant');
export const updateRestaurantSettings = (data: any) => {
    // Check if it's FormData
    if (data instanceof FormData) {
        return api.put('/restaurant', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
    return api.put('/restaurant', data);
};
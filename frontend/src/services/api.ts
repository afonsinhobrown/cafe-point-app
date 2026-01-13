import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
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
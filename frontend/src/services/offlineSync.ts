// @ts-nocheck
import { initDB, saveToLocal, getSyncQueue, clearSyncItem } from './db';
import { api, getMenu, getTables } from './api';

export const syncDown = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!navigator.onLine || !token) return;

        console.log('🔄 Baixando dados para uso offline...');

        // 1. Menu
        const menuRes = await getMenu({ all: 'true' });
        if (menuRes.data.success) {
            await saveToLocal('products', menuRes.data.data);
        }

        // 2. Tables
        const tableRes = await getTables(); // Assuming api export exists
        if (tableRes.data.success) {
            await saveToLocal('tables', tableRes.data.data);
        }

        console.log('✅ Dados offline atualizados.');
        localStorage.setItem('lastSync', new Date().toISOString());

    } catch (error) {
        console.error('Erro no Sync Down:', error);
    }
};

export const syncUp = async () => {
    if (!navigator.onLine) return;

    try {
        const queue = await getSyncQueue();
        if (queue.length === 0) return;

        console.log(`📡 Processando ${queue.length} itens da fila offline...`);

        for (const item of queue) {
            try {
                // Replay request
                // Note: Authorization header is handled by api interceptor
                await api.request({
                    method: item.method,
                    url: item.url,
                    data: item.body
                });

                // Remove from queue if successful
                await clearSyncItem(item.id as number);
                console.log(`✅ Item ${item.id} sincronizado.`);
            } catch (error) {
                console.error(`❌ Falha ao sincronizar item ${item.id}:`, error);
                // Keep in queue? Or move to 'failed' list? 
                // For now keep, but maybe implement max retries later.
            }
        }
    } catch (error) {
        console.error('Erro no Sync Up:', error);
    }
};

// Auto-Sync Hook
export const startAutoSync = () => {
    window.addEventListener('online', () => {
        console.log('🌐 Conexão restaurada. Iniciando Sync...');
        syncUp();
    });

    // Initial Sync
    syncUp();
    syncDown();

    // Periodic Sync (every 5 min)
    setInterval(syncDown, 5 * 60 * 1000);
};

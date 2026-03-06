import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CafePointDB extends DBSchema {
    products: {
        key: number;
        value: any;
    };
    tables: {
        key: number;
        value: any;
    };
    orders: {
        key: string; // Temporary offline ID (uuid)
        value: any;
    };
    syncQueue: {
        key: number;
        value: {
            url: string;
            method: string;
            body: any;
            timestamp: number;
        };
        indexes: { 'timestamp': number };
    };
}

let dbPromise: Promise<IDBPDatabase<CafePointDB>>;

export const initDB = async () => {
    if (!dbPromise) {
        dbPromise = openDB<CafePointDB>('cafe-point-db', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('products')) {
                    db.createObjectStore('products', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('tables')) {
                    db.createObjectStore('tables', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('orders')) {
                    db.createObjectStore('orders', { keyPath: 'offlineId' });
                }
                if (!db.objectStoreNames.contains('syncQueue')) {
                    const store = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp');
                }
            },
        });
    }
    return dbPromise;
};

// --- Generic Helpers ---

export const saveToLocal = async (storeName: 'products' | 'tables', data: any[]) => {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    // Clear old cache first to ensure freshness
    // Note: In a smarter app we might diff, but for now replace all is safer for consistency
    await tx.objectStore(storeName).clear();
    for (const item of data) {
        await tx.objectStore(storeName).put(item);
    }
    await tx.done;
    console.log(`[OfflineDB] Cached ${data.length} items in ${storeName}`);
};

export const getFromLocal = async (storeName: 'products' | 'tables' | 'orders') => {
    const db = await initDB();
    return await db.getAll(storeName);
};

export const queueOfflineRequest = async (url: string, method: string, body: any) => {
    const db = await initDB();
    await db.add('syncQueue', {
        url,
        method,
        body,
        timestamp: Date.now()
    });
    console.log('[OfflineDB] Request queued for sync:', url);
};

export const getSyncQueue = async () => {
    const db = await initDB();
    return await db.getAllFromIndex('syncQueue', 'timestamp');
};

export const clearSyncItem = async (id: number) => {
    const db = await initDB();
    await db.delete('syncQueue', id);
};

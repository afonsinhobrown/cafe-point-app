export interface User {
    id: number;
    name: string;
    email: string;
    role: 'WAITER' | 'KITCHEN' | 'ADMIN';
}

export interface Location {
    id: number;
    name: string;
    description?: string;
}

export interface Table {
    id: number;
    number: number;
    capacity: number;
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
    location: string;
    locationId?: number;
    type: string;
    currentStatus: string;
}

export interface Brand {
    id: number;
    name: string;
}

export interface Supplier {
    id: number;
    name: string;
    nuit?: string;
    email?: string;
    phone?: string;
    address?: string;
    description?: string;
}

export interface MenuItem {
    id: number;
    name: string;
    description?: string;
    price: number;
    costPrice?: number;
    category: string;

    brandId?: number;
    brand?: Brand;

    supplierId?: number;
    supplier?: Supplier;

    volume?: string;
    unit?: string;
    barcode?: string;
    expiryDate?: string;
    imageUrl?: string;
    isAvailable: boolean;
    stockQuantity?: number | null;
    minStock?: number | null;
    maxStock?: number | null;
}

export interface Order {
    id: number;
    tableId: number;
    userId: number;
    status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'CANCELLED';
    totalAmount: number;
    createdAt: string;
    table: {
        id: number;
        number: number;
        location?: Location;
    };
    user: {
        id: number;
        name: string;
    };
    orderItems: OrderItem[];
}

export interface OrderItem {
    id: number;
    quantity: number;
    notes?: string;
    price: number;
    menuItem: MenuItem;
}
import React, { useState, useEffect } from 'react';
import { Table, MenuItem, Order } from '../types';
import { getMenu, createOrder, updateOrderStatus, getOrders } from '../services/api';
import './OrderModal.css';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    table: Table | null;
    onOrderCreated: () => void;
}

interface CartItem {
    menuItem: MenuItem;
    quantity: number;
    notes?: string;
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, table, onOrderCreated }) => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (isOpen && table) {
            loadMenu();
            setCart([]);
            setCurrentOrder(null);

            if (table.currentStatus === 'OCCUPIED' || table.currentStatus === 'PREPARING' || table.currentStatus === 'READY' || table.currentStatus === 'PENDING') {
                loadActiveOrder(table.id);
            }
        }
    }, [isOpen, table]);

    const loadActiveOrder = async (tableId: number) => {
        try {
            const response = await getOrders({
                tableId,
                status: 'PENDING,PREPARING,READY,DELIVERED'
            });
            if (response.data.data && response.data.data.length > 0) {
                setCurrentOrder(response.data.data[0]);
            }
        } catch (error) {
            console.error('Erro ao carregar pedido ativo:', error);
        }
    };

    const loadMenu = async () => {
        try {
            const response = await getMenu();
            const items = response.data.data;
            setMenuItems(items);

            // Extrair categorias únicas
            const cats = Array.from(new Set(items.map((item: MenuItem) => item.category)));
            setCategories(cats as string[]);
            if (cats.length > 0) setSelectedCategory(cats[0] as string);
        } catch (error) {
            console.error('Erro ao carregar menu:', error);
        }
    };

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.menuItem.id === item.id);
            if (existing) {
                return prev.map(i =>
                    i.menuItem.id === item.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...prev, { menuItem: item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId: number) => {
        setCart(prev => prev.filter(i => i.menuItem.id !== itemId));
    };

    const updateQuantity = (itemId: number, delta: number) => {
        setCart(prev => {
            return prev.map(i => {
                if (i.menuItem.id === itemId) {
                    const newQty = i.quantity + delta;
                    return newQty > 0 ? { ...i, quantity: newQty } : i;
                }
                return i;
            });
        });
    };

    const handleCreateOrder = async () => {
        if (!table || cart.length === 0) return;

        try {
            setIsLoading(true);
            const orderData = {
                tableId: table.id,
                items: cart.map(item => ({
                    menuItemId: item.menuItem.id,
                    quantity: item.quantity,
                    notes: item.notes
                }))
            };

            await createOrder(orderData);
            onOrderCreated();
            onClose();
        } catch (error) {
            console.error('Erro ao criar pedido:', error);
            alert('Erro ao criar pedido. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!currentOrder || !table) return;

        try {
            setIsLoading(true);
            await updateOrderStatus(currentOrder.id, newStatus);
            if (newStatus === 'PAID') {
                onOrderCreated(); // Atualizar lista de mesas
                onClose();
            } else {
                await loadActiveOrder(table.id); // Recarregar pedido para ver novo status
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status do pedido.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayOrder = () => {
        if (!currentOrder) return;
        if (window.confirm(`Tem certeza que deseja confirmar o pagamento de MT ${currentOrder.totalAmount.toFixed(2)}?`)) {
            handleUpdateStatus('PAID');
        }
    };

    const handleConfirmDelivery = () => {
        if (window.confirm("Confirmar que o pedido foi entregue à mesa?")) {
            handleUpdateStatus('SERVED');
        }
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
    };

    const handlePrintOrder = () => {
        window.print();
    };

    if (!isOpen || !table) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content order-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>Mesa {table.number}</h2>
                        <span className="subtitle">{table.location} • {table.capacity} lugares</span>
                        {currentOrder && <span className="order-status-badge">{currentOrder.status}</span>}
                    </div>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="order-layout">
                    {/* Menu Section - Only show if we want to add items (future feature) or if creating new order */}
                    {!currentOrder && (
                        <div className="menu-section">
                            <div className="category-tabs">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="menu-grid">
                                {menuItems
                                    .filter(item =>
                                        item.category === selectedCategory &&
                                        (item.category !== 'Bebidas' || item.stockQuantity == null || (item.stockQuantity !== undefined && item.stockQuantity > 0))
                                    )
                                    .map(item => (
                                        <div key={item.id} className="menu-item-card" onClick={() => addToCart(item)}>
                                            <div className="item-info">
                                                <h4>{item.name}</h4>
                                                <p>{item.description}</p>
                                                <span className="price">MT {item.price.toFixed(2)}</span>
                                            </div>
                                            <button className="add-btn">➕</button>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )}

                    {/* Cart/Order Section */}
                    <div className={`cart-section ${currentOrder ? 'full-width' : ''}`}>
                        <h3>{currentOrder ? '📋 Pedido Atual' : '🛒 Novo Pedido'}</h3>

                        <div className="cart-items">
                            {currentOrder ? (
                                // Display Existing Order
                                currentOrder.orderItems.map((item: any) => (
                                    <div key={item.id} className="cart-item">
                                        <div className="cart-item-info">
                                            <h4>{item.menuItem.name}</h4>
                                            <span className="item-price">MT {(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                        <div className="quantity-display">
                                            <span>{item.quantity}x</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                // Display Cart (New Order)
                                cart.length === 0 ? (
                                    <div className="empty-cart">
                                        <p>Selecione itens do menu para adicionar ao pedido</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.menuItem.id} className="cart-item">
                                            <div className="cart-item-info">
                                                <h4>{item.menuItem.name}</h4>
                                                <span className="item-price">MT {(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                            <div className="quantity-controls">
                                                <button onClick={() => updateQuantity(item.menuItem.id, -1)}>-</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.menuItem.id, 1)}>+</button>
                                                <button className="remove-btn" onClick={() => removeFromCart(item.menuItem.id)}>🗑️</button>
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>

                        <div className="cart-footer">
                            <div className="total-row">
                                <span>Total</span>
                                <span className="total-amount">
                                    MT {currentOrder ? currentOrder.totalAmount.toFixed(2) : calculateTotal().toFixed(2)}
                                </span>
                            </div>
                            {!currentOrder && (
                                <button
                                    className="submit-order-btn"
                                    disabled={cart.length === 0 || isLoading}
                                    onClick={handleCreateOrder}
                                >
                                    {isLoading ? 'Enviando...' : '✅ Confirmar Pedido'}
                                </button>
                            )}
                            {currentOrder && (
                                <div className="order-actions">
                                    <button className="action-btn print-btn" onClick={handlePrintOrder}>🖨️ Imprimir</button>

                                    {currentOrder.status === 'READY' && (
                                        <button
                                            className="action-btn serve-btn"
                                            onClick={handleConfirmDelivery}
                                            disabled={isLoading}
                                        >
                                            🍽️ Confirmar Entrega
                                        </button>
                                    )}

                                    {(currentOrder.status === 'SERVED' || currentOrder.status === 'READY' || currentOrder.status === 'PENDING' || currentOrder.status === 'PREPARING') && (
                                        <button
                                            className="action-btn pay-btn"
                                            onClick={handlePayOrder}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Processando...' : '💳 Pagar'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderModal;

import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { getOrders, updateOrderStatus } from '../services/api';
import './Kitchen.css'; // Reusing Kitchen styles for consistency

const Bar: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadOrders = async () => {
        try {
            setIsLoading(true);
            const response = await getOrders({ status: 'PENDING,PREPARING,READY' });
            setOrders(response.data.data);
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
            setError('Erro ao carregar pedidos para o bar.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            loadOrders();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status do pedido.');
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pendente';
            case 'PREPARING': return 'Preparando';
            case 'READY': return 'Pronto';
            default: return status;
        }
    };

    // Filter Logic: Only 'Bebidas'
    const isBarItem = (category: string) => {
        return category === 'Bebidas';
    };

    if (isLoading && orders.length === 0) return <div className="kitchen-page">A carregar pedidos do bar...</div>;

    const barOrders = orders.filter(order =>
        order.orderItems.some(item => isBarItem(item.menuItem.category))
    );

    return (
        <div className="kitchen-page">
            <header className="kitchen-header">
                <h1 style={{ color: '#0ea5e9' }}>🍹 Bar / Copa</h1>
                <button onClick={loadOrders} className="refresh-btn">🔄 Atualizar</button>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="orders-grid">
                {barOrders.map(order => {
                    const barItems = order.orderItems.filter(item => isBarItem(item.menuItem.category));

                    return (
                        <div key={order.id} className={`order-card status-${order.status.toLowerCase()}`}>
                            <div className="order-card-header">
                                <h3>Mesa {order.table.number} - <span className="kitchen-location-tag">{order.table.location?.name || 'Geral'}</span></h3>
                                <span className="order-time">
                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="order-items-list">
                                {barItems.map(item => (
                                    <div key={item.id} className="kitchen-item">
                                        <span className="item-qty">{item.quantity}x</span>
                                        <span className="item-name">{item.menuItem.name}</span>
                                        {item.notes && <p className="item-notes">📝 {item.notes}</p>}
                                    </div>
                                ))}
                            </div>

                            <div className="order-card-footer">
                                <span className="status-label">{getStatusText(order.status)}</span>
                                <div className="status-actions">
                                    {/* Simplified flow for drinks? Maybe just Ready? */}
                                    {/* Using same flow as Kitchen for consistency */}
                                    {order.status === 'PENDING' && (
                                        <button onClick={() => handleUpdateStatus(order.id, 'PREPARING')} className="btn-prepare">
                                            🍹 Preparar
                                        </button>
                                    )}
                                    {order.status === 'PREPARING' && (
                                        <button onClick={() => handleUpdateStatus(order.id, 'READY')} className="btn-ready">
                                            ✅ Pronto
                                        </button>
                                    )}
                                    {order.status === 'READY' && (
                                        <button onClick={() => handleUpdateStatus(order.id, 'SERVED')} className="btn-serve">
                                            🍽️ Entregue
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {barOrders.length === 0 && (
                    <div className="empty-state">
                        <p>🍸 Sem pedidos de bebidas pendentes!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bar;

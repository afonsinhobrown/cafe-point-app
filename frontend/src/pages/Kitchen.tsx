import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { getOrders, updateOrderStatus } from '../services/api';
import './Kitchen.css';

const Kitchen: React.FC = () => {
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
            setError('Erro ao carregar pedidos para a cozinha.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        // Em um app real, usaríamos Socket.io aqui. 
        // Por enquanto, vamos fazer um polling simples a cada 30 segundos
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

    if (isLoading && orders.length === 0) return <div className="kitchen-page">A carregar pedidos...</div>;

    return (
        <div className="kitchen-page">
            <header className="kitchen-header">
                <h1>🍳 Cozinha</h1>
                <button onClick={loadOrders} className="refresh-btn">🔄 Atualizar</button>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="orders-grid">
                {orders.map(order => (
                    <div key={order.id} className={`order-card status-${order.status.toLowerCase()}`}>
                        <div className="order-card-header">
                            <h3>Mesa {order.table.number} - <span className="kitchen-location-tag">{order.table.location?.name || 'Geral'}</span></h3>
                            <span className="order-time">
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        <div className="order-items-list">
                            {order.orderItems.map(item => (
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
                                {order.status === 'PENDING' && (
                                    <button
                                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                                        className="btn-prepare"
                                    >
                                        👨‍🍳 Preparar
                                    </button>
                                )}
                                {order.status === 'PREPARING' && (
                                    <button
                                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                                        className="btn-ready"
                                    >
                                        ✅ Pronto
                                    </button>
                                )}
                                {order.status === 'READY' && (
                                    <button
                                        onClick={() => handleUpdateStatus(order.id, 'SERVED')}
                                        className="btn-serve"
                                    >
                                        🍽️ Entregue
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {orders.length === 0 && (
                    <div className="empty-state">
                        <p>🎉 Sem pedidos pendentes no momento!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Kitchen;

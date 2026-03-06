import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOrders, updateOrderStatus } from '../services/api';
import './WaiterOrders.css';

const WaiterOrders: React.FC = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'ready' | 'pending'>('all');
    const [lastReadyCount, setLastReadyCount] = useState(0);

    useEffect(() => {
        loadOrders();

        // Polling a cada 5 segundos para atualizar pedidos
        const interval = setInterval(() => {
            loadOrders();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const loadOrders = async () => {
        try {
            console.log('🔄 Carregando pedidos...');
            const res = await getOrders({ limit: 50 });
            console.log('📦 Resposta da API:', res.data);

            if (res.data.success) {
                const newOrders = res.data.data;
                console.log(`✅ ${newOrders.length} pedidos carregados`);

                const newReadyCount = newOrders.filter((o: any) => o.status === 'READY').length;

                // Notificar se houver novos pedidos prontos
                if (newReadyCount > lastReadyCount && lastReadyCount > 0) {
                    playNotificationSound();
                    showNotification(`${newReadyCount - lastReadyCount} novo(s) pedido(s) pronto(s)!`);
                }

                setLastReadyCount(newReadyCount);
                setOrders(newOrders);
            } else {
                console.error('❌ API retornou success: false');
            }
        } catch (error: any) {
            console.error('❌ Erro ao carregar pedidos:', error);
            console.error('Detalhes:', error.response?.data || error.message);
        }
    };

    const handleServe = async (orderId: number) => {
        try {
            await updateOrderStatus(orderId, 'SERVED');
            loadOrders();
        } catch (error) {
            console.error('Erro ao marcar como servido:', error);
        }
    };

    const playNotificationSound = () => {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(e => console.log('Erro ao tocar som:', e));
    };

    const showNotification = (message: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('CaféPoint', {
                body: message,
                icon: '/pwa-192x192.png'
            });
        }
    };

    const getStatusText = (status: string) => {
        const statuses: any = {
            'PENDING': 'Aguardando',
            'PREPARING': 'Em Preparo',
            'READY': '✅ Pronto',
            'SERVED': 'Entregue',
            'PAID': 'Pago'
        };
        return statuses[status] || status;
    };

    const getStatusClass = (status: string) => {
        const classes: any = {
            'PENDING': 'status-pending',
            'PREPARING': 'status-preparing',
            'READY': 'status-ready',
            'SERVED': 'status-served',
            'PAID': 'status-paid'
        };
        return classes[status] || '';
    };

    const filteredOrders = orders.filter(order => {
        if (filter === 'ready') return order.status === 'READY';
        if (filter === 'pending') return order.status === 'PENDING' || order.status === 'PREPARING';
        return true;
    });

    const readyCount = orders.filter(o => o.status === 'READY').length;

    return (
        <div className="waiter-orders-page">
            <header className="page-header">
                <div>
                    <h1>🍽️ Pedidos - {user?.name}</h1>
                    <p className="subtitle">Acompanhe os pedidos em tempo real</p>
                </div>
                {readyCount > 0 && (
                    <div className="ready-alert">
                        <span className="alert-badge">{readyCount}</span>
                        <span>Pedido(s) Pronto(s)</span>
                    </div>
                )}
            </header>

            <div className="filter-tabs">
                <button
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    Todos ({orders.length})
                </button>
                <button
                    className={filter === 'pending' ? 'active' : ''}
                    onClick={() => setFilter('pending')}
                >
                    Em Preparo ({orders.filter(o => o.status === 'PENDING' || o.status === 'PREPARING').length})
                </button>
                <button
                    className={filter === 'ready' ? 'active' : ''}
                    onClick={() => setFilter('ready')}
                >
                    ✅ Prontos ({readyCount})
                </button>
            </div>

            <div className="orders-grid">
                {filteredOrders.map(order => (
                    <div key={order.id} className={`order-card ${getStatusClass(order.status)}`}>
                        <div className="order-header">
                            <div>
                                <h3>Mesa {order.table.number}</h3>
                                <span className="order-id">Pedido #{order.id}</span>
                            </div>
                            <span className={`status-badge ${getStatusClass(order.status)}`}>
                                {getStatusText(order.status)}
                            </span>
                        </div>

                        <div className="order-items">
                            {order.orderItems.map((item: any) => (
                                <div key={item.id} className="order-item">
                                    <span className="item-quantity">{item.quantity}x</span>
                                    <span className="item-name">{item.menuItem.name}</span>
                                    {item.notes && <span className="item-notes">📝 {item.notes}</span>}
                                </div>
                            ))}
                        </div>

                        <div className="order-footer">
                            <span className="order-time">
                                {new Date(order.createdAt).toLocaleTimeString('pt-PT', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                            {order.status === 'READY' && (
                                <button
                                    className="serve-btn"
                                    onClick={() => handleServe(order.id)}
                                >
                                    ✅ Marcar como Entregue
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="empty-state">
                        {orders.length === 0 ? (
                            <>
                                <p style={{ fontSize: '3rem', margin: '0' }}>🍽️</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#334155' }}>Nenhum pedido ainda</p>
                                <p style={{ color: '#64748b' }}>Os pedidos aparecerão aqui automaticamente quando forem criados</p>
                            </>
                        ) : (
                            <p>Nenhum pedido neste filtro</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WaiterOrders;

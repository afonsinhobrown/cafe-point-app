import React, { useState, useEffect } from 'react';
import { getOrderHistory } from '../services/api';
import './Orders.css';

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        loadOrders();
    }, [filterStatus]);

    const loadOrders = async () => {
        try {
            setIsLoading(true);
            const response = await getOrderHistory({ status: filterStatus });
            setOrders(response.data.data);
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pendente';
            case 'PREPARING': return 'Cozinha';
            case 'READY': return 'Pronto';
            case 'SERVED': return 'Entregue';
            case 'PAID': return 'Pago';
            default: return status;
        }
    };

    return (
        <div className="orders-page">
            <header className="orders-page-header">
                <h1>📋 Lista de Pedidos</h1>
                <div className="filter-bar">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">Todos os Status</option>
                        <option value="PENDING">Pendentes</option>
                        <option value="PREPARING">Na Cozinha</option>
                        <option value="READY">Prontos</option>
                        <option value="SERVED">Entregues</option>
                        <option value="PAID">Pagos</option>
                    </select>
                </div>
            </header>

            {isLoading ? (
                <div className="loading-state">Carregando pedidos...</div>
            ) : (
                <div className="orders-list-container">
                    <table className="orders-full-table">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Mesa</th>
                                <th>Garçom</th>
                                <th>Itens</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Horário</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td>#{order.id}</td>
                                    <td>Mesa {order.table.number}</td>
                                    <td>{order.user.name}</td>
                                    <td>
                                        <div className="items-summary">
                                            {order.orderItems.map((item: any) => (
                                                <span key={item.id}>{item.quantity}x {item.menuItem.name}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="total-cell">MT {order.totalAmount.toFixed(2)}</td>
                                    <td>
                                        <div className="status-location-info">
                                            <span className="location-name">{order.table.location?.name || 'Geral'}</span>
                                            <span className={`order-status-pill ${order.status.toLowerCase()}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {orders.length === 0 && (
                        <div className="no-orders">Nenhum pedido encontrado.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Orders;

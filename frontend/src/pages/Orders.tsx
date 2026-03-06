import React, { useState, useEffect } from 'react';
import { getOrderHistory, getRestaurantSettings } from '../services/api';
import PrintReceipt from '../components/PrintReceipt';
import './Orders.css';

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [printFormat, setPrintFormat] = useState<'THERMAL' | 'A4'>('THERMAL');
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        loadData();
    }, [filterStatus]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [ordersRes, settingsRes] = await Promise.all([
                getOrderHistory({ status: filterStatus }),
                getRestaurantSettings()
            ]);
            setOrders(ordersRes.data.data);
            setRestaurant(settingsRes.data.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = (order: any, format: 'THERMAL' | 'A4') => {
        setPrintFormat(format);
        setSelectedOrder(order);
        // Pequeno delay para garantir que o componente renderizou com a nova ordem antes de abrir o print do browser
        setTimeout(() => {
            window.print();
        }, 100);
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
                                <th>Ações</th>
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
                                    <td>
                                        <div className="print-actions">
                                            <button
                                                className="print-btn thermal"
                                                onClick={() => handlePrint(order, 'THERMAL')}
                                                title="Imprimir Recibo Térmico"
                                            >
                                                🧾 Recibo
                                            </button>
                                            <button
                                                className="print-btn a4"
                                                onClick={() => handlePrint(order, 'A4')}
                                                title="Imprimir Fatura A4"
                                            >
                                                📑 Fatura
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Componente Invisível que só aparece no window.print() */}
                    {selectedOrder && restaurant && (
                        <PrintReceipt
                            order={selectedOrder}
                            restaurant={restaurant}
                            format={printFormat}
                        />
                    )}

                    {orders.length === 0 && (
                        <div className="no-orders">Nenhum pedido encontrado.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Orders;

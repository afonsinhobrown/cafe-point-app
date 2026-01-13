import React, { useState, useEffect } from 'react';
import { getStats, getOrderHistory, updateOrderStatus, getMenu } from '../services/api';
import ReceiptModal from '../components/ReceiptModal';
import './Reports.css';

const Reports: React.FC = () => {
    const [period, setPeriod] = useState('month');
    const [stats, setStats] = useState<any>({
        totalRevenue: 0,
        pendingRevenue: 0,
        orderCount: 0,
        pendingCount: 0,
        totalCost: 0,
        totalPurchases: 0,
        grossProfit: 0,
        profitMargin: 0,
        salesByCategory: {},
        costByCategory: {},
        purchasesBySupplier: {}
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [lowStockItems, setLowStockItems] = useState<any[]>([]);

    const periods = [
        { id: 'day', label: 'Hoje' },
        { id: 'week', label: 'Esta Semana' },
        { id: 'month', label: 'Este Mês' },
        { id: 'year', label: 'Este Ano' }
    ];

    useEffect(() => {
        loadData();
    }, [period]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const statsRes = await getStats(period);
            setStats(statsRes.data.data);

            const ordersRes = await getOrderHistory({ limit: 10 });
            setRecentOrders(ordersRes.data.data);

            const menuRes = await getMenu({ all: 'true' });
            const lowStock = menuRes.data.data.filter((item: any) =>
                item.stockQuantity !== null && item.stockQuantity <= (item.minStock || 5)
            );
            setLowStockItems(lowStock);
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionPay = async (order: any) => {
        if (window.confirm(`Confirmar o pagamento de MT ${order.totalAmount.toFixed(2)} para o pedido #${order.id}?`)) {
            try {
                await updateOrderStatus(order.id, 'PAID');
                await loadData(); // Recarregar estatísticas e lista

                // Abrir o recibo após o pagamento
                const updatedOrder = { ...order, status: 'PAID' };
                setSelectedOrder(updatedOrder);
                setIsReceiptOpen(true);
            } catch (error) {
                console.error('Erro ao processar pagamento:', error);
                alert('Erro ao processar pagamento.');
            }
        }
    };

    const handleViewReceipt = (order: any) => {
        setSelectedOrder(order);
        setIsReceiptOpen(true);
    };

    const handlePrintReport = () => {
        window.print();
    };

    const getStatusText = (status: string) => {
        const statuses: any = {
            'PENDING': 'Pendente',
            'PREPARING': 'Na Cozinha',
            'READY': 'Pronto',
            'SERVED': 'Entregue',
            'PAID': 'Pago',
            'CANCELLED': 'Cancelado'
        };
        return statuses[status] || status;
    };

    if (isLoading && !stats?.totalRevenue && stats?.totalRevenue !== 0) return <div className="reports-page">Carregando...</div>;

    return (
        <div className="reports-page printable-report">
            <header className="reports-header no-print">
                <h1>📊 Financeiro</h1>
                <div className="header-actions">
                    <button className="print-report-btn" onClick={handlePrintReport}>
                        🖨️ Imprimir Relatório
                    </button>
                    <div className="period-selector">
                        {periods.map(p => (
                            <button
                                key={p.id}
                                className={period === p.id ? 'active' : ''}
                                onClick={() => setPeriod(p.id)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="print-header only-print">
                <h1>Relatório Financeiro - CaféPoint</h1>
                <p>Período: {periods.find(p => p.id === period)?.label}</p>
                <p>Gerado em: {new Date().toLocaleString()}</p>
            </div>

            {lowStockItems.length > 0 && (
                <div className="stock-alerts no-print">
                    <h3>⚠️ Alerta de Stock Baixo</h3>
                    <div className="alerts-grid">
                        {lowStockItems.map(item => (
                            <div key={item.id} className="alert-item">
                                <span>{item.name}</span>
                                <strong>{item.stockQuantity} un.</strong>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="stats-grid main-stats">
                <div className="stat-card">
                    <h3>Faturação Realizada</h3>
                    <p className="stat-value">MT {stats?.totalRevenue.toFixed(2)}</p>
                    <span className="stat-sub">{stats?.orderCount} vendas confirmadas</span>
                </div>
                <div className="stat-card">
                    <h3>Custo Total (CMV)</h3>
                    <p className="stat-value cost">MT {stats?.totalCost?.toFixed(2) || '0.00'}</p>
                    <span className="stat-sub">Custo do que foi vendido</span>
                </div>
                <div className="stat-card purple">
                    <h3>Total em Compras</h3>
                    <p className="stat-value">MT {stats?.totalPurchases?.toFixed(2) || '0.00'}</p>
                    <span className="stat-sub">Investimento em stock no período</span>
                </div>
                <div className="stat-card success-light">
                    <h3>Lucro Bruto</h3>
                    <p className="stat-value profit">MT {stats?.grossProfit?.toFixed(2) || '0.00'}</p>
                    <span className="stat-sub">Margem média: {stats?.profitMargin?.toFixed(1)}%</span>
                </div>
                <div className="stat-card yellow no-print">
                    <h3>Faturação Pendente</h3>
                    <p className="stat-value">MT {stats?.pendingRevenue?.toFixed(2) || '0.00'}</p>
                    <span className="stat-sub">{stats?.pendingCount || 0} pedidos em aberto</span>
                </div>
            </div>

            <div className="reports-content">
                <div className="category-sales">
                    <h3>Balanço Financeiro por Categoria</h3>
                    <div className="category-list">
                        {Object.entries(stats?.salesByCategory || {}).map(([cat, val]: any) => {
                            const cost = stats.costByCategory[cat] || 0;
                            const profit = val - cost;
                            const margin = val > 0 ? (profit / val) * 100 : 0;

                            return (
                                <div key={cat} className="category-profit-item">
                                    <div className="cat-desc">
                                        <span className="cat-name">{cat}</span>
                                        <span className="cat-margin">{margin.toFixed(0)}% margem</span>
                                    </div>
                                    <div className="cat-values">
                                        <div className="val-line">
                                            <span>Venda:</span>
                                            <strong>MT {val.toFixed(2)}</strong>
                                        </div>
                                        <div className="val-line cost">
                                            <span>Custo:</span>
                                            <span>MT {cost.toFixed(2)}</span>
                                        </div>
                                        <div className="val-line profit">
                                            <span>Lucro:</span>
                                            <span>MT {profit.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="cat-bar-bg">
                                        <div
                                            className="cat-bar"
                                            style={{ width: `${stats.totalRevenue > 0 ? (val / stats.totalRevenue) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(stats?.salesByCategory || {}).length === 0 && (
                            <p className="empty-info">Nenhuma venda realizada neste período.</p>
                        )}
                    </div>
                </div>

                <div className="supplier-investments">
                    <h3>Investimento por Fornecedor</h3>
                    <div className="supplier-list">
                        {Object.entries(stats?.purchasesBySupplier || {}).map(([sup, val]: any) => (
                            <div key={sup} className="supplier-investment-item">
                                <span className="sup-name">{sup}</span>
                                <span className="sup-val">MT {val.toFixed(2)}</span>
                            </div>
                        ))}
                        {Object.keys(stats?.purchasesBySupplier || {}).length === 0 && (
                            <p className="empty-info">Nenhuma compra registada neste período.</p>
                        )}
                    </div>
                </div>

                <div className="recent-orders-section">
                    <h3>Últimos Pedidos</h3>
                    <div className="table-responsive">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Mesa</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Data</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(order => (
                                    <tr key={order.id}>
                                        <td>#{order.id}</td>
                                        <td>Mesa {order.table.number}</td>
                                        <td>MT {order.totalAmount.toFixed(2)}</td>
                                        <td>
                                            <span className={`status-badge ${order.status.toLowerCase()}`}>
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {order.status !== 'PAID' && order.status !== 'CANCELLED' && (
                                                    <button
                                                        className="pay-btn-small"
                                                        onClick={() => handleActionPay(order)}
                                                    >
                                                        💳 Pagar
                                                    </button>
                                                )}
                                                {order.status === 'PAID' && (
                                                    <button
                                                        className="receipt-btn-small"
                                                        onClick={() => handleViewReceipt(order)}
                                                    >
                                                        🧾 Recibo
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {recentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                                            Nenhum pedido encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                order={selectedOrder}
            />
        </div>
    );
};

export default Reports;

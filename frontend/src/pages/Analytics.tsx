import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend, Line, ComposedChart
} from 'recharts';
import { generateBIReport } from '../services/reportService';
import './Analytics.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

const Analytics: React.FC = () => {
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);
    const [data, setData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('financial');

    useEffect(() => {
        loadAnalytics();
    }, [period]);

    const handleDownloadPDF = async () => {
        try {
            setIsPrinting(true);
            await generateBIReport(period);
        } catch (error) {
            alert('Erro ao gerar relatório avançado');
        } finally {
            setIsPrinting(false);
        }
    };

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get('/reports/super-reports', { params: { period } });
            setData(res.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <span>Gerando 20 relatórios inteligentes...</span>
    </div>;

    if (!data) return <div className="analytics-error">Erro ao carregar dados analíticos.</div>;

    const hourlyData = data.sales.hourlyTraffic.map((count: number, hour: number) => ({ hour: `${hour}h`, count }));
    const paymentData = Object.entries(data.financial.paymentMethods).map(([name, value]) => ({ name, value }));
    const dailyData = Object.entries(data.sales.dailyRevenue).map(([date, revenue]) => ({ date, revenue }));
    const categoryPerformance = data.efficiency.categoryProfitability;

    const renderFinancial = () => (
        <div className="analytics-container-content">
            <div className="kpi-row">
                <div className="kpi-card glass-premium">
                    <span className="kpi-icon">💰</span>
                    <div className="kpi-details">
                        <span className="kpi-title">Faturação Total</span>
                        <span className="kpi-value highlight">MT {data.financial.totalRevenue.toLocaleString()}</span>
                        <span className={`kpi-change ${data.financial.growth >= 0 ? 'up' : 'down'}`}>
                            {data.financial.growth >= 0 ? '↑' : '↓'} {Math.abs(data.financial.growth).toFixed(1)}% vs anterior
                        </span>
                    </div>
                </div>
                <div className="kpi-card glass-premium">
                    <span className="kpi-icon">📈</span>
                    <div className="kpi-details">
                        <span className="kpi-title">Lucro Bruto</span>
                        <span className="kpi-value text-green">MT {data.financial.grossProfit.toLocaleString()}</span>
                        <span className="kpi-sub">Margem: {data.financial.profitMargin.toFixed(1)}%</span>
                    </div>
                </div>
                <div className="kpi-card glass-premium">
                    <span className="kpi-icon">🎯</span>
                    <div className="kpi-details">
                        <span className="kpi-title">Ticket Médio</span>
                        <span className="kpi-value text-purple">MT {data.financial.avgTicket.toFixed(2)}</span>
                        <span className="kpi-sub">Por pedido efetuado</span>
                    </div>
                </div>
            </div>

            <div className="analytics-grid">
                <div className="analytics-card wide">
                    <div className="card-header">
                        <h3>📅 Tendência Diária de Vendas</h3>
                        <p>Evolução da receita ao longo do período selecionado</p>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={dailyData}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `MT ${v / 1000}k`} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="analytics-card">
                    <div className="card-header">
                        <h3>💳 Métodos de Pagamento</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                {paymentData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="analytics-card">
                    <div className="card-header">
                        <h3>📦 Valor do Estoque</h3>
                    </div>
                    <div className="valuation-display">
                        <span className="val-title">Património Líquido em Stock</span>
                        <h2 className="val-amount">MT {data.financial.inventoryValuation.toLocaleString()}</h2>
                        <div className="val-meta">
                            <span className="badge warning">{data.operational.lowStockCount} itens com stock baixo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSalesDetails = () => (
        <div className="analytics-container-content">
            <div className="analytics-grid">
                <div className="analytics-card wide">
                    <div className="card-header">
                        <h3>🏆 Top 10 Produtos por Receita</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                        <ComposedChart data={data.sales.topRevenueItems} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" width={120} fontSize={11} axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} name="Receita (MT)" />
                            <Line type="monotone" dataKey="qty" stroke="#10b981" strokeWidth={2} name="Quantidade" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                <div className="analytics-card">
                    <div className="card-header">
                        <h3>📊 Lucratividade por Categoria</h3>
                    </div>
                    <div className="ranking-list">
                        {categoryPerformance.slice(0, 6).map((cat: any, i: number) => (
                            <div key={i} className="ranking-item">
                                <div className="rank-info">
                                    <span className="rank-name">{cat.name}</span>
                                    <span className="rank-val">{cat.margin.toFixed(1)}% margem</span>
                                </div>
                                <div className="rank-bar-bg">
                                    <div className="rank-bar" style={{ width: `${cat.margin}%`, backgroundColor: COLORS[i % COLORS.length] }}></div>
                                </div>
                                <span className="rank-meta">MT {cat.profit.toLocaleString()} lucro</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="card-header">
                        <h3>🕒 Fluxo Horário (Pico)</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="hour" fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const renderOperational = () => (
        <div className="analytics-container-content">
            <div className="analytics-grid">
                <div className="analytics-card">
                    <div className="card-header">
                        <h3>🤵 Relatório de Garçons</h3>
                        <p>Vendas totais por colaborador</p>
                    </div>
                    <div className="waiter-leaderboard">
                        {Object.entries(data.operational.waiterPerformance).map(([name, s]: any) => (
                            <div key={name} className="leaderboard-item">
                                <div className="waiter-avatar">{name.charAt(0)}</div>
                                <div className="waiter-info">
                                    <strong>{name}</strong>
                                    <span>{s.orders} pedidos registrados</span>
                                </div>
                                <div className="waiter-total">MT {s.revenue.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="card-header">
                        <h3>🪑 Ocupação de Mesas</h3>
                    </div>
                    <div className="table-stats-grid">
                        {Object.entries(data.operational.tableUsage).map(([num, count]: any) => (
                            <div key={num} className="table-mini-card">
                                <span className="table-id">#{num}</span>
                                <span className="table-count">{count}</span>
                                <span className="table-label">Giros</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="card-header">
                        <h3>📝 Status de Pedidos (Período)</h3>
                    </div>
                    <div className="status-summary">
                        <div className="status-stat green">
                            <strong>{data.sales.statusCounts.PAID}</strong>
                            <span>Concluídos</span>
                        </div>
                        <div className="status-stat red">
                            <strong>{data.sales.statusCounts.CANCELLED}</strong>
                            <span>Cancelados</span>
                        </div>
                        <div className="status-stat blue">
                            <strong>{data.sales.statusCounts.SERVED + data.sales.statusCounts.PENDING}</strong>
                            <span>Em Aberto</span>
                        </div>
                    </div>
                </div>

                <div className="analytics-card">
                    <div className="card-header">
                        <h3>👣 Estimativas Adicionais</h3>
                    </div>
                    <div className="extra-stats">
                        <div className="extra-item">
                            <span>Fluxo de Clientes (Est.)</span>
                            <strong>{data.operational.estimatedCustomers} pessoas</strong>
                        </div>
                        <div className="extra-item">
                            <span>Tempo Médio na Mesa</span>
                            <strong>{data.operational.avgTimePerTable} min</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="analytics-page">
            <header className="analytics-header">
                <div className="header-brand">
                    <div className="bi-badge">BI</div>
                    <div className="header-text">
                        <h1>Business Intelligence & Relatórios</h1>
                        <p className="subtitle">Painel executivo com 20 relatórios inteligentes</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-print-bi" onClick={handleDownloadPDF} disabled={isPrinting}>
                        {isPrinting ? '⏳ Gerando...' : '📥 Relatório Executivo (PDF)'}
                    </button>
                    <div className="period-tabs">
                        {['day', 'week', 'month'].map(p => (
                            <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
                                {p === 'day' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="analytics-layout">
                <nav className="analytics-nav">
                    <button className={`nav-item ${activeTab === 'financial' ? 'active' : ''}`} onClick={() => setActiveTab('financial')}>
                        <span className="icon">💰</span> Financeiro
                    </button>
                    <button className={`nav-item ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>
                        <span className="icon">📊</span> Produtos & Categorias
                    </button>
                    <button className={`nav-item ${activeTab === 'operational' ? 'active' : ''}`} onClick={() => setActiveTab('operational')}>
                        <span className="icon">🎯</span> Operacional
                    </button>
                </nav>

                <main className="analytics-main-pane">
                    {activeTab === 'financial' && renderFinancial()}
                    {activeTab === 'sales' && renderSalesDetails()}
                    {activeTab === 'operational' && renderOperational()}
                </main>
            </div>
        </div>
    );
};

export default Analytics;

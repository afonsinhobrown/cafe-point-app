import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getMenu, getLicenseStatus } from '../services/api';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [lowStockCount, setLowStockCount] = useState(0);
    const [licenseInfo, setLicenseInfo] = useState<any>(null);
    const navigate = useNavigate();

    const hasFetched = React.useRef(false);

    useEffect(() => {
        if (!user || hasFetched.current) return;

        if (user.role === 'REGISTRAR') {
            navigate('/register');
            return;
        }
        if (user.role === 'SUPER_ADMIN') {
            navigate('/admin');
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch Stock Alerts
                const resStock = await getMenu({ all: 'true' });
                if (resStock.data.success && Array.isArray(resStock.data.data)) {
                    const lowStockItems = resStock.data.data.filter((item: any) =>
                        item.stockQuantity !== null && item.stockQuantity <= (item.minStock || 5)
                    );
                    setLowStockCount(lowStockItems.length);
                }

                // Fetch License Status
                const resLicense = await getLicenseStatus();
                setLicenseInfo(resLicense.data);

                hasFetched.current = true;
            } catch (error) {
                console.error('Erro ao buscar dados do dashboard:', error);
            }
        };
        fetchData();
    }, [user?.id, user?.role, navigate]);

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-text">
                    <h1>{user?.restaurantName || 'CaféPoint'}</h1>
                    <div className="header-meta">
                        <p>Olá {user?.name}, o que gostaria de fazer hoje?</p>
                        {licenseInfo && (
                            <span className={`license-badge ${licenseInfo.daysRemaining <= 2 ? 'warning' : ''}`}>
                                🔑 Licença: {licenseInfo.daysRemaining} dias restantes
                            </span>
                        )}
                    </div>
                </div>
                {lowStockCount > 0 && (
                    <Link to="/reports" className="stock-alert-banner">
                        <span className="icon">⚠️</span>
                        <div className="alert-content">
                            <strong>Alerta de Stock</strong>
                            <span>Existem {lowStockCount} itens com stock em níveis críticos!</span>
                        </div>
                        <span className="action-link">Ver Detalhes →</span>
                    </Link>
                )}
            </header>

            <div className="dashboard-grid">
                {/* ADMIN OU GARÇOM */}
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'WAITER') && (
                    <>
                        <Link to="/tables" className="dashboard-card primary">
                            <div className="card-icon">🪑</div>
                            <h2>Mesas</h2>
                            <p>Gerir mesas e criar pedidos</p>
                            <span className="card-button">Abrir Mesas</span>
                        </Link>

                        <Link to="/orders" className="dashboard-card info">
                            <div className="card-icon">📝</div>
                            <h2>Pedidos</h2>
                            <p>Histórico e status de pedidos</p>
                            <span className="card-button">Ver Pedidos</span>
                        </Link>
                    </>
                )}

                {/* ADMIN OU COZINHA */}
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'KITCHEN') && (
                    <>
                        <Link to="/kitchen" className="dashboard-card accent">
                            <div className="card-icon">🍳</div>
                            <h2>Cozinha</h2>
                            <p>Preparar pedidos pendentes</p>
                            <span className="card-button">Abrir Cozinha</span>
                        </Link>

                        <Link to="/bar" className="dashboard-card info">
                            <div className="card-icon">🍷</div>
                            <h2>Bar / Copa</h2>
                            <p>Pedidos de Bebidas</p>
                            <span className="card-button">Abrir Bar</span>
                        </Link>
                    </>
                )}

                {/* APENAS ADMIN */}
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                    <>
                        <Link to="/drinks" className="dashboard-card primary">
                            <div className="card-icon">📦</div>
                            <h2>Estoque</h2>
                            <p>Gestão completa de stock</p>
                            <span className="card-button">Gerir Stock</span>
                        </Link>

                        <Link to="/reports" className="dashboard-card dark">
                            <div className="card-icon">📊</div>
                            <h2>Faturação</h2>
                            <p>Relatórios, dia, mês e ano</p>
                            <span className="card-button">Ver Faturação</span>
                        </Link>

                        <Link to="/menu" className="dashboard-card success">
                            <div className="card-icon">📋</div>
                            <h2>Cardápio</h2>
                            <p>Gerir itens e inventário</p>
                            <span className="card-button">Gerir Cardápio</span>
                        </Link>

                        <Link to="/subscription" className="dashboard-card primary">
                            <div className="card-icon">💎</div>
                            <h2>Assinatura</h2>
                            <p>Gerir plano e limites</p>
                            <span className="card-button">Ver Plano</span>
                        </Link>

                        <Link to="/locations" className="dashboard-card warning">
                            <div className="card-icon">🗺️</div>
                            <h2>Áreas</h2>
                            <p>Gerir espaços do café</p>
                            <span className="card-button">Gerir Áreas</span>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
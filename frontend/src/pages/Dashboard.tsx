import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getMenu } from '../services/api';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [lowStockCount, setLowStockCount] = useState(0);

    useEffect(() => {
        const fetchStockAlerts = async () => {
            try {
                const res = await getMenu({ all: 'true' });
                const lowStockItems = res.data.data.filter((item: any) =>
                    item.stockQuantity !== null && item.stockQuantity <= (item.minStock || 5)
                );
                setLowStockCount(lowStockItems.length);
            } catch (error) {
                console.error('Erro ao buscar alertas de stock:', error);
            }
        };
        fetchStockAlerts();
    }, []);

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-text">
                    <h1>Bem-vindo, {user?.name}!</h1>
                    <p>O que gostaria de fazer hoje?</p>
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
                <Link to="/tables" className="dashboard-card primary">
                    <h2>Mesas</h2>
                    <p>Gerir mesas e criar pedidos</p>
                    <span className="card-button">Abrir Mesas</span>
                </Link>

                <Link to="/kitchen" className="dashboard-card accent">
                    <h2>Cozinha</h2>
                    <p>Preparar pedidos pendentes</p>
                    <span className="card-button">Abrir Cozinha</span>
                </Link>

                <Link to="/orders" className="dashboard-card info">
                    <h2>Pedidos</h2>
                    <p>Histórico e status de pedidos</p>
                    <span className="card-button">Ver Pedidos</span>
                </Link>

                <Link to="/drinks" className="dashboard-card primary">
                    <h2>Bebidas</h2>
                    <p>Gestão de stock de bebidas</p>
                    <span className="card-button">Gerir Stock</span>
                </Link>

                <Link to="/reports" className="dashboard-card dark">
                    <h2>Faturação</h2>
                    <p>Relatórios, dia, mês e ano</p>
                    <span className="card-button">Ver Faturação</span>
                </Link>

                <Link to="/menu" className="dashboard-card success">
                    <h2>Cardápio</h2>
                    <p>Gerir itens do menu</p>
                    <span className="card-button">Gerir Cardápio</span>
                </Link>

                <Link to="/locations" className="dashboard-card warning">
                    <h2>Áreas</h2>
                    <p>Gerir espaços do café</p>
                    <span className="card-button">Gerir Áreas</span>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
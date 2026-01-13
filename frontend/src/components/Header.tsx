import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <Link to="/dashboard" className="logo-link">
                        <h1>☕ CaféPoint</h1>
                    </Link>
                    <nav className="header-nav">
                        <Link to="/tables" className={location.pathname === '/tables' ? 'active' : ''}>Mesas</Link>
                        <Link to="/kitchen" className={location.pathname === '/kitchen' ? 'active' : ''}>Cozinha</Link>
                        <Link to="/orders" className={location.pathname === '/orders' ? 'active' : ''}>Pedidos</Link>
                        <Link to="/reports" className={location.pathname === '/reports' ? 'active' : ''}>Faturação</Link>
                        <Link to="/drinks" className={location.pathname === '/drinks' ? 'active' : ''}>Bebidas</Link>
                        <Link to="/menu" className={location.pathname === '/menu' ? 'active' : ''}>Cardápio</Link>
                        <Link to="/locations" className={location.pathname === '/locations' ? 'active' : ''}>Áreas</Link>
                    </nav>
                </div>

                <div className="header-right">
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">{user?.role === 'ADMIN' ? 'Admin' : 'Garçom'}</span>
                    </div>
                    <button onClick={logout} className="logout-button" title="Sair">
                        Logout 🚪
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle Menu"
                    >
                        ☰
                    </button>
                    <Link to="/dashboard" className="logo-link">
                        <h1>☕ CaféPoint</h1>
                    </Link>

                    {/* Overlay para fechar ao clicar fora */}
                    {isMenuOpen && <div className="mobile-overlay" onClick={() => setIsMenuOpen(false)}></div>}

                    <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
                        <div className="mobile-nav-header">
                            <span className="mobile-nav-title">Menu</span>
                            <button className="close-btn" onClick={() => setIsMenuOpen(false)}>✕</button>
                        </div>

                        {/* Links para ADMIN ou GARÇOM */}
                        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'WAITER') && (
                            <>
                                <Link to="/tables" className={location.pathname === '/tables' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Mesas</Link>
                                <Link to="/orders" className={location.pathname === '/orders' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Pedidos</Link>
                                <Link to="/reports" className={location.pathname === '/reports' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Faturação</Link>
                            </>
                        )}

                        {/* Links para ADMIN ou COZINHA */}
                        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'KITCHEN') && (
                            <>
                                <Link to="/kitchen" className={location.pathname === '/kitchen' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Cozinha</Link>
                                <Link to="/bar" className={location.pathname === '/bar' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Bar</Link>
                            </>
                        )}

                        {/* Links APENAS para ADMIN */}
                        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                            <>
                                <div className="nav-divider"></div>
                                {/* <Link to="/subscription" className={location.pathname === '/subscription' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Assinatura</Link> */}
                                <Link to="/analytics" className={location.pathname === '/analytics' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>BI & Relatórios</Link>
                                <Link to="/drinks" className={location.pathname === '/drinks' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Estoque</Link>
                                <Link to="/menu" className={location.pathname === '/menu' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Cardápio</Link>
                                <Link to="/locations" className={location.pathname === '/locations' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Áreas</Link>
                                <Link to="/team" className={location.pathname === '/team' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Equipe</Link>
                                <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Config</Link>
                            </>
                        )}

                        {/* Link para REGISTRAR */}
                        {user?.role === 'REGISTRAR' && (
                            <Link to="/register" className={location.pathname === '/register' ? 'active' : ''} onClick={() => setIsMenuOpen(false)}>Novo Registro</Link>
                        )}
                    </nav>
                </div>

                <div className="header-right">
                    <div className="user-info">
                        {user?.restaurantName && <span className="user-restaurant-name">🏢 {user.restaurantName}</span>}
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">
                            {user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'Gerente' :
                                user?.role === 'REGISTRAR' ? 'Registrar' :
                                    user?.role === 'KITCHEN' ? 'Cozinha' : 'Garçom'}
                        </span>
                    </div>
                    <button onClick={logout} className="logout-button" title="Sair">
                        Sair 🚪
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
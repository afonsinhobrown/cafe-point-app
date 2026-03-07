import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { startAutoSync } from './services/offlineSync';
import RegisterRestaurant from './pages/RegisterRestaurant';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import Kitchen from './pages/Kitchen';
import Bar from './pages/Bar';
import Locations from './pages/Locations';
import Orders from './pages/Orders';
import WaiterOrders from './pages/WaiterOrders';
import Reports from './pages/Reports';
import Subscription from './pages/Subscription';
import Menu from './pages/Menu';
import Drinks from './pages/Drinks';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Landing from './pages/Landing';
import LicenseError from './pages/LicenseError';
import { getLicenseStatus } from './services/api';
import './App.css';

import Header from './components/Header';

const ProtectedRoute: React.FC<{ children: React.ReactNode, roles?: string[] }> = ({ children, roles }) => {
    const { user, isLoading } = useAuth();
    const token = localStorage.getItem('token');

    if (isLoading) {
        return <div className="loading">A carregar...</div>;
    }

    if (!token || !user) {
        return <Navigate to="/login" />;
    }

    // Check Roles
    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <>
            <Header />
            <main className="main-content">
                {children}
            </main>
        </>
    );
};

// Componente para renderizar página de pedidos baseada no role
const RoleBasedOrders: React.FC = () => {
    const { user } = useAuth();

    if (user?.role === 'WAITER') {
        return <WaiterOrders />;
    }

    return <Orders />;
};

const AutoSyncHandler: React.FC = () => {
    const { user } = useAuth();
    const [hasSynced, setHasSynced] = React.useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && user && !hasSynced) {
            console.log('📡 Iniciando sincronização para:', user.username);
            startAutoSync();
            setHasSynced(true);
        }
    }, [user, hasSynced]);

    return null;
};

function App() {
    const [isLicenseValid, setIsLicenseValid] = React.useState<boolean | null>(null);
    const [isNetworkError, setIsNetworkError] = React.useState(false);

    useEffect(() => {
        let retries = 0;
        const maxRetries = 5;

        const checkLicense = async () => {
            try {
                const res = await getLicenseStatus();
                setIsLicenseValid(res.data.valid);
                setIsNetworkError(false);
            } catch (error: any) {
                console.error('Erro na validação de licença:', error);

                if (error.response?.status === 403) {
                    // Bloqueio explícito do servidor
                    setIsLicenseValid(false);
                } else if (!error.response) {
                    // Erro de rede (servidor subindo ou offline)
                    if (retries < maxRetries) {
                        retries++;
                        setTimeout(checkLicense, 2000);
                    } else {
                        setIsNetworkError(true);
                    }
                } else {
                    setIsLicenseValid(false);
                }
            }
        };
        checkLicense();
    }, []);

    if (isLicenseValid === false) {
        return <LicenseError />;
    }

    if (isNetworkError) {
        return (
            <div className="license-lock-screen">
                <div className="license-error-card">
                    <h1>Erro de Conexão</h1>
                    <p>Não foi possível validar o sistema com o servidor local.</p>
                    <button onClick={() => window.location.reload()} className="btn-retry">Tentar Novamente</button>
                </div>
            </div>
        );
    }

    if (isLicenseValid === null) {
        return (
            <div className="license-lock-screen">
                <div className="loading-content">
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ color: 'white', marginTop: '20px', fontWeight: 600 }}>Validando CaféPoint...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthProvider>
            <AutoSyncHandler />
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route
                            path="/register"
                            element={
                                <ProtectedRoute roles={['SUPER_ADMIN', 'REGISTRAR']}>
                                    <RegisterRestaurant />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute roles={['SUPER_ADMIN']}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tables"
                            element={
                                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'WAITER']}>
                                    <Tables />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/kitchen"
                            element={
                                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'KITCHEN']}>
                                    <Kitchen />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/bar"
                            element={
                                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'KITCHEN']}>
                                    <Bar />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/locations"
                            element={
                                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                                    <Locations />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/analytics"
                            element={
                                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                                    <Analytics />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/orders"
                            element={
                                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'WAITER']}>
                                    {/* Renderizar página específica baseada no role */}
                                    <RoleBasedOrders />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/reports"
                            element={
                                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN', 'WAITER']}>
                                    <Reports />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/drinks"
                            element={
                                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                                    <Drinks />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/subscription"
                            element={
                                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                                    <Subscription />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/menu"
                            element={
                                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                                    <Menu />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/team"
                            element={
                                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                                    <Team />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/settings"
                            element={
                                <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                                    <Settings />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/" element={<Landing />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import Kitchen from './pages/Kitchen';
import Locations from './pages/Locations';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Menu from './pages/Menu';
import Drinks from './pages/Drinks';
import './App.css';

import Header from './components/Header';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth();
    const token = localStorage.getItem('token');

    if (isLoading) {
        return <div className="loading">A carregar...</div>;
    }

    if (!token || !user) {
        return <Navigate to="/login" />;
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

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/login" element={<Login />} />
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
                                <ProtectedRoute>
                                    <Tables />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/kitchen"
                            element={
                                <ProtectedRoute>
                                    <Kitchen />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/locations"
                            element={
                                <ProtectedRoute>
                                    <Locations />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/orders"
                            element={
                                <ProtectedRoute>
                                    <Orders />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/reports"
                            element={
                                <ProtectedRoute>
                                    <Reports />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/drinks"
                            element={
                                <ProtectedRoute>
                                    <Drinks />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/menu"
                            element={
                                <ProtectedRoute>
                                    <Menu />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
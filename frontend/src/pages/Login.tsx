import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [restaurantSlug, setRestaurantSlug] = useState('');
    const [showSlugInput, setShowSlugInput] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const deviceId = localStorage.getItem('device_fingerprint') || 'unknown';
            await login(username, password, deviceId, showSlugInput ? restaurantSlug : undefined);

            // Lógica Especial para Registrar
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (savedUser.role === 'REGISTRAR') {
                navigate('/register');
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            if (err.requireSlug) {
                setShowSlugInput(true);
                setError(err.message);
            } else {
                setError(err.message || 'Credenciais inválidas.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1>☕ CaféPoint</h1>
                    <p>Sistema de Gestão Elite</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-box">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {showSlugInput && (
                        <div className="form-group">
                            <label>🏢 Código da Empresa</label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    value={restaurantSlug}
                                    onChange={(e) => setRestaurantSlug(e.target.value)}
                                    placeholder="restaurante-exemplo"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>👤 Utilizador</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Seu nome de usuário"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>🔒 Palavra-passe</label>
                        <div className="input-wrapper">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? 'A processar...' : 'Aceder Agora'}
                        <span>🚀</span>
                    </button>

                    <Link to="/register" className="register-link">
                        Criar conta empresarial →
                    </Link>
                </form>

                <div className="demo-access">
                    <h3>💎 Acesso Demonstração</h3>
                    <p>User: <strong>trial</strong></p>
                    <p>Pass: <strong>trial123</strong></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
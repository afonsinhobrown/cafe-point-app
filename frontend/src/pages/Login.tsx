import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await login(username, password);
            navigate('/dashboard'); // ✅ REDIRECIONA PARA DASHBOARD
        } catch (err: any) {
            setError('Credenciais inválidas');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
                width: '100%',
                maxWidth: '450px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                    <h1 style={{ color: '#0f172a', marginBottom: '8px', fontSize: '2.5rem' }}>☕ CaféPoint</h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Profissional Beverage Management</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            padding: '14px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            border: '1px solid #fee2e2',
                            textAlign: 'center',
                            fontWeight: '600'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#1e293b', fontWeight: '600' }}>
                            Utilizador / Email
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Introduza o seu utilizador"
                            style={{
                                width: '100%',
                                padding: '14px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '10px',
                                fontSize: '16px',
                                transition: 'all 0.3s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#1e293b', fontWeight: '600' }}>
                            Palavra-passe
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '14px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '10px',
                                fontSize: '16px',
                                transition: 'all 0.3s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            background: '#4f46e5',
                            color: 'white',
                            padding: '16px',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#4338ca'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#4f46e5'}
                    >
                        {isLoading ? 'A processar...' : 'Entrar no Sistema'}
                    </button>
                </form>

                <div style={{
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '12px',
                    borderLeft: '4px solid #4f46e5',
                    marginTop: '35px'
                }}>
                    <h3 style={{ marginBottom: '10px', color: '#1e293b', fontSize: '1rem' }}>
                        🔐 Acesso Rápido:
                    </h3>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#475569' }}>
                        <strong>Username:</strong> admin
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#475569' }}>
                        <strong>Password:</strong> admin123
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
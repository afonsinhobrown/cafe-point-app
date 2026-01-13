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
            navigate('/dashboard'); // ✅ Restaurado!
        } catch (err: any) {

            try {
                // Tentativa de Compatibilidade (Native Fetch)
                // IMPORTANTE: O backend espera 'username', não 'email'
                const params = new URLSearchParams({ username: username, password: password });
                const res = await fetch(`/api/auth/login-via-get?${params.toString()}`);

                if (!res.ok) throw new Error(`Status ${res.status}`);

                const data = await res.json();
                const { token, user } = data;

                // Salva sessão
                localStorage.setItem('token', token);
                sessionStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                // Atualiza Axios para chamadas futuras
                // @ts-ignore
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // alert("Conectado (Modo Compatibilidade)!"); 
                navigate('/dashboard');

            } catch (fallbackErr: any) {
                alert(`Erro Crítico:\nPOST: ${err.message}\nGET: ${fallbackErr.message}`);
                setError('Sem conexão com o servidor.');
            }
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

                <form onSubmit={handleSubmit} autoComplete="off">
                    {/* ... (Error box mantido se houver) ... */}
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
                            autoComplete="off"
                            name="new-username"
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
                            autoComplete="new-password"
                            name="new-password"
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
                            padding: '16px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {isLoading ? 'Entrando...' : 'Acessar Sistema'}
                    </button>
                    {/* Tip Removida para usar o Acesso Rápido abaixo */}
                </form>

                <div style={{
                    background: '#f8fafc',
                    padding: '20px',
                    borderRadius: '12px',
                    borderLeft: '4px solid #4f46e5',
                    marginTop: '35px'
                }}>
                    <h3 style={{ marginBottom: '10px', color: '#1e293b', fontSize: '1rem' }}>
                        🔐 ACESSO DEMONSTRAÇÃO:
                    </h3>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#475569' }}>
                        <strong>Username:</strong> trial
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#475569' }}>
                        <strong>Password:</strong> trial123
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
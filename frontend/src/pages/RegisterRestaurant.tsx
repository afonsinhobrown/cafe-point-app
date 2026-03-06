import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerRestaurant } from '../services/api';

const RegisterRestaurant: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        restaurantName: '',
        ownerName: '',
        adminUsername: '', // New field
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setIsLoading(true);

        try {
            await registerRestaurant({
                restaurantName: formData.restaurantName,
                ownerName: formData.ownerName,
                adminUsername: formData.adminUsername, // Send username
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });

            alert('Cadastro realizado com sucesso! Faça login para continuar.');
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Erro ao realizar cadastro.');
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
                maxWidth: '500px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: '#0f172a', marginBottom: '8px', fontSize: '2rem' }}>📋 Registro de Restaurante</h1>
                    <p style={{ color: '#64748b', fontSize: '1rem' }}>Sessão de Registro (Staff CaféPoint)</p>
                </div>

                <form onSubmit={handleSubmit} autoComplete="off">
                    {error && (
                        <div style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            padding: '14px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            textAlign: 'center',
                            fontWeight: '600'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#334155' }}>Nome do Restaurante</label>
                            <input
                                name="restaurantName"
                                value={formData.restaurantName}
                                onChange={handleChange}
                                required
                                placeholder="Ex: Café Central"
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#334155' }}>Nome do Proprietário</label>
                            <input
                                name="ownerName"
                                value={formData.ownerName}
                                onChange={handleChange}
                                required
                                placeholder="Seu nome completo"
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#334155' }}>Nome de Usuário (Login)*</label>
                            <input
                                name="adminUsername"
                                value={formData.adminUsername}
                                onChange={handleChange}
                                required
                                placeholder="Ex: joao_pizzaria"
                                style={inputStyle}
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#334155' }}>Email (Opcional)</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Para recuperação de conta"
                                style={inputStyle}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#334155' }}>Telefone</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="(00) 00000-0000"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#334155' }}>Senha</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="******"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#334155' }}>Confirmar</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="******"
                                    style={inputStyle}
                                />
                            </div>
                        </div>
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
                            marginTop: '25px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {isLoading ? 'Criando Conta...' : 'Começar Agora'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <Link to="/dashboard" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>
                            ← Voltar ao Painel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
};

export default RegisterRestaurant;

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Team.css';

const Team: React.FC = () => {
    const [members, setMembers] = useState<any[]>([]);
    const [restaurantSlug, setRestaurantSlug] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        role: 'WAITER'
    });

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/team');
            setMembers(res.data.data);
            setRestaurantSlug(res.data.restaurantSlug || '');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/team', formData);
            showSuccess('✅ Membro adicionado com sucesso!');
            setIsModalOpen(false);
            setFormData({ name: '', username: '', password: '', role: 'WAITER' });
            loadMembers();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Erro ao criar usuário';
            setError(`❌ ${msg}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Tem certeza? Esse usuário perderá acesso imediato.')) return;
        setError('');
        try {
            await api.delete(`/team/${id}`);
            showSuccess('🗑️ Usuário removido com sucesso!');
            loadMembers();
        } catch (err) {
            setError('Erro ao remover usuário');
        }
    };

    const roleMap: any = {
        'WAITER': 'Garçom',
        'KITCHEN': 'Cozinha',
        'ADMIN': 'Gerente',
        'SUPER_ADMIN': 'Plataforma'
    };

    return (
        <div className="team-page-container">
            <header className="page-header">
                <div>
                    <h1>👥 Gestão de Equipe</h1>
                    <p>Gerencie quem tem acesso ao sistema do seu restaurante.</p>
                </div>
                <button
                    className="btn-primary action-btn"
                    onClick={() => setIsModalOpen(true)}
                >
                    + Novo Membro
                </button>
            </header>

            {successMessage && <div className="success-message">{successMessage}</div>}
            {error && <div className="error-message">⚠️ {error}</div>}

            {/* Banner Informativo de Slug */}
            {restaurantSlug && (
                <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{ fontSize: '2rem' }}>🏢</div>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', color: '#1e40af', fontSize: '1.1rem' }}>
                            Código da Empresa: <strong style={{
                                background: '#dbeafe',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontSize: '1.2rem',
                                border: '1px dashed #2563eb'
                            }}>{restaurantSlug}</strong>
                        </h3>
                        <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.9rem' }}>
                            Seus funcionários podem precisar deste código para login, caso existam outros usuários com o mesmo nome na plataforma.
                        </p>
                    </div>
                </div>
            )}

            {isLoading ? <p>Carregando equipe...</p> : (
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Username de Acesso</th>
                                <th>Função</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(m => (
                                <tr key={m.id}>
                                    <td><strong>{m.name}</strong></td>
                                    <td><code>{m.username}</code></td>
                                    <td>
                                        <span className={`role-badge role-${m.role.toLowerCase()}`}>
                                            {roleMap[m.role] || m.role}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="action-btn btn-danger"
                                            onClick={() => handleDelete(m.id)}
                                        >
                                            Remover
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {members.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                        Nenhum membro encontrado. Adicione garçons ou cozinheiros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Novo Membro</h2>
                        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                            <div className="form-group">
                                <label>Nome Completo</label>
                                <input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ex: Maria da Silva"
                                />
                            </div>
                            <div className="form-group">
                                <label>Username (Login)</label>
                                <input
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    placeholder="Ex: maria"
                                />
                                <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
                                    Pode ser simples (ex: 'maria'). Se houver outra 'maria' noutro restaurante, o sistema pedirá o código da empresa.
                                </small>
                            </div>
                            <div className="form-group">
                                <label>Senha Inicial</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Função</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="WAITER">Garçom (Pedidos e Mesas)</option>
                                    <option value="KITCHEN">Cozinha (KDS)</option>
                                    <option value="ADMIN">Gerente (Acesso Total à Loja)</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="action-btn btn-cancel"
                                    style={{ padding: '10px 20px' }}
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="action-btn btn-primary"
                                    style={{ padding: '10px 20px' }}
                                >
                                    Criar Usuário
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;

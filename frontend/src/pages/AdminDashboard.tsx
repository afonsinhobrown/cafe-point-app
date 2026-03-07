import React, { useState, useEffect } from 'react';
import { api, applyRestaurantPlan } from '../services/api';
import './AdminDashboard.css';

type ApplyMode = 'days' | 'dates';

interface ApplyPlanFormState {
    planId: string;
    startDate: string;
    endDate: string;
    durationDays: string;
}

const AdminDashboard: React.FC = () => {
    // Estados Reais
    const [stats, setStats] = useState<any>(null);
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [finance, setFinance] = useState<any>(null);
    const [devices, setDevices] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('overview'); // overview, restaurants, plans, finance, devices

    // Novo Plano State
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);
    const [newPlan, setNewPlan] = useState({ name: '', monthlyPrice: '', maxUsers: '', maxTables: '', maxItems: '', duration: '30' });

    // History State
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [currentHistory, setCurrentHistory] = useState<any[]>([]);
    const [selectedRestaurantHistory, setSelectedRestaurantHistory] = useState('');

    // Apply plan modal state
    const [applyPlanModalOpen, setApplyPlanModalOpen] = useState(false);
    const [selectedRestaurantForPlan, setSelectedRestaurantForPlan] = useState<any | null>(null);
    const [applyMode, setApplyMode] = useState<ApplyMode>('days');
    const [applyPlanForm, setApplyPlanForm] = useState<ApplyPlanFormState>({
        planId: '',
        startDate: '',
        endDate: '',
        durationDays: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [resStats, resRest, resPlans, resFin, resDev] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/restaurants'),
                api.get('/admin/plans'),
                api.get('/admin/finance'),
                api.get('/admin/devices')
            ]);

            setStats(resStats.data.data);
            setRestaurants(resRest.data.data);
            setPlans(resPlans.data.data);
            setFinance(resFin.data.data);
            setDevices(resDev.data.data);
        } catch (error) {
            console.error('Failed to load admin data', error);
        }
    };

    const loadHistory = async (restaurantId: number, restaurantName: string) => {
        try {
            const res = await api.get(`/admin/restaurants/${restaurantId}/history`);
            setCurrentHistory(res.data.data);
            setSelectedRestaurantHistory(restaurantName);
            setHistoryModalOpen(true);
        } catch (error) {
            alert('Erro ao carregar histórico');
        }
    };

    const toDateInput = (value?: string | Date | null) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const openApplyPlanModal = (restaurant: any) => {
        const currentPlanId = restaurant.license?.planId ? String(restaurant.license.planId) : '';
        const fallbackPlanId = plans.length > 0 ? String(plans[0].id) : '';
        
        // Para renovação, usar a data de expiração atual ou hoje (o que for maior)
        const existingEndDate = restaurant.license?.endDate ? new Date(restaurant.license.endDate) : null;
        const today = new Date();
        const startDate = existingEndDate && existingEndDate > today 
            ? toDateInput(existingEndDate) 
            : toDateInput(today);

        setSelectedRestaurantForPlan(restaurant);
        setApplyMode('days');
        setApplyPlanForm({
            planId: currentPlanId || fallbackPlanId,
            startDate,
            endDate: '',
            durationDays: restaurant.license?.plan?.duration ? String(restaurant.license.plan.duration) : '30'
        });
        setApplyPlanModalOpen(true);
    };

    const closeApplyPlanModal = () => {
        setApplyPlanModalOpen(false);
        setSelectedRestaurantForPlan(null);
    };

    const handleApplyPlan = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedRestaurantForPlan) return;
        if (!applyPlanForm.planId) {
            alert('Selecione um plano');
            return;
        }

        const payload: { planId: number; startDate?: string; endDate?: string; durationDays?: number } = {
            planId: Number(applyPlanForm.planId),
            startDate: applyPlanForm.startDate || undefined
        };

        if (applyMode === 'dates') {
            if (!applyPlanForm.endDate) {
                alert('Informe a data fim');
                return;
            }
            payload.endDate = applyPlanForm.endDate;
        } else {
            if (!applyPlanForm.durationDays) {
                alert('Informe o número de dias');
                return;
            }
            payload.durationDays = Number(applyPlanForm.durationDays);
        }

        try {
            const response = await applyRestaurantPlan(selectedRestaurantForPlan.id, payload);
            alert(response.data?.message || 'Plano aplicado com sucesso');
            closeApplyPlanModal();
            loadData();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Erro ao aplicar plano');
        }
    };

    // Ações de Restaurante
    const handleRestAction = async (id: number, action: 'approve' | 'suspend') => {
        if (!confirm(`Confirmar ação: ${action}?`)) return;
        try {
            await api.post(`/admin/restaurants/${id}/${action}`);
            loadData();
        } catch (error) {
            alert('Erro ao processar ação');
        }
    };

    // Ações de Plano
    const handleCreatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/plans', newPlan);
            alert('Plano criado!');
            setIsCreatingPlan(false);
            setNewPlan({ name: '', monthlyPrice: '', maxUsers: '', maxTables: '', maxItems: '', duration: '30' });
            loadData();
        } catch (error) {
            alert('Erro ao criar plano');
        }
    };

    const handleUpdatePlan = async (id: number, field: string, value: string) => {
        try {
            const planToUpdate = plans.find(p => p.id === id);
            if (!planToUpdate) return;
            // Send update to API
            await api.put(`/admin/plans/${id}`, { ...planToUpdate, [field]: value });
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    // Ações de Dispositivo
    const handleDeviceAction = async (id: number, action: 'approve' | 'block') => {
        try {
            await api.post(`/admin/devices/${id}/${action}`);
            loadData();
        } catch (error) {
            alert('Erro ao gerir dispositivo');
        }
    };

    // RENDERERS
    const renderOverview = () => (
        <div className="admin-overview">
            <div className="stats-grid-admin">
                <div className="stat-card-admin blue">
                    <h3>Total Restaurantes</h3>
                    <p className="stat-value">{stats?.totalRestaurants || 0}</p>
                </div>
                <div className="stat-card-admin green">
                    <h3>Receita Mensal (Real)</h3>
                    <p className="stat-value">MT {stats?.totalRevenue?.toLocaleString() || '0'}</p>
                    <span className="stat-subtitle">Baseado em licenças ativas</span>
                </div>
                <div className="stat-card-admin purple">
                    <h3>Licenças Ativas</h3>
                    <p className="stat-value">{stats?.activeLicenses || 0}</p>
                </div>
                <div className="stat-card-admin orange">
                    <h3>Dispositivos Pendentes</h3>
                    <p className="stat-value">{stats?.pendingDevices || 0}</p>
                </div>
            </div>
        </div>
    );

    const renderRestaurants = () => (
        <div className="admin-section">
            <h3>Gerir Restaurantes</h3>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Dono</th>
                        <th>Uso Real</th>
                        <th>Plano</th>
                        <th>Vigência</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {restaurants.map(r => (
                        <tr key={r.id}>
                            <td>{r.name}</td>
                            <td>{r.ownerName}</td>
                            <td>
                                👥 {r._count?.users || 0}/{r.license?.plan?.maxUsers || 0}<br />
                                🪑 {r._count?.tables || 0}/{r.license?.plan?.maxTables || 0}
                            </td>
                            <td>
                                <span className="badge-plan">{r.license?.plan?.name || 'TRIAL'}</span>
                            </td>
                            <td>
                                <div className="validity-block">
                                    <div><strong>Início:</strong> {r.license?.startDate ? new Date(r.license.startDate).toLocaleDateString() : '-'}</div>
                                    <div><strong>Fim:</strong> {r.license?.endDate ? new Date(r.license.endDate).toLocaleDateString() : 'Ilimitado'}</div>
                                </div>
                            </td>
                            <td><span className={`badge-status ${r.status.toLowerCase()}`}>
                                {r.status === 'PENDING' ? 'Pendente' : r.status === 'ACTIVE' ? 'Ativo' : r.status === 'SUSPENDED' ? 'Suspenso' : r.status}
                            </span></td>
                            <td>
                                <button className="btn-secondary" style={{ marginRight: '8px', cursor: 'pointer', padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px' }} onClick={() => loadHistory(r.id, r.name)}>Histórico</button>
                                <button className="btn-secondary" style={{ marginRight: '8px', cursor: 'pointer', padding: '6px 12px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '6px' }} onClick={() => openApplyPlanModal(r)}>Aplicar plano</button>
                                {r.status !== 'ACTIVE' && <button className="btn-approve" onClick={() => handleRestAction(r.id, 'approve')}>Ativar</button>}
                                {r.status === 'ACTIVE' && <button className="btn-suspend" onClick={() => handleRestAction(r.id, 'suspend')}>Suspender</button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderPlans = () => (
        <div className="admin-section">
            <div className="section-header">
                <h3>📦 Planos de Subscrição</h3>
                <button className="btn-primary" onClick={() => setIsCreatingPlan(!isCreatingPlan)}>
                    {isCreatingPlan ? 'Cancelar' : 'Novo Plano'}
                </button>
            </div>

            {isCreatingPlan && (
                <form onSubmit={handleCreatePlan} className="create-plan-form">
                    <input placeholder="Nome (Ex: GOLD)" value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} required />
                    <input placeholder="Preço (MT)" type="number" value={newPlan.monthlyPrice} onChange={e => setNewPlan({ ...newPlan, monthlyPrice: e.target.value })} required />
                    <input placeholder="Max Usuários" type="number" value={newPlan.maxUsers} onChange={e => setNewPlan({ ...newPlan, maxUsers: e.target.value })} required />
                    <input placeholder="Max Mesas" type="number" value={newPlan.maxTables} onChange={e => setNewPlan({ ...newPlan, maxTables: e.target.value })} required />
                    <input placeholder="Duração padrão (dias)" type="number" value={newPlan.duration} onChange={e => setNewPlan({ ...newPlan, duration: e.target.value })} required />
                    <button type="submit" className="btn-save">Salvar Plano</button>
                </form>
            )}

            <div className="plans-config-grid">
                {plans.map(p => (
                    <div key={p.id} className="admin-plan-card">
                        <div className="plan-card-header">
                            <input
                                className="plan-name-input"
                                defaultValue={p.name}
                                onBlur={(e) => handleUpdatePlan(p.id, 'name', e.target.value)}
                            />
                            <div className="price-input-wrapper">
                                <span>MT</span>
                                <input
                                    type="number"
                                    className="plan-price-input"
                                    defaultValue={p.monthlyPrice}
                                    onBlur={(e) => handleUpdatePlan(p.id, 'monthlyPrice', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="plan-limits-config">
                            <label>Max Usuários:
                                <input type="number"
                                    defaultValue={p.maxUsers}
                                    onBlur={(e) => handleUpdatePlan(p.id, 'maxUsers', e.target.value)}
                                />
                            </label>
                            <label>Max Mesas:
                                <input type="number"
                                    defaultValue={p.maxTables}
                                    onBlur={(e) => handleUpdatePlan(p.id, 'maxTables', e.target.value)}
                                />
                            </label>
                            <label>Clientes Ativos: <strong>{p._count?.licenses || 0}</strong></label>
                            <label>Duração padrão (dias):
                                <input type="number"
                                    defaultValue={p.duration}
                                    onBlur={(e) => handleUpdatePlan(p.id, 'duration', e.target.value)}
                                />
                            </label>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderDevices = () => (
        <div className="admin-section">
            <h3>📱 Gestão de Dispositivos</h3>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Restaurante</th>
                        <th>Nome Disp.</th>
                        <th>Status</th>
                        <th>Visto em</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {devices.length === 0 && <tr><td colSpan={5}>Nenhum dispositivo registrado.</td></tr>}
                    {devices.map(d => (
                        <tr key={d.id}>
                            <td>{d.restaurant?.name}</td>
                            <td>{d.name}</td>
                            <td><span className={`badge-status ${d.status === 'AUTHORIZED' ? 'active' : d.status === 'BLOCKED' ? 'suspended' : 'pending'}`}>
                                {d.status === 'PENDING_APPROVAL' ? 'Pendente' : d.status === 'AUTHORIZED' ? 'Autorizado' : d.status === 'BLOCKED' ? 'Bloqueado' : d.status}
                            </span></td>
                            <td>{new Date(d.lastActiveAt).toLocaleString()}</td>
                            <td>
                                {d.status === 'PENDING_APPROVAL' && (
                                    <>
                                        <button className="btn-approve" onClick={() => handleDeviceAction(d.id, 'approve')}>Aprovar</button>
                                        <button className="btn-suspend" onClick={() => handleDeviceAction(d.id, 'block')}>Bloquear</button>
                                    </>
                                )}
                                {d.status === 'AUTHORIZED' && <button className="btn-suspend" onClick={() => handleDeviceAction(d.id, 'block')}>Bloquear</button>}
                                {d.status === 'BLOCKED' && <button className="btn-approve" onClick={() => handleDeviceAction(d.id, 'approve')}>Re-aprovar</button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderFinance = () => (
        <div className="admin-section">
            <h3>Relatório Financeiro</h3>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Restaurante</th>
                        <th>Plano</th>
                        <th>Receita</th>
                        <th>Data Início</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {finance?.transactions?.map((t: any) => (
                        <tr key={t.id}>
                            <td>{t.restaurantName}</td>
                            <td>{t.planName}</td>
                            <td>MT {t.amount}</td>
                            <td>{new Date(t.date).toLocaleDateString()}</td>
                            <td>{t.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="admin-dashboard-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand"><h2>👑 Admin Global</h2></div>
                <nav className="admin-nav">
                    <a onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? 'active' : ''}>📊 Visão Geral</a>
                    <a onClick={() => setActiveTab('restaurants')} className={activeTab === 'restaurants' ? 'active' : ''}>🏢 Restaurantes</a>
                    <a onClick={() => setActiveTab('plans')} className={activeTab === 'plans' ? 'active' : ''}>📋 Planos</a>
                    <a onClick={() => setActiveTab('devices')} className={activeTab === 'devices' ? 'active' : ''}>📱 Dispositivos</a>
                    <a onClick={() => setActiveTab('finance')} className={activeTab === 'finance' ? 'active' : ''}>💰 Financeiro</a>
                </nav>
            </aside>
            <main className="admin-content">
                <div className="admin-content-body">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'restaurants' && renderRestaurants()}
                    {activeTab === 'plans' && renderPlans()}
                    {activeTab === 'devices' && renderDevices()}
                    {activeTab === 'finance' && renderFinance()}
                </div>

                {historyModalOpen && (
                    <div className="modal-overlay">
                        <div className="payment-modal" style={{ maxWidth: '600px', width: '90%' }}>
                            <div className="modal-header">
                                <h3>Histórico: {selectedRestaurantHistory}</h3>
                                <button className="close-btn" style={{ fontSize: '2rem', cursor: 'pointer', border: 'none', background: 'transparent' }} onClick={() => setHistoryModalOpen(false)}>&times;</button>
                            </div>
                            <div className="admin-section" style={{ boxShadow: 'none', margin: 0, padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>De</th>
                                            <th>Para</th>
                                            <th>Preço</th>
                                            <th>Vigência</th>
                                            <th>Quem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentHistory.length === 0 && <tr><td colSpan={6}>Nenhum histórico disponível.</td></tr>}
                                        {currentHistory.map((h: any) => (
                                            <tr key={h.id}>
                                                <td>{new Date(h.createdAt).toLocaleString()}</td>
                                                <td>{h.oldPlanName}</td>
                                                <td><strong>{h.newPlanName}</strong></td>
                                                <td>MT {h.price}</td>
                                                <td>
                                                    <div className="validity-block">
                                                        <div><strong>Início:</strong> {h.startDate ? new Date(h.startDate).toLocaleDateString() : '-'}</div>
                                                        <div><strong>Fim:</strong> {h.endDate ? new Date(h.endDate).toLocaleDateString() : 'Ilimitado'}</div>
                                                    </div>
                                                </td>
                                                <td>{h.changedBy || 'Sistema'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {applyPlanModalOpen && selectedRestaurantForPlan && (
                    <div className="modal-overlay">
                        <div className="payment-modal apply-plan-modal">
                            <div className="modal-header">
                                <h3>Aplicar plano: {selectedRestaurantForPlan.name}</h3>
                                <button
                                    className="close-btn"
                                    style={{ fontSize: '2rem', cursor: 'pointer', border: 'none', background: 'transparent' }}
                                    onClick={closeApplyPlanModal}
                                >
                                    &times;
                                </button>
                            </div>

                            <form className="apply-plan-form" onSubmit={handleApplyPlan}>
                                <label>
                                    Plano
                                    <select
                                        value={applyPlanForm.planId}
                                        onChange={(e) => setApplyPlanForm((prev) => ({ ...prev, planId: e.target.value }))}
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {plans.map((plan) => (
                                            <option key={plan.id} value={plan.id}>
                                                {plan.name} - MT {plan.monthlyPrice}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Data de início
                                    <input
                                        type="date"
                                        value={applyPlanForm.startDate}
                                        onChange={(e) => setApplyPlanForm((prev) => ({ ...prev, startDate: e.target.value }))}
                                        required
                                    />
                                </label>

                                <div className="apply-mode-row">
                                    <button
                                        type="button"
                                        className={`mode-button ${applyMode === 'days' ? 'active' : ''}`}
                                        onClick={() => setApplyMode('days')}
                                    >
                                        Por número de dias
                                    </button>
                                    <button
                                        type="button"
                                        className={`mode-button ${applyMode === 'dates' ? 'active' : ''}`}
                                        onClick={() => setApplyMode('dates')}
                                    >
                                        Por data fim
                                    </button>
                                </div>

                                {applyMode === 'days' ? (
                                    <label>
                                        Duração (dias)
                                        <input
                                            type="number"
                                            min={1}
                                            value={applyPlanForm.durationDays}
                                            onChange={(e) => setApplyPlanForm((prev) => ({ ...prev, durationDays: e.target.value }))}
                                            required
                                        />
                                    </label>
                                ) : (
                                    <label>
                                        Data fim
                                        <input
                                            type="date"
                                            value={applyPlanForm.endDate}
                                            onChange={(e) => setApplyPlanForm((prev) => ({ ...prev, endDate: e.target.value }))}
                                            required
                                        />
                                    </label>
                                )}

                                <div className="apply-plan-actions">
                                    <button type="button" className="btn-secondary" onClick={closeApplyPlanModal}>Cancelar</button>
                                    <button type="submit" className="btn-primary">Aplicar plano</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;

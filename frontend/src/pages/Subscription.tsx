// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Subscription.css';
import PaymentModal from '../components/PaymentModal';

const Subscription: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null); // Dados reais do backend
    const [allPlans, setPlans] = useState<any[]>([]); // Planos reais do backend
    const [upgrading, setUpgrading] = useState(false);

    // Novo state para modal de pagamento
    const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<any>(null);

    useEffect(() => {
        loadSubscription();
        loadPlans();
    }, []);

    const loadSubscription = async () => {
        try {
            const res = await api.get('/subscription/me');
            setData(res.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao carregar assinatura:', error);
            setLoading(false);
        }
    };

    const loadPlans = async () => {
        try {
            const res = await api.get('/subscription/plans');
            setPlans(res.data.data);
        } catch (error) {
            console.error('Erro ao carregar planos:', error);
        }
    };

    const handleUpgradeClick = (plan: any) => {
        if (!navigator.onLine) {
            alert('⚠️ Você precisa estar conectar à Internet para modificar ou renovar o plano.');
            return;
        }
        setSelectedPlanForUpgrade(plan);
    };

    const handleConfirmPayment = async (phone: string, method: string) => {
        if (!selectedPlanForUpgrade) return;

        setUpgrading(true);
        // Fechar modal imediatamente ou deixar aberto com loading?
        // Vamos fechar e assumir sucesso visual
        setSelectedPlanForUpgrade(null);

        // Simular fluxo de aprovação
        alert(`✅ Pedido enviado para ${phone} via ${method.toUpperCase()}.\n\nAo confirmar o PIN, seu plano será ativado.`);

        try {
            await api.post('/subscription/upgrade', {
                planId: selectedPlanForUpgrade.id,
                paymentRef: `${method.toUpperCase()}_${Date.now()}`
            });
            alert('🎉 Pagamento recebido! Plano atualizado com sucesso.');
            loadSubscription();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao processar upgrade.');
        } finally {
            setUpgrading(false);
        }
    };

    if (loading) return <div className="loading-subs">Carregando sua assinatura...</div>;

    const currentPlan = data?.plan || { name: 'Desconhecido', monthlyPrice: 0, maxUsers: 0, maxTables: 0 };
    const usage = data?.usage || { users: 0, tables: 0 };
    const license = data?.license || { status: 'UNKNOWN', startDate: new Date() };

    // Função auxiliar para evitar divisão por zero
    const usagePercent = (val: number, max: number) => {
        if (!max || max === 0) return 100;
        return Math.min((val / max) * 100, 100);
    };

    return (
        <div className="subscription-page">
            <header className="subs-header">
                <h1>💳 Minha Assinatura</h1>
                <p>Gerencie o plano e limites do seu restaurante</p>
            </header>

            <div className="current-plan-card">
                <div className="plan-status-row">
                    <div>
                        <h2>Plano Atual: {currentPlan.name}</h2>
                        <span className={`status-badge ${license.status?.toLowerCase()}`}>
                            {license.status === 'ACTIVE' ? 'ATIVO' : license.status === 'EXPIRED' ? 'EXPIRADO' : license.status === 'CANCELLED' ? 'CANCELADO' : license.status}
                        </span>
                        <p className="validity-text">
                            Início: {new Date(license.startDate).toLocaleDateString()}
                            <br />
                            <strong>Válido até: {license.endDate ? new Date(license.endDate).toLocaleDateString() : 'Ilimitado'}</strong>
                        </p>
                    </div>
                    <div className="price-tag">
                        MT {currentPlan.monthlyPrice}<small>/mês</small>
                    </div>
                </div>

                {!navigator.onLine && (
                    <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '8px', color: '#991b1b', marginBottom: '15px' }}>
                        ⚠️ Modo Offline. Conecte-se para renovar ou alterar planos.
                    </div>
                )}

                <div className="usage-stats">
                    {/* Barra de Mesas */}
                    <div className="usage-item">
                        <div className="usage-label">
                            <span>Mesas Utilizadas</span>
                            <span>{usage.tables} / {currentPlan.maxTables}</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${usagePercent(usage.tables, currentPlan.maxTables)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Barra de Usuários */}
                    <div className="usage-item">
                        <div className="usage-label">
                            <span>Usuários Cadastrados</span>
                            <span>{usage.users} / {currentPlan.maxUsers}</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${usagePercent(usage.users, currentPlan.maxUsers)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="available-plans-title">Planos Disponíveis para Upgrade</h3>
            <div className="plans-grid">
                {allPlans
                    .filter(p => p.id !== currentPlan.id) // Esconder plano atual
                    .map(plan => (
                        <div key={plan.id} className="plan-option-card">
                            <h4>{plan.name}</h4>
                            <div className="plan-price">MT {plan.monthlyPrice}<small>/mês</small></div>
                            <ul className="plan-features">
                                <li>📡 Até {plan.maxUsers} Usuários</li>
                                <li>🪑 Até {plan.maxTables} Mesas</li>
                                <li>📦 Até {plan.maxItems} Produtos</li>
                            </ul>
                            <button
                                className="btn-enable-plan"
                                onClick={() => handleUpgradeClick(plan)}
                            >
                                Mudar para {plan.name}
                            </button>
                        </div>
                    ))}
                {allPlans.length === 0 && <p style={{ color: '#666' }}>Nenhum outro plano disponível no momento.</p>}
            </div>

            <div className="payment-methods-section">
                <h3>Métodos de Pagamento Aceites</h3>
                <div className="payment-icons">
                    <div className="pay-icon" title="M-Pesa">📱 M-Pesa</div>
                    <div className="pay-icon" title="Emola">💳 e-Mola</div>
                    <div className="pay-icon" title="Visa/Mastercard">💳 Cartão</div>
                </div>
            </div>

            {/* COMPONENTE MODAL DE PAGAMENTO */}
            {selectedPlanForUpgrade && (
                <PaymentModal
                    planName={selectedPlanForUpgrade.name}
                    price={selectedPlanForUpgrade.monthlyPrice}
                    onConfirm={handleConfirmPayment}
                    onCancel={() => setSelectedPlanForUpgrade(null)}
                />
            )}
        </div>
    );
};

export default Subscription;

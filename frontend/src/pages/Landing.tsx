import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const licensePlans = [
    {
        name: 'TRIAL',
        subtitle: 'Teste completo por tempo limitado',
        price: 'Gratuito',
        features: [
            'Acesso inicial ao POS e gestão de pedidos',
            'Relatórios essenciais de vendas e custos',
            'Controle básico de stock'
        ]
    },
    {
        name: 'PRO',
        subtitle: 'Operação diária para restaurantes em crescimento',
        price: 'Sob consulta',
        features: [
            'Caixa completo com transferências internas',
            'Gestão avançada de stock e receitas',
            'Dashboards e analytics operacional'
        ]
    },
    {
        name: 'ENTERPRISE',
        subtitle: 'Escala para operações multi-unidade',
        price: 'Sob proposta',
        features: [
            'Governança e suporte personalizado',
            'Configuração dedicada de licença e implantação',
            'Acompanhamento técnico contínuo'
        ]
    }
];

const culinaryImages = [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80'
];

const Landing: React.FC = () => {
    return (
        <div className="landing-page">
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <img src={culinaryImages[0]} alt="Pratos de culinária" className="hero-image" />
                <div className="hero-content">
                    <p className="hero-kicker">CaféPoint</p>
                    <h1>Gestão inteligente para restaurantes modernos</h1>
                    <p>
                        Controle pedidos, caixa, faturação e stock em uma plataforma única,
                        com foco em desempenho operacional e experiência do cliente.
                    </p>
                    <div className="hero-actions">
                        <Link to="/login" className="btn-primary">Entrar no Sistema</Link>
                        <a href="#planos" className="btn-secondary">Ver Planos de Licença</a>
                    </div>
                </div>
            </section>

            <section className="culinary-gallery">
                <div className="gallery-card">
                    <img src={culinaryImages[1]} alt="Culinária artesanal" />
                    <div className="gallery-label">Operação de sala e cozinha conectadas</div>
                </div>
                <div className="gallery-card">
                    <img src={culinaryImages[2]} alt="Apresentação gastronómica" />
                    <div className="gallery-label">Decisões orientadas por dados em tempo real</div>
                </div>
            </section>

            <section id="planos" className="plans-section">
                <div className="section-head">
                    <p className="mini-title">Licenciamento</p>
                    <h2>Planos de licença para cada fase do seu negócio</h2>
                </div>
                <div className="plans-grid">
                    {licensePlans.map(plan => (
                        <article key={plan.name} className="plan-card">
                            <h3>{plan.name}</h3>
                            <p className="plan-subtitle">{plan.subtitle}</p>
                            <p className="plan-price">{plan.price}</p>
                            <ul>
                                {plan.features.map(feature => (
                                    <li key={feature}>{feature}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>

            <section className="supplier-section">
                <div className="supplier-card">
                    <p className="mini-title">Fornecedor Oficial</p>
                    <h2>TECNOINCUBADORA, LDA</h2>
                    <p>
                        Parceiro tecnológico responsável pela solução CaféPoint.
                        Dados de fornecedor exibidos nesta landing para referência comercial e institucional.
                    </p>
                    <div className="supplier-data">
                        <span><strong>Empresa:</strong> TECNOINCUBADORA, LDA</span>
                        <span><strong>Serviço:</strong> Licenciamento e suporte da plataforma CaféPoint</span>
                        <span><strong>Canal:</strong> Dados comerciais e contratuais via proposta/licença</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;

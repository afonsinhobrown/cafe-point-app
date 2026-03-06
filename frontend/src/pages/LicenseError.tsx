import React, { useEffect, useState } from 'react';
import { getLicenseStatus } from '../services/api';
import './LicenseError.css';

const LicenseError: React.FC = () => {
    const [licenseInfo, setLicenseInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const res = await getLicenseStatus();
            setLicenseInfo(res.data);
            if (res.data.valid) {
                // Se a licença for válida, recarregar para sair desta tela
                window.location.href = '/';
            }
        } catch (error: any) {
            setLicenseInfo(error.response?.data || { message: 'Erro de conexão com o servidor.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // Tentar verificar novamente a cada 10 segundos caso o usuário ative
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="license-lock-screen">Verificando licença...</div>;

    return (
        <div className="license-lock-screen">
            <div className="license-error-card">
                <div className="error-icon">🔒</div>
                <h1>Sistema Bloqueado</h1>
                <p className="error-message">
                    {licenseInfo?.message || 'Uma licença válida é necessária para operar o sistema.'}
                </p>

                <div className="hw-info">
                    <span>ID de Hardware desta máquina:</span>
                    <code>{licenseInfo?.machineId || 'Não detectado'}</code>
                </div>

                <div className="instruction-box">
                    <h3>Como resolver?</h3>
                    <p>Entre em contato com o suporte técnico e informe o ID de Hardware acima para solicitar a ativação do seu CaféPoint.</p>
                </div>

                <button onClick={fetchStatus} className="btn-retry">
                    Verificar Novamente
                </button>
            </div>
        </div>
    );
};

export default LicenseError;

import React, { useState, useEffect } from 'react';
import { getRestaurantSettings, updateRestaurantSettings } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings: React.FC = () => {
    const { updateUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        ownerName: '',
        email: '',
        phone: '',
        address: '',
        logo: '',
        nuit: '',
        ivaPercent: 17,
        receiptPreference: 'THERMAL'
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await getRestaurantSettings();
            if (res.data.success) {
                setFormData(res.data.data);
                if (res.data.data.logo) {
                    setLogoPreview(res.data.data.logo);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar definições:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar definições.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    data.append(key, value.toString());
                }
            });
            if (logoFile) {
                data.append('logoFile', logoFile);
            }

            const res = await updateRestaurantSettings(data);
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Definições atualizadas com sucesso!' });
                updateUser({ restaurantName: formData.name }); // Atualiza o nome globalmente no app
                fetchSettings(); // Refresh to get the new logo path
            }
        } catch (error) {
            console.error('Erro ao salvar definições:', error);
            setMessage({ type: 'error', text: 'Erro ao salvar definições.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="loading">Carregando definições...</div>;

    return (
        <div className="settings-page">
            <header className="settings-header">
                <h1>⚙️ Configurações do Restaurante</h1>
                <p>Gerencie as informações que aparecem nas suas faturas e recibos.</p>
            </header>

            {message.text && (
                <div className={`${message.type}-message`}>
                    {message.type === 'error' ? '⚠️ ' : ''}{message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="settings-form glass-card">
                <div className="settings-grid">
                    <div className="settings-section">
                        <h3>🏢 Informações Gerais</h3>
                        <div className="form-group">
                            <label>Nome do Estabelecimento</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>NUIT (Número de Identificação Tributária)</label>
                            <input
                                type="text"
                                name="nuit"
                                value={formData.nuit}
                                onChange={handleInputChange}
                                placeholder="800XXXXXX"
                            />
                        </div>
                        <div className="form-group">
                            <label>Logotipo da Instituição</label>
                            <input
                                type="file"
                                name="logoFile"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="file-input"
                            />
                            {logoPreview && (
                                <div className="logo-preview">
                                    <img src={logoPreview.startsWith('blob:') ? logoPreview : logoPreview} alt="Logo Preview" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3>📞 Contacto e Endereço</h3>
                        <div className="form-group">
                            <label>Telefone</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>E-mail comercial</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Endereço Físico</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3>🧾 Faturação e Impressão</h3>
                        <div className="form-group">
                            <label>Percentagem do IVA (%)</label>
                            <input
                                type="number"
                                name="ivaPercent"
                                value={formData.ivaPercent}
                                onChange={handleInputChange}
                                step="0.01"
                            />
                        </div>
                        <div className="form-group">
                            <label>Preferência de Impressão</label>
                            <select
                                name="receiptPreference"
                                value={formData.receiptPreference}
                                onChange={handleInputChange}
                            >
                                <option value="THERMAL">Recibo Térmico (58mm/80mm)</option>
                                <option value="A4">Documento A4 (Padrão)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-save-settings" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        <span>💾</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;

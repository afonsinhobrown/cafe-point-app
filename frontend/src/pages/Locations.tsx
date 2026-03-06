import React, { useState, useEffect } from 'react';
import { Location } from '../types';
import { getLocations, createLocation, updateLocation, deleteLocation } from '../services/api';
import './Locations.css';

const Locations: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const response = await getLocations();
            setLocations(response.data.data);
        } catch (error) {
            console.error('Erro ao carregar localizações:', error);
        }
    };

    const handleOpenModal = (location?: Location) => {
        if (location) {
            setEditingLocation(location);
            setFormData({ name: location.name, description: location.description || '' });
        } else {
            setEditingLocation(null);
            setFormData({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLocation(null);
        setFormData({ name: '', description: '' });
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
            setIsLoading(true);
            if (editingLocation) {
                await updateLocation(editingLocation.id, formData);
                showSuccess('✅ Área atualizada com sucesso!');
            } else {
                await createLocation(formData);
                showSuccess('✅ Área criada com sucesso!');
            }
            fetchLocations();
            handleCloseModal();
        } catch (err: any) {
            console.error('Erro ao salvar localização:', err);
            setError(err.response?.data?.message || 'Erro ao salvar localização');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir esta área?')) {
            setError('');
            try {
                await deleteLocation(id);
                showSuccess('🗑️ Área removida com sucesso!');
                fetchLocations();
            } catch (err: any) {
                console.error('Erro ao excluir localização:', err);
                setError(err.response?.data?.message || 'Erro ao excluir localização');
            }
        }
    };

    return (
        <div className="locations-page">
            <header className="locations-header">
                <div>
                    <h1>🗺️ Áreas do Café</h1>
                    <p>Gerencie os espaços onde as mesas estão localizadas</p>
                </div>
                <button className="add-btn" onClick={() => handleOpenModal()}>
                    ➕ Nova Área
                </button>
            </header>

            {successMessage && <div className="success-message">{successMessage}</div>}
            {error && <div className="error-message">⚠️ {error}</div>}

            <div className="locations-grid">
                {locations.map(loc => (
                    <div key={loc.id} className="location-card">
                        <div className="location-info">
                            <h3>{loc.name}</h3>
                            <p>{loc.description || 'Sem descrição'}</p>
                        </div>
                        <div className="location-actions">
                            <button className="edit-btn" onClick={() => handleOpenModal(loc)}>✏️</button>
                            <button className="delete-btn" onClick={() => handleDelete(loc.id)}>🗑️</button>
                        </div>
                    </div>
                ))}

                {locations.length === 0 && (
                    <div className="empty-state">
                        <p>Nenhuma área cadastrada ainda.</p>
                        <button onClick={() => handleOpenModal()}>Cadastrar Primeira Área</button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="location-modal-overlay">
                    <div className="location-modal">
                        <h2>{editingLocation ? '✏️ Editar Área' : '➕ Nova Área'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome da Área *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Esplanada, Salão Principal"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detalhes sobre esta área..."
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={handleCloseModal} className="cancel-btn">
                                    Cancelar
                                </button>
                                <button type="submit" className="submit-btn" disabled={isLoading}>
                                    {isLoading ? 'Salvando...' : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Locations;

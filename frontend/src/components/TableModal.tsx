import React, { useState, useEffect } from 'react';
import { Location } from '../types';
import { getLocations } from '../services/api';
import './TableModal.css';

interface TableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (tableData: TableFormData) => void;
    table?: TableFormData | null;
}

export interface TableFormData {
    id?: number;
    number: number;
    capacity: number;
    locationId?: number;
    location?: string;
    type: 'BAR_COUNTER' | 'TABLE_2' | 'TABLE_4' | 'TABLE_6' | 'TABLE_8' | 'BOOTH';
}

const TableModal: React.FC<TableModalProps> = ({ isOpen, onClose, onSubmit, table }) => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [formData, setFormData] = useState<TableFormData>({
        number: 0,
        capacity: 2,
        locationId: undefined,
        type: 'TABLE_2'
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (isOpen) {
            fetchLocations();
        }
    }, [isOpen]);

    const fetchLocations = async () => {
        try {
            const response = await getLocations();
            setLocations(response.data.data);
        } catch (error) {
            console.error('Erro ao buscar localizações:', error);
        }
    };

    useEffect(() => {
        if (table) {
            setFormData(table);
        } else {
            setFormData({
                number: 0,
                capacity: 2,
                locationId: locations.length > 0 ? locations[0].id : undefined,
                type: 'TABLE_2'
            });
        }
        setErrors({});
    }, [table, isOpen, locations]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'number' || name === 'capacity' || name === 'locationId' ? parseInt(value) || 0 : value
        }));
        // Limpar erro do campo ao editar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.number || formData.number <= 0) {
            newErrors.number = 'Número da mesa é obrigatório e deve ser maior que 0';
        }

        if (!formData.capacity || formData.capacity <= 0) {
            newErrors.capacity = 'Capacidade é obrigatória e deve ser maior que 0';
        }

        if (!formData.type) {
            newErrors.type = 'Tipo da mesa é obrigatório';
        }

        if (!formData.locationId) {
            newErrors.locationId = 'Localização é obrigatória';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{table ? '✏️ Editar Mesa' : '➕ Nova Mesa'}</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="table-form">
                    <div className="form-group">
                        <label>Número da Mesa *</label>
                        <input
                            type="number"
                            name="number"
                            value={formData.number || ''}
                            onChange={handleChange}
                            className={errors.number ? 'error' : ''}
                            placeholder="Ex: 1"
                        />
                        {errors.number && <span className="error-text">{errors.number}</span>}
                    </div>

                    <div className="form-group">
                        <label>Capacidade (lugares) *</label>
                        <input
                            type="number"
                            name="capacity"
                            value={formData.capacity || ''}
                            onChange={handleChange}
                            className={errors.capacity ? 'error' : ''}
                            placeholder="Ex: 4"
                        />
                        {errors.capacity && <span className="error-text">{errors.capacity}</span>}
                    </div>

                    <div className="form-group">
                        <label>Localização (Área) *</label>
                        <select
                            name="locationId"
                            value={formData.locationId || ''}
                            onChange={handleChange}
                            className={errors.locationId ? 'error' : ''}
                        >
                            <option value="">Selecione uma área...</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                        {errors.locationId && <span className="error-text">{errors.locationId}</span>}
                        {locations.length === 0 && (
                            <span className="info-text">⚠️ Nenhuma área cadastrada. Cadastre em Áreas primeiro.</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Tipo de Mesa *</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className={errors.type ? 'error' : ''}
                        >
                            <option value="BAR_COUNTER">Balcão de Bar</option>
                            <option value="TABLE_2">Mesa para 2</option>
                            <option value="TABLE_4">Mesa para 4</option>
                            <option value="TABLE_6">Mesa para 6</option>
                            <option value="TABLE_8">Mesa para 8</option>
                            <option value="BOOTH">Cabine</option>
                        </select>
                        {errors.type && <span className="error-text">{errors.type}</span>}
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={locations.length === 0}>
                            {table ? '💾 Salvar' : '➕ Criar Mesa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TableModal;

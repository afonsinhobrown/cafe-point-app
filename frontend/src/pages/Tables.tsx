import React, { useState, useEffect } from 'react';
import { Table } from '../types';
import { api } from '../services/api';
import TableModal, { TableFormData } from '../components/TableModal';
import OrderModal from '../components/OrderModal';
import './Tables.css';

const Tables: React.FC = () => {
    const [tables, setTables] = useState<Table[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<TableFormData | null>(null);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [successMessage, setSuccessMessage] = useState('');

    const loadTables = async () => {
        try {
            setIsLoading(true);
            setError('');
            const response = await api.get('/tables');
            setTables(response.data.data);
        } catch (error: any) {
            console.error('Erro ao carregar mesas:', error);
            setError('Erro ao carregar mesas.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTables();
    }, []);

    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleCreateTable = async (tableData: TableFormData) => {
        try {
            await api.post('/tables', tableData);
            showSuccess('✅ Mesa criada com sucesso!');
            setIsModalOpen(false);
            loadTables();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erro ao criar mesa';
            alert(`❌ ${message}`);
        }
    };

    const handleUpdateTable = async (tableData: TableFormData) => {
        try {
            await api.put(`/tables/${tableData.id}`, tableData);
            showSuccess('✅ Mesa atualizada com sucesso!');
            setIsModalOpen(false);
            setEditingTable(null);
            loadTables();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erro ao atualizar mesa';
            alert(`❌ ${message}`);
        }
    };

    const handleDeleteTable = async (id: number) => {
        if (!confirm('Tem certeza que deseja deletar esta mesa?')) {
            return;
        }

        try {
            await api.delete(`/tables/${id}`);
            showSuccess('✅ Mesa deletada com sucesso!');
            loadTables();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erro ao deletar mesa';
            alert(`❌ ${message}`);
        }
    };

    const handleModalSubmit = (tableData: TableFormData) => {
        if (editingTable) {
            handleUpdateTable(tableData);
        } else {
            handleCreateTable(tableData);
        }
    };

    const openCreateModal = () => {
        setEditingTable(null);
        setIsModalOpen(true);
    };

    const openEditModal = (table: Table) => {
        setEditingTable({
            id: table.id,
            number: table.number,
            capacity: table.capacity,
            location: table.location || '',
            type: table.type as any
        });
        setIsModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'available';
            case 'OCCUPIED': return 'occupied';
            case 'PENDING': return 'pending';
            case 'PREPARING': return 'preparing';
            case 'READY': return 'ready';
            default: return 'available';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'Livre';
            case 'OCCUPIED': return 'Ocupada';
            case 'PENDING': return 'Pendente';
            case 'PREPARING': return 'Preparando';
            case 'READY': return 'Pronto';
            default: return status;
        }
    };

    const handleTableClick = (table: Table) => {
        setSelectedTable(table);
        setIsOrderModalOpen(true);
    };

    const handleOrderCreated = () => {
        showSuccess('✅ Pedido criado com sucesso!');
        loadTables(); // Recarregar para atualizar status da mesa
    };

    if (isLoading) {
        return (
            <div className="tables-page">
                <div className="loading">🔄 A carregar mesas...</div>
            </div>
        );
    }

    return (
        <div className="tables-page">
            <header className="tables-header">
                <h1>🪑 Gestão de Mesas</h1>
                <div className="header-actions">
                    <span className="table-count">{tables.length} mesas</span>
                    <button onClick={loadTables} className="refresh-button">
                        🔄 Atualizar
                    </button>
                    <button onClick={openCreateModal} className="create-button">
                        ➕ Nova Mesa
                    </button>
                </div>
            </header>

            {successMessage && (
                <div className="success-message">
                    {successMessage}
                </div>
            )}

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            <div className="tables-grid">
                {tables.map((table) => (
                    <div
                        key={table.id}
                        className={`table-card ${getStatusColor(table.currentStatus)}`}
                    >
                        <div className="table-header">
                            <div className="table-number">Mesa {table.number}</div>
                            <div className="table-actions">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(table);
                                    }}
                                    className="edit-btn"
                                    title="Editar"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTable(table.id);
                                    }}
                                    className="delete-btn"
                                    title="Deletar"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <div className="table-info" onClick={() => handleTableClick(table)}>
                            <div className="table-capacity">💺 {table.capacity} lugares</div>
                            <div className="table-status">{getStatusText(table.currentStatus)}</div>
                            <div className="table-location">📍 {table.location}</div>
                            <div className="table-action">
                                {table.currentStatus === 'AVAILABLE' ? '➕ Criar Pedido' : '📋 Ver Pedido'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {tables.length === 0 && !isLoading && (
                <div className="empty-state">
                    <h3>📭 Nenhuma mesa encontrada</h3>
                    <p>Comece criando sua primeira mesa</p>
                    <button onClick={openCreateModal} className="create-button-large">
                        ➕ Criar Primeira Mesa
                    </button>
                </div>
            )}

            <TableModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTable(null);
                }}
                onSubmit={handleModalSubmit}
                table={editingTable}
            />

            <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => {
                    setIsOrderModalOpen(false);
                    setSelectedTable(null);
                }}
                table={selectedTable}
                onOrderCreated={handleOrderCreated}
            />
        </div>
    );
};

export default Tables;
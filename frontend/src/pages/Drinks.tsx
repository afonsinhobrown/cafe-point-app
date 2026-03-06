import React, { useState, useEffect } from 'react';
import { MenuItem, Brand, Supplier } from '../types';
import {
    getMenu, createMenuItem, updateMenuItem, deleteMenuItem,
    getStockMovements, createStockMovement,
    getBrands, createBrand, deleteBrand,
    getSuppliers, createSupplier, deleteSupplier
} from '../services/api';
import './Drinks.css'; // Podemos manter o CSS ou renomear depois

const Drinks: React.FC = () => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [movements, setMovements] = useState<any[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'catalog'>('inventory');
    const [catalogSubTab, setCatalogSubTab] = useState<'brands' | 'suppliers'>('brands');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [lowStockCount, setLowStockCount] = useState(0);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [selectedForMovement, setSelectedForMovement] = useState<MenuItem | null>(null);

    const [newItemName, setNewItemName] = useState('');

    const [supplierFormData, setSupplierFormData] = useState({
        name: '',
        nuit: '',
        email: '',
        phone: '',
        address: '',
        description: ''
    });

    const [formData, setFormData] = useState({
        name: '',
        brandId: '',
        supplierId: '',
        price: '',
        costPrice: '',
        category: 'Geral',
        volume: '',
        unit: 'un',
        barcode: '',
        expiryDate: '',
        stockQuantity: '0',
        minStock: '10',
        maxStock: '100',
        isAvailable: true
    });

    const [movementData, setMovementData] = useState({
        type: 'ENTRY',
        quantity: '',
        reason: '',
        supplierId: '',
        purchasePrice: '',
        sellingPrice: ''
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        try {
            setIsLoading(true);

            const [brandsRes, suppliersRes] = await Promise.all([
                getBrands(),
                getSuppliers()
            ]);
            setBrands(brandsRes.data.data);
            setSuppliers(suppliersRes.data.data);

            if (activeTab === 'inventory') {
                const response = await getMenu({ all: 'true' });
                // AGORA MOSTRA TUDO, SEM FILTRO
                const allItems = response.data.data;
                setItems(allItems);

                const low = allItems.filter((d: MenuItem) => d.stockQuantity != null && d.stockQuantity <= (d.minStock || 5));
                setLowStockCount(low.length);
            } else if (activeTab === 'history') {
                const response = await getStockMovements();
                setMovements(response.data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (item?: MenuItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                brandId: item.brandId?.toString() || '',
                supplierId: item.supplierId?.toString() || '',
                price: item.price.toString(),
                costPrice: item.costPrice?.toString() || '0',
                category: item.category || 'Geral',
                volume: item.volume || '',
                unit: item.unit || 'un',
                barcode: item.barcode || '',
                expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
                stockQuantity: item.stockQuantity?.toString() || '0',
                minStock: item.minStock?.toString() || '10',
                maxStock: item.maxStock?.toString() || '100',
                isAvailable: item.isAvailable
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                brandId: '',
                supplierId: '',
                price: '',
                costPrice: '',
                category: 'Geral',
                volume: '',
                unit: 'un',
                barcode: '',
                expiryDate: '',
                stockQuantity: '0',
                minStock: '10',
                maxStock: '100',
                isAvailable: true
            });
        }
        setIsModalOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (editingItem) {
                await updateMenuItem(editingItem.id, formData);
                showSuccess('✅ Produto atualizado!');
            } else {
                await createMenuItem(formData);
                showSuccess('✅ Produto criado!');
            }
            loadData();
            setIsModalOpen(false);
        } catch (err: any) {
            console.error('Erro ao salvar item:', err);
            setError(err.response?.data?.message || 'Erro ao salvar item.');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Deseja realmente remover este item do sistema?')) {
            setError('');
            try {
                await deleteMenuItem(id);
                showSuccess('🗑️ Item removido!');
                loadData();
            } catch (err: any) {
                console.error('Erro ao remover:', err);
                setError('Erro ao remover item.');
            }
        }
    };

    const handleOpenMovementModal = (item: MenuItem) => {
        setSelectedForMovement(item);
        setMovementData({
            type: 'ENTRY',
            quantity: '',
            reason: '',
            supplierId: item.supplierId?.toString() || '',
            purchasePrice: item.costPrice?.toString() || '',
            sellingPrice: item.price.toString()
        });
        setIsMovementModalOpen(true);
    };

    const handleMovementSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedForMovement) return;
        setError('');
        try {
            await createStockMovement({
                menuItemId: selectedForMovement.id,
                quantity: parseInt(movementData.quantity),
                type: movementData.type,
                reason: movementData.reason,
                supplierId: movementData.supplierId || null,
                purchasePrice: movementData.purchasePrice || null,
                sellingPrice: movementData.sellingPrice || null
            });
            showSuccess(`✅ Movimento de ${movementData.type} registado!`);
            loadData();
            setIsMovementModalOpen(false);
        } catch (err: any) {
            console.error('Erro ao registar movimento:', err);
            setError('Erro ao registar movimento de stock.');
        }
    };

    const handleQuickAddCatalog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName) return;
        setError('');
        try {
            if (catalogSubTab === 'brands') {
                await createBrand({ name: newItemName });
                showSuccess('✅ Marca adicionada!');
                setNewItemName('');
                loadData();
            } else {
                setIsSupplierModalOpen(true);
            }
        } catch (err: any) {
            console.error('Erro ao adicionar:', err);
            setError('Erro ao adicionar item ao catálogo.');
        }
    };

    const handleSupplierSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await createSupplier(supplierFormData);
            showSuccess('✅ Fornecedor registado!');
            setSupplierFormData({ name: '', nuit: '', email: '', phone: '', address: '', description: '' });
            setIsSupplierModalOpen(false);
            loadData();
        } catch (err: any) {
            console.error('Erro ao criar fornecedor:', err);
            setError(err.response?.data?.message || 'Erro ao criar fornecedor.');
        }
    };

    return (
        <div className="drinks-mgmt-page">
            <header className="drinks-mgmt-header">
                <div>
                    <h1>📦 Gestão de Estoque</h1>
                    <p>Controlo total de stock: Comidas, Bebidas e Insumos</p>
                </div>
                <div className="header-actions">
                    <button className="add-btn" onClick={() => handleOpenModal()} title="Adicionar um novo produto">
                        ✨ Novo Produto
                    </button>
                </div>
            </header>

            {successMessage && <div className="success-message">{successMessage}</div>}
            {error && <div className="error-message">⚠️ {error}</div>}

            <nav className="tab-navigation">
                <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
                    📋 Inventário Actual
                </button>
                <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
                    📂 Histórico de Movimentos
                </button>
                <button className={activeTab === 'catalog' ? 'active' : ''} onClick={() => setActiveTab('catalog')}>
                    🏷️ Marcas e Fornecedores
                </button>
            </nav>

            {lowStockCount > 0 && activeTab === 'inventory' && (
                <div className="stock-warning-banner">
                    <span className="warning-icon">⚠️</span>
                    <div className="warning-message">
                        <strong>Atenção:</strong> Existem {lowStockCount} produtos abaixo do stock mínimo. Reponha o stock para evitar faltas.
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="loading">Sincronizando dados...</div>
            ) : (
                <div className="content-container">
                    {activeTab === 'inventory' ? (
                        <div className="table-responsive">
                            <table className="mgmt-table">
                                <thead>
                                    <tr>
                                        <th>Produto</th>
                                        <th>Marca/Fornecedor</th>
                                        <th>Stock Actual</th>
                                        <th>Capacidade</th>
                                        <th>Preço Venda</th>
                                        <th>Status</th>
                                        <th>Acções</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="product-cell">
                                                    <strong>{item.name}</strong>
                                                    <span>{item.volume}{item.unit} • {item.barcode || 'Sem código'}</span>
                                                    <span className="category-tag-small">{item.category}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="info-cell">
                                                    <span>{item.brand?.name || '---'}</span>
                                                    <small>{item.supplier?.name || 'N/A'}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`stock-cell ${item.stockQuantity != null && item.stockQuantity <= (item.minStock || 5) ? 'low' : ''}`}>
                                                    <strong>{item.stockQuantity}</strong>
                                                    <span>Mín: {item.minStock}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="progress-bar-container">
                                                    <div className="progress-bar" style={{ width: `${Math.min(((item.stockQuantity || 0) / (item.maxStock || 100)) * 100, 100)}%` }}></div>
                                                    <small>{item.maxStock || 100}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="price-info-cell">
                                                    <strong>MT {item.price.toFixed(2)}</strong>
                                                    <small>Custo: MT {item.costPrice?.toFixed(2)}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`}>
                                                    {item.isAvailable ? 'Venda On' : 'Venda Off'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="move-btn primary-action" title="Reposição" onClick={() => handleOpenMovementModal(item)}>
                                                        📦 Repor
                                                    </button>
                                                    <button className="edit-btn" title="Editar" onClick={() => handleOpenModal(item)}>✏️</button>
                                                    <button className="delete-btn" title="Eliminar" onClick={() => handleDelete(item.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : activeTab === 'history' ? (
                        <div className="table-responsive">
                            <table className="mgmt-table history">
                                <thead>
                                    <tr>
                                        <th>Data/Hora</th>
                                        <th>Produto</th>
                                        <th>Tipo</th>
                                        <th>Qtd</th>
                                        <th>Motivo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.map(m => (
                                        <tr key={m.id}>
                                            <td>{new Date(m.createdAt).toLocaleString()}</td>
                                            <td>{m.menuItem.name} <small>({m.menuItem.brand?.name})</small></td>
                                            <td>
                                                <span className={`type-badge ${m.type.toLowerCase()}`}>
                                                    {m.type === 'ENTRY' ? 'ENTRADA' : m.type === 'EXIT_SALE' ? 'VENDA' : m.type === 'LOSS' ? 'PERDA' : 'AJUSTE'}
                                                </span>
                                            </td>
                                            <td className={m.quantity > 0 ? 'text-success' : 'text-danger'}>
                                                <strong>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</strong>
                                            </td>
                                            <td>
                                                <div className="reason-cell">
                                                    <span>{m.reason}</span>
                                                    {m.supplier && <small className="supplier-tag">De: {m.supplier.name}</small>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="catalog-mgmt">
                            <div className="catalog-sub-tabs">
                                <button className={catalogSubTab === 'brands' ? 'active' : ''} onClick={() => setCatalogSubTab('brands')}>🏷️ Marcas</button>
                                <button className={catalogSubTab === 'suppliers' ? 'active' : ''} onClick={() => setCatalogSubTab('suppliers')}>🚚 Fornecedores</button>
                            </div>

                            <div className="catalog-content">
                                {catalogSubTab === 'brands' ? (
                                    <form onSubmit={handleQuickAddCatalog} className="quick-add-form">
                                        <input
                                            type="text"
                                            placeholder="Nome da nova marca"
                                            value={newItemName}
                                            onChange={e => setNewItemName(e.target.value)}
                                            required
                                        />
                                        <button type="submit">Adicionar Marca</button>
                                    </form>
                                ) : (
                                    <div className="catalog-actions">
                                        <button className="add-btn" onClick={() => setIsSupplierModalOpen(true)}>
                                            ➕ Registar Novo Fornecedor
                                        </button>
                                    </div>
                                )}

                                <div className="catalog-list">
                                    {catalogSubTab === 'brands' ? (
                                        brands.map(b => (
                                            <div key={b.id} className="catalog-item">
                                                <span>{b.name}</span>
                                                <button onClick={() => deleteBrand(b.id)}>🗑️</button>
                                            </div>
                                        ))
                                    ) : (
                                        suppliers.map(s => (
                                            <div key={s.id} className="catalog-item supplier-item">
                                                <div className="s-info">
                                                    <div className="s-header">
                                                        <strong>{s.name}</strong>
                                                        {s.nuit && <span className="nuit-tag">NUIT: {s.nuit}</span>}
                                                    </div>
                                                    <div className="s-details">
                                                        {s.phone && <span>📞 {s.phone}</span>}
                                                    </div>
                                                </div>
                                                <div className="s-actions">
                                                    <button onClick={() => deleteSupplier(s.id)}>🗑️</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Novo Fornecedor */}
            {isSupplierModalOpen && (
                <div className="modal-overlay" onClick={() => setIsSupplierModalOpen(false)}>
                    <div className="modal-content bms-modal" onClick={e => e.stopPropagation()}>
                        <h2>🚚 Novo Cadastro de Fornecedor</h2>
                        <form onSubmit={handleSupplierSubmit}>
                            <div className="bms-form-grid">
                                <div className="form-group">
                                    <label>Nome *</label>
                                    <input value={supplierFormData.name} onChange={e => setSupplierFormData({ ...supplierFormData, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>NUIT</label>
                                    <input value={supplierFormData.nuit} onChange={e => setSupplierFormData({ ...supplierFormData, nuit: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Telefone</label>
                                    <input value={supplierFormData.phone} onChange={e => setSupplierFormData({ ...supplierFormData, phone: e.target.value })} />
                                </div>
                                <div className="form-group full-width">
                                    <label>Endereço</label>
                                    <input value={supplierFormData.address} onChange={e => setSupplierFormData({ ...supplierFormData, address: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="cancel-btn">Cancelar</button>
                                <button type="submit" className="submit-btn">Gravar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal CRUD Produto */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content bms-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-container">
                            <h2>{editingItem ? '✏️ Editar Produto' : '✨ Novo Produto'}</h2>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="bms-form-grid">
                                <div className="form-group">
                                    <label>Nome do Produto *</label>
                                    <input name="name" value={formData.name} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Categoria</label>
                                    <select name="category" value={formData.category} onChange={handleInputChange}>
                                        <option value="Geral">Geral</option>
                                        <option value="Bebidas">Bebidas</option>
                                        <option value="Comida">Comida</option>
                                        <option value="Ingredientes">Ingredientes/Insumos</option>
                                        <option value="Limpeza">Limpeza</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Marca</label>
                                    <select name="brandId" value={formData.brandId} onChange={handleInputChange}>
                                        <option value="">-- Seleccionar --</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Fornecedor</label>
                                    <select name="supplierId" value={formData.supplierId} onChange={handleInputChange}>
                                        <option value="">-- Seleccionar --</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Código de Barras</label>
                                    <input name="barcode" value={formData.barcode} onChange={handleInputChange} />
                                </div>
                                <div className="form-group row-fields">
                                    <div>
                                        <label>Peso/Medida</label>
                                        <input name="volume" value={formData.volume} onChange={handleInputChange} placeholder="Ex: 500" />
                                    </div>
                                    <div>
                                        <label>Unidade</label>
                                        <select name="unit" value={formData.unit} onChange={handleInputChange}>
                                            <option value="un">Unid.</option>
                                            <option value="kg">Kg</option>
                                            <option value="g">Gramas</option>
                                            <option value="L">Litros</option>
                                            <option value="ml">ml</option>
                                            <option value="cx">Caixa</option>
                                            <option value="sc">Saco</option>
                                            <option value="lt">Lata</option>
                                            <option value="pc">Pacote</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Custo (MT)</label>
                                    <input name="costPrice" type="number" step="0.01" value={formData.costPrice} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Venda (MT)</label>
                                    <input name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} />
                                </div>
                                <div className="form-group row-fields">
                                    <div>
                                        <label>Min Stock</label>
                                        <input name="minStock" type="number" value={formData.minStock} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label>Max Stock</label>
                                        <input name="maxStock" type="number" value={formData.maxStock} onChange={handleInputChange} />
                                    </div>
                                </div>
                                {!editingItem && (
                                    <div className="form-group">
                                        <label>Stock Inicial</label>
                                        <input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleInputChange} />
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancelar</button>
                                <button type="submit" className="submit-btn" style={{ background: '#2563eb', color: 'white' }}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Movimentação */}
            {isMovementModalOpen && (
                <div className="modal-overlay" onClick={() => setIsMovementModalOpen(false)}>
                    <div className="modal-content movement-modal" onClick={e => e.stopPropagation()}>
                        <h2>📦 Movimentação: {selectedForMovement?.name}</h2>
                        <form onSubmit={handleMovementSubmit}>
                            <div className="form-group">
                                <label>Tipo</label>
                                <select value={movementData.type} onChange={e => setMovementData({ ...movementData, type: e.target.value })}>
                                    <option value="ENTRY">📥 Compra / Entrada</option>
                                    <option value="LOSS">📤 Perda / Quebra</option>
                                    <option value="ADJUSTMENT">🔧 Ajuste</option>
                                </select>
                            </div>

                            {/* ... (mantendo logica simplificada para movimento) ... */}

                            <div className="form-group">
                                <label>Quantidade</label>
                                <input type="number" value={movementData.quantity} onChange={e => setMovementData({ ...movementData, quantity: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Motivo</label>
                                <textarea value={movementData.reason} onChange={e => setMovementData({ ...movementData, reason: e.target.value })} />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsMovementModalOpen(false)} className="cancel-btn">Cancelar</button>
                                <button type="submit" className="submit-btn">Confirmar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Drinks;

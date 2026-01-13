import React, { useState, useEffect } from 'react';
import { MenuItem, Brand, Supplier } from '../types';
import {
    getMenu, createMenuItem, updateMenuItem, deleteMenuItem,
    getStockMovements, createStockMovement,
    getBrands, createBrand, deleteBrand,
    getSuppliers, createSupplier, deleteSupplier
} from '../services/api';
import './Drinks.css';



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

    const [newItemName, setNewItemName] = useState(''); // Para criar marca rápida

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
        category: 'Bebidas',
        volume: '',
        unit: 'ml',
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

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        try {
            setIsLoading(true);

            // Carregar Marcas e Fornecedores (sempre útil)
            const [brandsRes, suppliersRes] = await Promise.all([
                getBrands(),
                getSuppliers()
            ]);
            setBrands(brandsRes.data.data);
            setSuppliers(suppliersRes.data.data);

            if (activeTab === 'inventory') {
                const response = await getMenu({ all: 'true' });
                const drinks = response.data.data.filter((item: MenuItem) => item.category === 'Bebidas');
                setItems(drinks);

                // Calcular alertas
                const low = drinks.filter((d: MenuItem) => d.stockQuantity != null && d.stockQuantity <= (d.minStock || 5));
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
                category: 'Bebidas',
                volume: item.volume || '',
                unit: item.unit || 'ml',
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
                category: 'Bebidas',
                volume: '',
                unit: 'ml',
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
        try {
            if (editingItem) {
                await updateMenuItem(editingItem.id, formData);
            } else {
                await createMenuItem(formData);
            }
            loadData();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar item:', error);
            alert('Erro ao salvar item de bebida.');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Deseja realmente remover esta bebida do sistema? Estoque e histórico serão preservados no banco, mas o item não aparecerá mais.')) {
            try {
                await deleteMenuItem(id);
                loadData();
            } catch (error) {
                console.error('Erro ao remover:', error);
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
            loadData();
            setIsMovementModalOpen(false);
            alert(`✅ Sucesso! Foram registadas ${movementData.quantity} unidades. Verifique o detalhe na aba "Histórico de Movimentos".`);
        } catch (error) {
            console.error('Erro ao registar movimento:', error);
        }
    };

    const handleQuickAddCatalog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName) return;
        try {
            if (catalogSubTab === 'brands') {
                await createBrand({ name: newItemName });
                setNewItemName('');
                loadData();
            } else {
                // Para fornecedores agora abrimos o modal detalhado
                setIsSupplierModalOpen(true);
            }
        } catch (error) {
            console.error('Erro ao adicionar:', error);
        }
    };

    const handleSupplierSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createSupplier(supplierFormData);
            setSupplierFormData({ name: '', nuit: '', email: '', phone: '', address: '', description: '' });
            setIsSupplierModalOpen(false);
            loadData();
        } catch (error: any) {
            console.error('Erro ao criar fornecedor:', error);
            const msg = error.response?.data?.message || 'Erro ao criar fornecedor.';
            alert(msg);
        }
    };

    return (
        <div className="drinks-mgmt-page">
            <header className="drinks-mgmt-header">
                <div>
                    <h1>🍻 Sistema de Gestão de Bebidas</h1>
                    <p>Controlo total de stock, custos e balanços</p>
                </div>
                <div className="header-actions">
                    <button className="add-btn" onClick={() => handleOpenModal()} title="Adicionar um novo produto que ainda não existe no catálogo">
                        ✨ Registar Nova Bebida
                    </button>
                </div>
            </header>

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
                                                    <button className="move-btn primary-action" title="Fazer Reposição / Entrada de Stock" onClick={() => handleOpenMovementModal(item)}>
                                                        📦 Reposição
                                                    </button>
                                                    <button className="edit-btn" title="Editar Ficha Técnica" onClick={() => handleOpenModal(item)}>✏️ Ficha</button>
                                                    <button className="delete-btn" title="Eliminar Produto" onClick={() => handleDelete(item.id)}>🗑️</button>
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
                                        <th>Quantidade</th>
                                        <th>Motivo/Observação</th>
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
                                                {m.purchasePrice && <small className="block-info">PC: MT {m.purchasePrice.toFixed(2)}</small>}
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
                                                        {s.email && <span>📧 {s.email}</span>}
                                                        {s.address && <span>📍 {s.address}</span>}
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

            {/* Modal para Novo Fornecedor */}
            {isSupplierModalOpen && (
                <div className="modal-overlay" onClick={() => setIsSupplierModalOpen(false)}>
                    <div className="modal-content bms-modal" onClick={e => e.stopPropagation()}>
                        <h2>🚚 Novo Cadastro de Fornecedor</h2>
                        <form onSubmit={handleSupplierSubmit}>
                            <div className="bms-form-grid">
                                <div className="form-group">
                                    <label>Razão Social / Nome *</label>
                                    <input
                                        type="text"
                                        value={supplierFormData.name}
                                        onChange={e => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>NUIT (Identificação Fiscal)</label>
                                    <input
                                        type="text"
                                        value={supplierFormData.nuit}
                                        onChange={e => setSupplierFormData({ ...supplierFormData, nuit: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefone de Contacto</label>
                                    <input
                                        type="text"
                                        value={supplierFormData.phone}
                                        onChange={e => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email Comercial</label>
                                    <input
                                        type="email"
                                        value={supplierFormData.email}
                                        onChange={e => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Endereço Físico / Escritório</label>
                                    <input
                                        type="text"
                                        value={supplierFormData.address}
                                        onChange={e => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Observações / Notas</label>
                                    <textarea
                                        value={supplierFormData.description}
                                        onChange={e => setSupplierFormData({ ...supplierFormData, description: e.target.value })}
                                        placeholder="Ex: Fornecedor principal de refrigerantes, paga-se a 30 dias..."
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="cancel-btn">Cancelar</button>
                                <button type="submit" className="submit-btn">Gravar Fornecedor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal CRUD Bebida */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content bms-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-container">
                            <h2>{editingItem ? '✏️ Ficha Técnica: ' + editingItem.name : '✨ Nova Bebida (Cadastro)'}</h2>
                            <p className="modal-subtitle">
                                {editingItem
                                    ? 'Edite as informações base do produto (Preço, Nome, Marca).'
                                    : 'Registe um novo produto no sistema para começar a vender.'}
                            </p>
                            {!editingItem && (
                                <div className="info-alert">
                                    💡 <strong>Dica:</strong> Se já tem este produto e quer apenas registar uma <u>compra ou entrada</u>, use o botão <strong>📦 Reposição</strong> na lista.
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="bms-form-grid">
                                <div className="form-group">
                                    <label>Designação Comercial *</label>
                                    <input name="name" type="text" value={formData.name} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Marca / Fabricante</label>
                                    <select name="brandId" value={formData.brandId} onChange={handleInputChange}>
                                        <option value="">-- Seleccionar Marca --</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Fornecedor Preferencial</label>
                                    <select name="supplierId" value={formData.supplierId} onChange={handleInputChange}>
                                        <option value="">-- Seleccionar Fornecedor --</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Código de Barras / SKU</label>
                                    <input name="barcode" type="text" value={formData.barcode} onChange={handleInputChange} />
                                </div>
                                <div className="form-group row-fields">
                                    <div>
                                        <label title="Capacidade líquida (ex: 330ml, 750ml)">Volume / Tamanho</label>
                                        <input name="volume" type="text" value={formData.volume} onChange={handleInputChange} placeholder="Ex: 330" title="Capacidade da lata/garrafa" />
                                    </div>
                                    <div>
                                        <label>Unid.</label>
                                        <select name="unit" value={formData.unit} onChange={handleInputChange}>
                                            <option value="ml">ml</option>
                                            <option value="cl">cl</option>
                                            <option value="L">Litro</option>
                                            <option value="un">Unid.</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Preço de Custo (MT)</label>
                                    <input name="costPrice" type="number" step="0.01" value={formData.costPrice} onChange={handleInputChange} placeholder="MT 0.00" />
                                </div>
                                <div className="form-group">
                                    <label>Preço de Venda (MT)</label>
                                    <input name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} placeholder="MT 0.00" />
                                </div>
                                <div className="form-group">
                                    <label>Data de Validade (Lote)</label>
                                    <input name="expiryDate" type="date" value={formData.expiryDate} onChange={handleInputChange} />
                                </div>
                                <div className="form-group row-fields">
                                    <div>
                                        <label>🔔 Alerta Stock Mín.</label>
                                        <input name="minStock" type="number" value={formData.minStock} onChange={handleInputChange} />
                                        <small className="field-help">Avisar quando o stock for menos que isto.</small>
                                    </div>
                                    <div>
                                        <label>🚩 Alerta Stock Máx.</label>
                                        <input name="maxStock" type="number" value={formData.maxStock} onChange={handleInputChange} />
                                        <small className="field-help">Não comprar mais se atingir este valor.</small>
                                    </div>
                                </div>
                                {!editingItem && (
                                    <div className="form-group">
                                        <label>📦 Stock de Abertura (Existente Hoje)</label>
                                        <input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleInputChange} placeholder="Quantas unidades tem agora?" />
                                        <small className="field-help">Quantas latas/garrafas estão fisicamente na prateleira neste momento.</small>
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancelar</button>
                                <button type="submit" className="submit-btn">Gravar Ficha</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Movimentação Manual */}
            {isMovementModalOpen && (
                <div className="modal-overlay" onClick={() => setIsMovementModalOpen(false)}>
                    <div className="modal-content movement-modal" onClick={e => e.stopPropagation()}>
                        <h2>📦 Movimentação de Stock: {selectedForMovement?.name}</h2>
                        <form onSubmit={handleMovementSubmit}>
                            <div className="form-group">
                                <label>Tipo de Operação</label>
                                <select
                                    value={movementData.type}
                                    onChange={e => setMovementData({ ...movementData, type: e.target.value })}
                                >
                                    <option value="ENTRY">📥 Compra / Reforço Stock</option>
                                    <option value="LOSS">📤 Perda (Quebra/Validade)</option>
                                    <option value="ADJUSTMENT">🔧 Ajuste de Inventário</option>
                                </select>
                            </div>

                            {movementData.type === 'ENTRY' && (
                                <div className="entry-financials">
                                    <div className="form-group">
                                        <label>Fornecedor desta Compra</label>
                                        <select
                                            value={movementData.supplierId}
                                            onChange={e => setMovementData({ ...movementData, supplierId: e.target.value })}
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Novo Preço de Custo (PC)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={movementData.purchasePrice}
                                                onChange={e => setMovementData({ ...movementData, purchasePrice: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Novo Preço Venda (PV)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={movementData.sellingPrice}
                                                onChange={e => setMovementData({ ...movementData, sellingPrice: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="stock-summary-box">
                                <div className="summary-item">
                                    <small>📦 Stock Atual</small>
                                    <strong>{selectedForMovement?.stockQuantity || 0}</strong>
                                </div>
                                <div className="summary-operator">
                                    {movementData.type === 'ENTRY' ? '+' : '-'}
                                </div>
                                <div className="summary-item">
                                    <small>🔢 A Registar</small>
                                    <strong>{movementData.quantity || 0}</strong>
                                </div>
                                <div className="summary-equals">=</div>
                                <div className="summary-item projected">
                                    <small>🏁 Novo Saldo</small>
                                    <strong>
                                        {movementData.type === 'ENTRY'
                                            ? (selectedForMovement?.stockQuantity || 0) + (parseInt(movementData.quantity) || 0)
                                            : (selectedForMovement?.stockQuantity || 0) - (parseInt(movementData.quantity) || 0)
                                        }
                                    </strong>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>{movementData.type === 'ENTRY' ? '📦 QUANTIDADE QUE COMPROU (Unidades) *' : '📤 Quantidade que vai SAIR *'}</label>
                                <input
                                    type="number"
                                    value={movementData.quantity}
                                    onChange={e => setMovementData({ ...movementData, quantity: e.target.value })}
                                    required
                                    placeholder="Quantas unidades?"
                                />
                                <small className="field-help" style={{ color: '#4f46e5', fontWeight: 'bold', display: 'block', marginTop: '5px' }}>
                                    {movementData.type === 'ENTRY'
                                        ? `Diga-nos quantas latas novas chegaram. O sistema vai somá-las às ${selectedForMovement?.stockQuantity || 0} que já tem.`
                                        : `Diga-nos quantas latas estão a sair. O sistema vai subtraí-las às ${selectedForMovement?.stockQuantity || 0} que já tem.`}
                                </small>
                            </div>
                            <div className="form-group">
                                <label>Motivo / Observação</label>
                                <textarea
                                    value={movementData.reason}
                                    onChange={e => setMovementData({ ...movementData, reason: e.target.value })}
                                    placeholder={movementData.type === 'ENTRY' ? "Ex: Factura nº 123 ou Lote recebido via fornecedor X" : "Ex: Partiu-se uma caixa..."}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsMovementModalOpen(false)} className="cancel-btn">Cancelar</button>
                                <button type="submit" className="submit-btn">Registar Operação</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Drinks;

import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../services/api';
import './Menu.css';

const CATEGORIES = ['Cafés', 'Bebidas', 'Doces', 'Salgados', 'Refeições', 'Outros'];

const Menu: React.FC = () => {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: CATEGORIES[0],
        isAvailable: true,
        stockQuantity: '',
        minStock: '5',
        maxStock: '',
        costPrice: '',
        brand: '',
        supplier: '',
        volume: '',
        unit: 'un',
        barcode: '',
        expiryDate: ''
    });

    useEffect(() => {
        loadMenu();
    }, []);

    const loadMenu = async () => {
        try {
            setIsLoading(true);
            const response = await getMenu({ all: 'true' });
            setItems(response.data.data);
        } catch (error) {
            console.error('Erro ao carregar menu:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (item?: MenuItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                description: item.description || '',
                price: item.price.toString(),
                category: item.category,
                isAvailable: item.isAvailable,
                stockQuantity: item.stockQuantity?.toString() || '',
                minStock: item.minStock?.toString() || '5',
                maxStock: item.maxStock?.toString() || '',
                costPrice: item.costPrice?.toString() || '',
                brand: item.brand?.name || '',
                supplier: item.supplier?.name || '',
                volume: item.volume || '',
                unit: item.unit || 'un',
                barcode: item.barcode || '',
                expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                category: CATEGORIES[0],
                isAvailable: true,
                stockQuantity: '',
                minStock: '5',
                maxStock: '',
                costPrice: '',
                brand: '',
                supplier: '',
                volume: '',
                unit: 'un',
                barcode: '',
                expiryDate: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: val
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateMenuItem(editingItem.id, formData);
            } else {
                await createMenuItem(formData);
            }
            loadMenu();
            setIsModalOpen(false);
        } catch (error: any) {
            console.error('Erro ao salvar item:', error);
            const message = error.response?.data?.message || 'Erro ao salvar item do menu.';
            alert(message);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este item?')) {
            try {
                await deleteMenuItem(id);
                loadMenu();
            } catch (error) {
                console.error('Erro ao excluir item:', error);
                alert('Erro ao excluir item do menu.');
            }
        }
    };

    return (
        <div className="menu-page">
            <header className="menu-header">
                <div>
                    <h1>📖 Gestão do Cardápio</h1>
                    <p>Adicione ou edite os itens disponíveis para venda</p>
                </div>
                <button className="add-btn" onClick={() => handleOpenModal()}>
                    ➕ Novo Item
                </button>
            </header>

            {isLoading ? (
                <div className="loading-state">Carregando cardápio...</div>
            ) : (
                <div className="menu-grid-admin">
                    {items.map(item => (
                        <div key={item.id} className={`menu-admin-card ${!item.isAvailable ? 'unavailable' : ''}`}>
                            <div className="item-details">
                                <span className="item-category-tag">{item.category}</span>
                                <h3>{item.name}</h3>
                                <p>{item.description}</p>
                                <div className="admin-item-meta">
                                    <span className="item-price-tag">MT {item.price.toFixed(2)}</span>
                                    {item.category === 'Bebidas' && item.stockQuantity != null && (
                                        <span className={`item-stock-tag ${item.stockQuantity <= (item.minStock || 5) ? 'low-stock' : ''}`}>
                                            Stock: {item.stockQuantity}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="item-admin-actions">
                                <button className="edit-btn" onClick={() => handleOpenModal(item)}>✏️</button>
                                <button className="delete-btn" onClick={() => handleDelete(item.id)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content menu-modal" onClick={e => e.stopPropagation()}>
                        <h2>{editingItem ? '✏️ Editar Item' : '➕ Novo Item'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome do Item *</label>
                                <input
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <div className="form-group">
                                <label>Categoria *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                >
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Preço (MT) *</label>
                                <input
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            {formData.category === 'Bebidas' && (
                                <>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Preço de Custo (MT)</label>
                                            <input name="costPrice" type="number" value={formData.costPrice} onChange={handleInputChange} placeholder="Ex: 50.00" />
                                        </div>
                                        <div className="form-group">
                                            <label>Marca</label>
                                            <input name="brand" type="text" value={formData.brand} onChange={handleInputChange} placeholder="Ex: Coca-Cola" />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Fornecedor</label>
                                            <input name="supplier" type="text" value={formData.supplier} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Código de Barras</label>
                                            <input name="barcode" type="text" value={formData.barcode} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Volume / Unidade</label>
                                            <div className="input-group">
                                                <input name="volume" type="text" value={formData.volume} onChange={handleInputChange} placeholder="Ex: 330" />
                                                <input name="unit" type="text" value={formData.unit} onChange={handleInputChange} placeholder="ml" style={{ width: '60px' }} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Data de Validade</label>
                                            <input name="expiryDate" type="date" value={formData.expiryDate} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Stock Atual</label>
                                            <input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleInputChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Stock Min / Máx</label>
                                            <div className="input-group">
                                                <input name="minStock" type="number" value={formData.minStock} onChange={handleInputChange} placeholder="Min" />
                                                <input name="maxStock" type="number" value={formData.maxStock} onChange={handleInputChange} placeholder="Máx" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Descreva o prato ou item..."
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        name="isAvailable"
                                        type="checkbox"
                                        checked={formData.isAvailable}
                                        onChange={handleInputChange}
                                    />
                                    Disponível para venda
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-btn">Cancelar</button>
                                <button type="submit" className="submit-btn" disabled={!formData.name || !formData.price}>
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;

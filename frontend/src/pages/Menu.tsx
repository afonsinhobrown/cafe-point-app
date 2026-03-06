import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../services/api';
import './Menu.css';

const CATEGORIES = ['Cafés', 'Bebidas', 'Doces', 'Salgados', 'Refeições', 'Inventário', 'Outros'];
const ITEM_TYPES = [
    { value: 'PRODUCT', label: 'Produto Simples (Venda Direta)' },
    { value: 'DISH', label: 'Prato / Receita (Composto)' },
    { value: 'INGREDIENT', label: 'Ingrediente / Insumo (Não visível no cardápio)' }
];

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
        expiryDate: '',
        itemType: 'PRODUCT',
        recipeIngredients: [] as { ingredientId: number, quantity: string, unit: string }[]
    });

    // Helper: Get available ingredients for dropdown
    const availableIngredients = items.filter(i => i.itemType === 'INGREDIENT' || i.itemType === 'PRODUCT');

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
                expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
                itemType: item.itemType || 'PRODUCT',
                recipeIngredients: item.recipeIngredients ? item.recipeIngredients.map(ri => ({
                    ingredientId: ri.ingredientId,
                    quantity: ri.quantity.toString(),
                    unit: ri.unit || 'un'
                })) : []
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
                expiryDate: '',
                itemType: 'PRODUCT',
                recipeIngredients: []
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

    const handleAddIngredient = () => {
        setFormData(prev => ({
            ...prev,
            recipeIngredients: [...prev.recipeIngredients, { ingredientId: 0, quantity: '1', unit: 'un' }]
        }));
    };

    const handleIngredientChange = (index: number, field: string, value: string) => {
        const newIngredients = [...formData.recipeIngredients];
        (newIngredients[index] as any)[field] = value;
        setFormData(prev => ({ ...prev, recipeIngredients: newIngredients }));
    };

    const handleRemoveIngredient = (index: number) => {
        const newIngredients = formData.recipeIngredients.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, recipeIngredients: newIngredients }));
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
            if (editingItem) {
                await updateMenuItem(editingItem.id, formData);
                showSuccess('✅ Item atualizado com sucesso!');
            } else {
                await createMenuItem(formData);
                showSuccess('✅ Item criado com sucesso!');
            }
            loadMenu();
            setIsModalOpen(false);
        } catch (err: any) {
            console.error('Erro ao salvar item:', err);
            setError(err.response?.data?.message || 'Erro ao salvar item do menu.');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir este item?')) {
            try {
                await deleteMenuItem(id);
                showSuccess('🗑️ Item removido com sucesso!');
                loadMenu();
            } catch (err: any) {
                console.error('Erro ao excluir item:', err);
                setError('Erro ao excluir item do menu.');
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

            {successMessage && <div className="success-message">{successMessage}</div>}
            {error && <div className="error-message">⚠️ {error}</div>}

            {isLoading ? (
                <div className="loading-state">Carregando cardápio...</div>
            ) : (
                <div className="menu-grid-admin">
                    {items.filter(i => i.itemType !== 'INGREDIENT').map(item => (
                        <div key={item.id} className={`menu-admin-card ${!item.isAvailable ? 'unavailable' : ''}`}>
                            <div className="item-details">
                                <span className={`item-category-tag ${item.itemType === 'DISH' ? 'tag-dish' : ''}`}>
                                    {item.itemType === 'DISH' ? '🍽️ Prato' : item.category}
                                </span>
                                <h3>{item.name}</h3>
                                <p>{item.description}</p>
                                <div className="admin-item-meta">
                                    <span className="item-price-tag">MT {item.price.toFixed(2)}</span>
                                    {item.itemType === 'PRODUCT' && item.stockQuantity != null && (
                                        <span className={`item-stock-tag ${item.stockQuantity <= (item.minStock || 5) ? 'low-stock' : ''}`}>
                                            Stock: {item.stockQuantity}
                                        </span>
                                    )}
                                    {item.itemType === 'DISH' && (
                                        <span className="item-stock-tag stock-info">
                                            {item.recipeIngredients?.length || 0} Ingredientes
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

                    {/* Separate Section for Ingredients */}
                    {items.some(i => i.itemType === 'INGREDIENT') && (
                        <div className="ingredients-section" style={{ gridColumn: '1/-1', marginTop: '2rem' }}>
                            <h2>📦 Ingredientes / Insumos (Estoque)</h2>
                            <div className="menu-grid-admin">
                                {items.filter(i => i.itemType === 'INGREDIENT').map(item => (
                                    <div key={item.id} className="menu-admin-card ingredient-card">
                                        <div className="item-details">
                                            <span className="item-category-tag">Ingrediente</span>
                                            <h3>{item.name}</h3>
                                            <div className="admin-item-meta">
                                                <span className={`item-stock-tag ${item.stockQuantity && item.stockQuantity <= (item.minStock || 5) ? 'low-stock' : ''}`}>
                                                    Stock: {item.stockQuantity} {item.unit}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="item-admin-actions">
                                            <button className="edit-btn" onClick={() => handleOpenModal(item)}>✏️</button>
                                            <button className="delete-btn" onClick={() => handleDelete(item.id)}>🗑️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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

                            <div className="form-group">
                                <label>Tipo de Item</label>
                                <select name="itemType" value={formData.itemType} onChange={handleInputChange}>
                                    {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>

                            {formData.itemType === 'DISH' && (
                                <div className="recipe-section">
                                    <h3>🥘 Ficha Técnica (Ingredientes)</h3>
                                    <div className="recipe-items">
                                        {formData.recipeIngredients.map((ri, index) => (
                                            <div key={index} className="recipe-row">
                                                <select
                                                    value={ri.ingredientId}
                                                    onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)}
                                                >
                                                    <option value={0}>Selecione um ingrediente...</option>
                                                    {availableIngredients.map(ing => (
                                                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    placeholder="Qtd"
                                                    value={ri.quantity}
                                                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                                    style={{ width: '80px' }}
                                                />
                                                <span className="unit-label">{ri.unit}</span>
                                                <button type="button" className="remove-btn" onClick={() => handleRemoveIngredient(index)}>❌</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" className="add-ingredient-btn" onClick={handleAddIngredient}>
                                        ➕ Adicionar Ingrediente
                                    </button>
                                </div>
                            )}

                            {(formData.itemType === 'PRODUCT' || formData.itemType === 'INGREDIENT') && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Stock ({formData.unit})</label>
                                        <input name="stockQuantity" type="number" value={formData.stockQuantity} onChange={handleInputChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Min / Máx</label>
                                        <div className="input-group">
                                            <input name="minStock" type="number" value={formData.minStock} onChange={handleInputChange} placeholder="Min" />
                                            <input name="maxStock" type="number" value={formData.maxStock} onChange={handleInputChange} placeholder="Máx" />
                                        </div>
                                    </div>
                                </div>
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
            )
            }
        </div >
    );
};

export default Menu;

import React, { useState } from 'react';
import './ExpenseModal.css';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ExpenseFormData) => void;
}

export interface ExpenseFormData {
    description: string;
    amount: string;
    category: string;
    date: string;
    isPaid: boolean;
    paymentMethod: string;
    notes: string;
}

const EXPENSE_CATEGORIES = [
    { value: 'RENT', label: '🏢 Renda / Aluguel' },
    { value: 'SALARY', label: '👥 Salários' },
    { value: 'UTILITIES', label: '💡 Energia / Água / Internet' },
    { value: 'TAX', label: '📋 Impostos e Taxas' },
    { value: 'MAINTENANCE', label: '🔧 Manutenção' },
    { value: 'MARKETING', label: '📢 Marketing / Publicidade' },
    { value: 'SUPPLIES', label: '🧹 Material de Limpeza' },
    { value: 'INSURANCE', label: '🛡️ Seguros' },
    { value: 'TRANSPORT', label: '🚗 Transporte / Combustível' },
    { value: 'OTHER', label: '📦 Outros' }
];

const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Dinheiro' },
    { value: 'BANK_TRANSFER', label: 'Transferência Bancária' },
    { value: 'MOBILE_MONEY', label: 'M-Pesa / E-Mola' },
    { value: 'CARD', label: 'Cartão' },
    { value: 'CHECK', label: 'Cheque' }
];

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<ExpenseFormData>({
        description: '',
        amount: '',
        category: 'RENT',
        date: new Date().toISOString().split('T')[0],
        isPaid: true,
        paymentMethod: 'CASH',
        notes: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        setFormData({
            description: '',
            amount: '',
            category: 'RENT',
            date: new Date().toISOString().split('T')[0],
            isPaid: true,
            paymentMethod: 'CASH',
            notes: ''
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content expense-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>💸 Registar Nova Despesa</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Descrição da Despesa *</label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Ex: Renda do mês de Janeiro"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Valor (MT) *</label>
                            <input
                                type="number"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Categoria *</label>
                            <select name="category" value={formData.category} onChange={handleChange} required>
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Data da Despesa *</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Forma de Pagamento</label>
                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                                {PAYMENT_METHODS.map(pm => (
                                    <option key={pm.value} value={pm.value}>{pm.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="isPaid"
                                    checked={formData.isPaid}
                                    onChange={handleChange}
                                />
                                <span>Despesa já foi paga</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Observações (Opcional)</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Notas adicionais sobre esta despesa..."
                            rows={3}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">
                            Cancelar
                        </button>
                        <button type="submit" className="submit-btn">
                            💾 Registar Despesa
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;

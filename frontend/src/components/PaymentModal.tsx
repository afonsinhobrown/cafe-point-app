// @ts-nocheck
import React, { useState } from 'react';
import './PaymentModal.css';

interface PaymentModalProps {
    planName: string;
    price: number;
    onConfirm: (phoneNumber: string, method: string) => void;
    onCancel: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ planName, price, onConfirm, onCancel }) => {
    const [method, setMethod] = useState('mpesa');
    const [phone, setPhone] = useState('84');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 9) {
            alert('Número inválido');
            return;
        }
        setProcessing(true);
        // Simulate processing delay
        setTimeout(() => {
            setProcessing(false);
            onConfirm(phone, method);
        }, 2000);
    };

    return (
        <div className="modal-overlay">
            <div className="payment-modal">
                <div className="modal-header">
                    <h3>Checkout Seguro</h3>
                    <button className="close-btn" onClick={onCancel}>&times;</button>
                </div>

                <div className="order-summary">
                    <p>Você está assinando:</p>
                    <div className="plan-summary">
                        <span className="plan-name">{planName}</span>
                        <span className="plan-price">MT {price}/mês</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="method-selection">
                        <label className={method === 'mpesa' ? 'selected' : ''} onClick={() => setMethod('mpesa')}>
                            📱 M-Pesa
                        </label>
                        <label className={method === 'emola' ? 'selected' : ''} onClick={() => setMethod('emola')}>
                            💳 e-Mola
                        </label>
                        <label className={method === 'card' ? 'selected' : ''} onClick={() => setMethod('card')}>
                            💳 Cartão
                        </label>
                    </div>

                    <div className="input-group">
                        <label>Número de Celular ({method === 'mpesa' ? 'Vodacom' : 'Movitel'})</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="84 123 4567"
                            maxLength={9}
                            autoFocus
                        />
                        <small>Você receberá um push no celular para confirmar o PIN.</small>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onCancel} disabled={processing}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-pay" disabled={processing}>
                            {processing ? 'Enviando Pedido...' : `Pagar MT ${price}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;

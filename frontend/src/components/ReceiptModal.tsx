import React from 'react';
import { getRestaurantSettings } from '../services/api';
import PrintReceipt from './PrintReceipt';
import './ReceiptModal.css';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, order }) => {
    const [restaurant, setRestaurant] = React.useState<any>(null);

    React.useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        try {
            const res = await getRestaurantSettings();
            setRestaurant(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen || !order) return null;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=CAFEPONT-ORDER-${order.id}-TOTAL-${order.totalAmount}`;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="receipt-container" onClick={e => e.stopPropagation()}>
                <div className="receipt-header">
                    <h2>☕ CaféPoint</h2>
                    <p>Recibo de Pagamento</p>
                </div>

                <div className="receipt-info">
                    <p><strong>Pedido:</strong> #{order.id}</p>
                    <p><strong>Mesa:</strong> {order.table?.number}</p>
                    <p><strong>Data:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                    <p><strong>Atendente:</strong> {order.user?.name}</p>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-items">
                    {order.orderItems?.map((item: any) => (
                        <div key={item.id} className="receipt-item">
                            <span>{item.quantity}x {item.menuItem?.name}</span>
                            <span>MT {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-total">
                    <span>TOTAL</span>
                    <span>MT {order.totalAmount.toFixed(2)}</span>
                </div>

                <div className="receipt-qr">
                    <p>Valide sua fatura</p>
                    <img src={qrUrl} alt="QR Code" />
                    <span className="qr-code-text">#{order.id}</span>
                </div>

                <div className="receipt-footer">
                    <p>Obrigado pela preferência!</p>
                    <p>Volte sempre ao {restaurant?.name || 'CaféPoint'}</p>
                </div>

                {/* Camada oculta para impressão real (usando o componente padronizado) */}
                {restaurant && (
                    <PrintReceipt
                        order={order}
                        restaurant={restaurant}
                        format={restaurant.receiptPreference || 'THERMAL'}
                    />
                )}

                <div className="receipt-actions no-print">
                    <button className="print-btn" onClick={handlePrint}>🖨️ Imprimir Recibo</button>
                    <button className="close-btn" onClick={onClose}>Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;

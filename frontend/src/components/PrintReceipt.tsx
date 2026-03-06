import React from 'react';
import './PrintReceipt.css';

interface PrintReceiptProps {
    order: any;
    restaurant: any;
    format: 'THERMAL' | 'A4';
}

const PrintReceipt: React.FC<PrintReceiptProps> = ({ order, restaurant, format }) => {
    if (!order || !restaurant) return null;

    const subtotal = order.orderItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const ivaPercent = restaurant.ivaPercent || 17;
    const ivaAmount = (subtotal * ivaPercent) / 100;
    const total = subtotal + ivaAmount;

    return (
        <div className={`print-container ${format === 'THERMAL' ? 'thermal-receipt' : 'a4-invoice'}`} id="printable-receipt">
            <div className="receipt-header">
                {restaurant.logo && (
                    <img src={restaurant.logo} alt="Logo" className="receipt-logo" />
                )}
                <h2>{restaurant.name}</h2>
                <p className="restaurant-details">
                    {restaurant.address && <span>{restaurant.address}<br /></span>}
                    {restaurant.phone && <span>Tel: {restaurant.phone}<br /></span>}
                    {restaurant.email && <span>Email: {restaurant.email}<br /></span>}
                    {restaurant.nuit && <strong>NUIT: {restaurant.nuit}</strong>}
                </p>
            </div>

            <div className="receipt-info">
                <h3>{format === 'A4' ? 'FATURA / RECIBO' : 'TALÃO DE VENDA'}</h3>
                <div className="info-grid">
                    <span>Pedido: #{order.id}</span>
                    <span>Data: {new Date(order.createdAt).toLocaleString()}</span>
                    <span>Mesa: {order.table.number} ({order.table.location?.name || 'Geral'})</span>
                    <span>Garçom: {order.user.name}</span>
                </div>
            </div>

            <table className="receipt-items">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qtd</th>
                        <th>Preço</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.orderItems.map((item: any) => (
                        <tr key={item.id}>
                            <td>{item.menuItem.name}</td>
                            <td>{item.quantity}</td>
                            <td>{item.price.toFixed(2)}</td>
                            <td>{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="receipt-totals">
                <div className="total-row">
                    <span>Subtotal:</span>
                    <span>MT {subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row">
                    <span>IVA ({ivaPercent}%):</span>
                    <span>MT {ivaAmount.toFixed(2)}</span>
                </div>
                <div className="total-row grand-total">
                    <span>TOTAL:</span>
                    <span>MT {total.toFixed(2)}</span>
                </div>
            </div>

            <div className="receipt-footer">
                <p>Obrigado pela preferência!</p>
                <p>Processado por CaféPoint - Local POS</p>
                <div className="footer-line"></div>
            </div>
        </div>
    );
};

export default PrintReceipt;

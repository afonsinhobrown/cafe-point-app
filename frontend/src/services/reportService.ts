import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from './api';
import { addPdfHeader, addPdfFooter } from './pdfUtils';

export const generateFinancialReport = async (startDate: string, endDate: string) => {
    try {
        const [ordersRes, expensesRes] = await Promise.all([
            api.get('/reports/history', { params: { startDate, endDate } }),
            api.get('/expenses', { params: { startDate, endDate } })
        ]);

        const orders = ordersRes.data.data || [];
        const expenses = expensesRes.data.data || [];

        const totalSales = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
        const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        const netProfit = totalSales - totalExpenses;

        const paymentMethods: Record<string, number> = {};
        orders.forEach((o: any) => {
            const method = o.paymentMethod || 'Dinheiro';
            paymentMethods[method] = (paymentMethods[method] || 0) + o.totalAmount;
        });

        const doc = new jsPDF();
        const startY = await addPdfHeader(doc, 'Relatório Financeiro', `${startDate} a ${endDate}`);

        doc.setFillColor(241, 245, 249);
        doc.rect(15, startY, 180, 35, 'F');

        doc.setFontSize(11);
        doc.setTextColor(51, 65, 85);
        doc.text('RESUMO FINANCEIRO', 20, startY + 10);

        doc.setFontSize(10);
        doc.text(`Vendas Brutas:`, 20, startY + 20);
        doc.setFont('helvetica', 'bold');
        doc.text(`MT ${totalSales.toFixed(2)}`, 75, startY + 20, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.text(`Despesas Operacionais:`, 20, startY + 28);
        doc.setTextColor(185, 28, 28);
        doc.text(`- MT ${totalExpenses.toFixed(2)}`, 75, startY + 28, { align: 'right' });

        doc.line(85, startY + 12, 85, startY + 32);

        doc.setTextColor(51, 65, 85);
        doc.text(`Resultado Líquido:`, 95, startY + 24);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(netProfit >= 0 ? 21 : 185, netProfit >= 0 ? 128 : 28, netProfit >= 0 ? 61 : 28);
        doc.setDrawColor(0, 0, 0); // Reset color
        doc.text(`MT ${netProfit.toFixed(2)}`, 180, startY + 24, { align: 'right' });

        autoTable(doc, {
            startY: startY + 45,
            head: [['Forma de Pagamento', 'Valor Total', '% do Total']],
            body: Object.entries(paymentMethods).map(([method, amount]) => [
                method,
                `MT ${amount.toFixed(2)}`,
                `${((amount / (totalSales || 1)) * 100).toFixed(1)}%`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [71, 85, 105] },
            columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } }
        });

        const finalY1 = (doc as any).lastAutoTable.finalY || (startY + 100);
        const tableY = finalY1 + 15;
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text('Extrato de Vendas', 15, tableY);

        autoTable(doc, {
            startY: tableY + 5,
            head: [['Data/Hora', 'Mesa', 'Responsável', 'Valor']],
            body: orders.map((o: any) => [
                new Date(o.createdAt).toLocaleString('pt-PT'),
                `Mesa ${o.table?.number || '?'}`,
                o.user?.name || 'Sis',
                `MT ${o.totalAmount.toFixed(2)}`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] },
            columnStyles: { 3: { halign: 'right' } }
        });

        addPdfFooter(doc);
        doc.save(`Faturamento_${startDate}.pdf`);
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        throw error;
    }
};

export const generateInventoryReport = async () => {
    try {
        const res = await api.get('/menu', { params: { all: 'true' } });
        const items = res.data.data || [];

        const doc = new jsPDF();
        const startY = await addPdfHeader(doc, 'Relatório de Inventário', 'Stock Atual e Valorização');

        const totalValue = items.reduce((sum: number, i: any) => sum + ((i.stockQuantity || 0) * (i.costPrice || 0)), 0);
        const totalItems = items.reduce((sum: number, i: any) => sum + (i.stockQuantity || 0), 0);

        doc.setFontSize(10);
        doc.text(`Valor Total em Stock (Custo): MT ${totalValue.toFixed(2)}`, 15, startY);
        doc.text(`Total de Itens Físicos: ${totalItems}`, 120, startY);

        autoTable(doc, {
            startY: startY + 10,
            head: [['Produto', 'Categoria', 'Stock Atual', 'Custo Unit.', 'Preço Venda', 'Valor Total']],
            body: items.map((i: any) => [
                i.name,
                i.category,
                { content: `${i.stockQuantity || 0} ${i.unit || 'un'}`, styles: { fontStyle: 'bold' } },
                `MT ${(i.costPrice || 0).toFixed(2)}`,
                `MT ${(i.price || 0).toFixed(2)}`,
                `MT ${((i.stockQuantity || 0) * (i.costPrice || 0)).toFixed(2)}`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42] },
            columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } }
        });

        addPdfFooter(doc);
        doc.save(`Inventario_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error('Erro ao gerar PDF de Inventário:', error);
        throw error;
    }
};

export const generateBIReport = async (period: string) => {
    try {
        const res = await api.get('/reports/advanced', { params: { period } });
        const data = res.data.data;
        const doc = new jsPDF();

        let y = await addPdfHeader(doc, 'Business Intelligence', `Relatório Avançado - Período: ${period.toUpperCase()}`);

        doc.setFontSize(14);
        doc.text('1. Performance da Equipe (Garçons)', 15, y);

        autoTable(doc, {
            startY: y + 5,
            head: [['Garçom', 'Total Atendimentos', 'Faturamento Total', 'Ticket Médio']],
            body: Object.entries(data.operational.waiterPerformance || {}).map(([name, s]: any) => [
                name,
                s.count,
                `MT ${s.total.toLocaleString()}`,
                `MT ${(s.total / (s.count || 1)).toFixed(2)}`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
        });

        const finalY2 = (doc as any).lastAutoTable.finalY || (y + 50);
        y = finalY2 + 15;
        doc.text('2. Ranking de Produtos (Top 10)', 15, y);

        autoTable(doc, {
            startY: y + 5,
            head: [['Produto', 'Qtd Vendida', 'Receita Gerada', 'Lucro Bruto Est.']],
            body: (data.products?.topProducts || []).map((p: any) => [
                p.name,
                p.qty,
                `MT ${p.revenue.toLocaleString()}`,
                `MT ${(p.revenue - p.cost).toLocaleString()}`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] }
        });

        doc.addPage();
        y = await addPdfHeader(doc, 'Business Intelligence', 'Análise de Fluxo e Satisfação');

        doc.text('3. Fluxo de Horário (Demanda)', 15, y);
        autoTable(doc, {
            startY: y + 5,
            head: [['Horário', 'Volume de Clientes (Estimado)']],
            body: (data.operational?.hourlyTraffic || []).map((count: number, hour: number) => {
                const label = count > 5 ? 'ALTA' : count > 2 ? 'MÉDIA' : 'BAIXA';
                return [`${hour}:00h`, `${count} pedidos (${label})`];
            }),
            theme: 'grid'
        });

        const finalY3 = (doc as any).lastAutoTable.finalY || (y + 50);
        y = finalY3 + 15;
        doc.text('4. Métricas de Satisfação e Eficiência', 15, y);

        autoTable(doc, {
            startY: y + 5,
            body: [
                ['Net Promoter Score (NPS)', `${(data.satisfaction?.nps || 0).toFixed(1)}%`],
                ['Avaliação Média', `${(data.satisfaction?.avgRating || 0).toFixed(1)} / 5.0 Estrelas`],
                ['Tempo Médio de Preparo', `${(data.operational?.avgPrepTime || 0).toFixed(1)} minutos`],
                ['Taxa de No-Show (Reservas)', `${(((data.reservations?.noShow || 0) / (data.reservations?.total || 1)) * 100).toFixed(1)}%`],
                ['Custos de Manutenção no Período', `MT ${(data.maintenance?.totalCost || 0).toLocaleString()}`]
            ],
            theme: 'plain',
            columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } }
        });

        addPdfFooter(doc);
        doc.save(`BI_Analytics_${period}.pdf`);
    } catch (error) {
        console.error('Erro ao gerar BI Report:', error);
        throw error;
    }
};

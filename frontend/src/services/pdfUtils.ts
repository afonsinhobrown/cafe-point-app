import jsPDF from 'jspdf';
import { api } from './api';

export interface CompanySettings {
    restaurantName: string;
    address?: string;
    phone?: string;
    nuit?: string; // Tax ID
    email?: string;
}

// Função para buscar configurações (cache simples)
let cachedSettings: CompanySettings | null = null;

const getSettings = async (): Promise<CompanySettings> => {
    if (cachedSettings) return cachedSettings;
    try {
        const res = await api.get('/settings');
        // Assumindo que a API retorna isso, adaptar conforme necessário
        // Se não houver endpoint, usaremos dados do user/auth
        const data = res.data.data || {};
        cachedSettings = {
            restaurantName: data.restaurantName || 'Restaurante Sem Nome',
            address: data.address || '',
            phone: data.phone || '',
            nuit: data.taxId || '',
            email: data.email || ''
        };
        return cachedSettings;
    } catch (error) {
        console.warn('Não foi possível carregar configurações, usando padrão.');
        return { restaurantName: 'Restaurante CaféPoint' };
    }
};

export const addPdfHeader = async (doc: jsPDF, title: string, subtitle?: string) => {
    const settings = await getSettings();
    const pageWidth = doc.internal.pageSize.width;

    // 1. Nome da Empresa (Topo Esquerdo ou Centralizado)
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.setFont('helvetica', 'bold');
    doc.text(settings.restaurantName.toUpperCase(), 15, 20);

    // 2. Dados da Empresa (Pequeno, abaixo do nome)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate 500

    let yPos = 26;
    if (settings.address) {
        doc.text(settings.address, 15, yPos);
        yPos += 5;
    }

    let contactLine = '';
    if (settings.phone) contactLine += `Tel: ${settings.phone}  `;
    if (settings.nuit) contactLine += `NUIT: ${settings.nuit}  `;
    if (settings.email) contactLine += `Email: ${settings.email}`;

    if (contactLine) {
        doc.text(contactLine, 15, yPos);
    }

    // 3. Linha divisória
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.5);
    doc.line(15, 35, pageWidth - 15, 35);

    // 4. Título do Relatório (Direita ou Abaixo)
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth - 15, 20, { align: 'right' });

    if (subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(subtitle, pageWidth - 15, 26, { align: 'right' });
    }

    // Timestamp
    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, pageWidth - 15, 32, { align: 'right' });

    return 45; // Retorna Y inicial para conteúdo
};

export const addPdfFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate 400

        // Linha rodapé
        doc.setDrawColor(226, 232, 240);
        doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

        doc.text(`Sistema de Gestão CaféPoint - Página ${i} de ${pageCount}`, 15, pageHeight - 10);
        doc.text('Documento processado por computador', pageWidth - 15, pageHeight - 10, { align: 'right' });
    }
};

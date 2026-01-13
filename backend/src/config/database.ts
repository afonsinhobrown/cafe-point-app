import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const connectDatabase = async (): Promise<void> => {
    try {
        await prisma.$connect();
        console.log('✅ Conectado à base de dados PostgreSQL');
    } catch (error) {
        console.error('❌ Erro ao conectar à base de dados:', error);
        throw error;
    }
};

export default prisma;
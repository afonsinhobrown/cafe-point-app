"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const connectDatabase = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Conectado à base de dados PostgreSQL');
    }
    catch (error) {
        console.error('❌ Erro ao conectar à base de dados:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
exports.default = prisma;

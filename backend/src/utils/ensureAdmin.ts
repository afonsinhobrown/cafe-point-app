import prisma from '../config/database';
import * as bcrypt from 'bcryptjs';

export const ensureSuperAdmin = async () => {
    try {
        console.log('👑 [Auto-Setup] Verificando Usuários de Sistema...');

        const adminHash = await bcrypt.hash('admin123', 10);
        const registerHash = await bcrypt.hash('register', 10);

        // 1. Garantir Super Admin
        const adminExists = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
        if (adminExists) {
            await prisma.user.update({
                where: { id: adminExists.id },
                data: { password: adminHash }
            });
            console.log('✅ [Auto-Setup] Super Admin resetado (admin123)');
        } else {
            await prisma.user.create({
                data: {
                    username: 'superadmin',
                    password: adminHash,
                    name: 'Super Admin',
                    role: 'SUPER_ADMIN'
                } as any
            });
            console.log('✅ [Auto-Setup] Super Admin criado (admin123)');
        }

        // 2. Garantir Usuário de Registro (Staff)
        const registrarUser = await prisma.user.findFirst({
            where: { username: 'register' }
        });

        if (registrarUser) {
            await prisma.user.update({
                where: { id: registrarUser.id },
                data: {
                    password: registerHash,
                    role: 'REGISTRAR', // Forçar cargo correto
                    name: 'Assistente de Registro'
                }
            });
            console.log('✅ [Auto-Setup] Usuário Registrar atualizado (register/register)');
        } else {
            await prisma.user.create({
                data: {
                    username: 'register',
                    password: registerHash,
                    name: 'Assistente de Registro',
                    role: 'REGISTRAR'
                } as any
            });
            console.log('✅ [Auto-Setup] Usuário Registrar criado (register/register)');
        }

    } catch (error) {
        console.error('❌ [Auto-Setup] Falha:', error);
    }
};

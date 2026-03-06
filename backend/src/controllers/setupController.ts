import { Request, Response } from 'express';
import prisma from '../config/database';
import * as bcrypt from 'bcryptjs';

export const setupSuperAdmin = async (req: Request, res: Response) => {
    try {
        const { secret } = req.query;
        if (secret !== 'point-setup-2026') {
            return res.status(401).json({ success: false, message: 'Código de autorização inválido para emergência.' });
        }

        console.log('🔧 Iniciando Setup Super Admin...');
        const passwordHash = await bcrypt.hash('admin123', 10);
        const exists = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

        if (exists) {
            console.log('👤 Super Admin encontrado (ID:', exists.id, '). Atualizando senha...');
            await prisma.user.update({
                where: { id: exists.id },
                data: { password: passwordHash }
            });
            console.log('✅ Senha atualizada!');
            return res.json({ success: true, message: 'Super Admin atualizado com senha: admin123' });
        }

        console.log('👤 Criando novo Super Admin...');
        await prisma.user.create({
            data: {
                username: 'superadmin',
                password: passwordHash,
                name: 'Super Admin',
                role: 'SUPER_ADMIN'
            } as any
        });
        console.log('✅ Super Admin Criado!');
        res.json({ success: true, message: 'Super Admin criado: superadmin / admin123' });
    } catch (error) {
        console.error('❌ Erro no Setup:', error);
        res.status(500).json({ success: false, error: 'Erro: ' + error });
    }
};

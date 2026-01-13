import prisma from './src/config/database';
import bcrypt from 'bcryptjs';

const createTrialUser = async () => {
    try {
        const existing = await prisma.user.findUnique({ where: { username: 'trial' } });

        if (existing) {
            console.log('Usuário Trial já existe.');
            return;
        }

        const hashedPassword = await bcrypt.hash('trial123', 10);

        await prisma.user.create({
            data: {
                username: 'trial',
                password: hashedPassword,
                name: 'Usuário Trial',
                role: 'ADMIN' // Trial precisa ser Admin para ver tudo e testar limites
            }
        });

        console.log('Usuário Trial criado com sucesso.');
    } catch (error) {
        console.error('Erro ao criar trial user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTrialUser();

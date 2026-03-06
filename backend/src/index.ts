import app from './app';
import { connectDatabase } from './config/database';
import { ensureSuperAdmin } from './utils/ensureAdmin';
import { verifyLicense } from './utils/licenseManager';

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('Stack:', error.stack);
});

const PORT = Number(process.env.PORT) || 5000;

console.log('🚀 Starting CafePoint Application...');
console.log(`📊 Environment: ${process.env.NODE_ENV}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);

// 🛡️ VERIFICAÇÃO DE LICENÇA (AUTORIDADE MÁXIMA)
const license = verifyLicense();

if (!license.valid) {
    console.error('\n' + '!'.repeat(60));
    console.error('🛑 ERRO CRÍTICO: LICENÇA NÃO ENCONTRADA OU INVÁLIDA');
    console.error(`Motivo: ${license.error}`);
    console.error(`ID de Hardware: ${license.machineId}`);
    console.error('O sistema entrará em MODO DE BLOQUEIO TOTAL.');
    console.error('!'.repeat(60) + '\n');

    // Em modo de bloqueio, iniciamos o servidor apenas para servir a página de erro
    // Não conectamos à base de dados nem executamos scripts de setup
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`⚠️ Servidor rodando APENAS em modo de bloqueio na porta ${PORT}`);
    });
} else {
    // 🚀 INICIALIZAÇÃO NORMAL (Licença Válida)
    console.log(`✅ Licença validada para: ${license.data?.restaurantName}`);

    connectDatabase()
        .then(async () => {
            console.log('✅ Database connected successfully');
            await ensureSuperAdmin(); // 👑 Garante Admin ao iniciar
            console.log('✅ Admin user ensured');
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`🚀 Servidor CaféPoint rodando na porta ${PORT}`);
                console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
                console.log(`🌐 Server ready to accept connections`);
            });
        })
        .catch((error) => {
            console.error('❌ Erro crítico ao iniciar servidor:');
            console.error('Error details:', error);
            console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
            process.exit(1);
        });
}
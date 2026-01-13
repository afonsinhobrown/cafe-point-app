import app from './app';
import { connectDatabase } from './config/database';

const PORT = process.env.PORT || 5000;

// Conectar à base de dados e iniciar servidor
connectDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Servidor CaféPoint rodando na porta ${PORT}`);
            console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
        });
    })
    .catch((error) => {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    });
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://admin:ENe3Q8W4XK1h2VVsmPJ8aU8IFTlNXxaU@dpg-d6lghavafjfc73f9iog0-a.frankfurt-postgres.render.com/cafepoint_69g8',
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        await client.connect();
        console.log('✅ Conectado à base de dados de produção');
        
        // Verificar que tabelas existem
        const tablesRes = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log('\n📋 TABELAS EM PRODUÇÃO:');
        console.log(tablesRes.rows);
        
        await client.end();
    } catch (e) {
        console.error('❌ ERRO:', e.message);
        process.exit(1);
    }
})();

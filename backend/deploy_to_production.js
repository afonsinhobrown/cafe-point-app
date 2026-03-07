const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    connectionString: 'postgresql://admin:ENe3Q8W4XK1h2VVsmPJ8aU8IFTlNXxaU@dpg-d6lghavafjfc73f9iog0-a.frankfurt-postgres.render.com/cafepoint_69g8',
    ssl: { rejectUnauthorized: false }
});

(async () => {
    try {
        await client.connect();
        console.log('✅ Conectado à BD de produção');

        // Ler o schema.prisma e converter em SQL
        const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        console.log('\n⚠️ Executando migrations em produção...');
        
        // Executar migrations pendentes
        const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
        const migrations = fs.readdirSync(migrationsDir)
            .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory())
            .sort();

        for (const migration of migrations) {
            const sqlPath = path.join(migrationsDir, migration, 'migration.sql');
            if (fs.existsSync(sqlPath)) {
                const sql = fs.readFileSync(sqlPath, 'utf-8');
                try {
                    await client.query(sql);
                    console.log(`✅ Executada migration: ${migration}`);
                } catch (e) {
                    console.log(`⚠️ Migration ${migration}: ${e.message}`);
                }
            }
        }

        console.log('\n✅ Migrations concluídas');
        await client.end();
    } catch (e) {
        console.error('❌ ERRO:', e.message);
        process.exit(1);
    }
})();

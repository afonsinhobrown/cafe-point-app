/**
 * 🌍 LOCAL vs CLOUD DETECTION SYSTEM
 * 
 * O CaféPoint detecta automaticamente onde está sendo executado
 * através de 2 variáveis de ambiente críticas
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║           LOCAL vs CLOUD - DETECÇÃO AUTOMÁTICA                ║
╚════════════════════════════════════════════════════════════════╝

📍 LÓGICA DE DETECÇÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    ✅ CLOUD MODE (Render, Railway, Heroku, etc.)
} else {
    💻 LOCAL MODE (seu computador)
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 LOCAL (seu computador - Windows)
════════════════════════════════════

process.env.NODE_ENV    = 'development' (padrão npm start)
process.env.DATABASE_URL = undefined ou SQLite

Comportamento:
  ✓ Licença = arquivo (.license.key) + Hardware ID  
  ✓ Verificação rigorosa de Machine ID
  ✓ Se trocar hardware → Sistema bloqueia ❌
  ✓ Planos salvos no banco local
  ✓ Múltiplos restaurantes possíveis

Exemplo de LOG ao iniciar:
  📊 Environment: development
  💾 Database: Not configured (SQLite local)
  🔐 License: verificando arquivo...


🟢 CLOUD (Render, Railway, Heroku)
═══════════════════════════════════

process.env.NODE_ENV    = 'production'
process.env.DATABASE_URL = 'postgresql://...'

Comportamento:
  ✓ Licença = BYPASSED (sempre válida)
  ✓ daysRemaining = 365 (automático)
  ✓ Machine ID = 'CLOUD_DEPLOYMENT'
  ✓ Hardware ID não é verificado
  ✓ Múltiplos restaurantes/usuários podem acessar
  ✓ SaaS mode (vários clientes)

Exemplo de LOG ao iniciar:
  📊 Environment: production
  💾 Database: Connected
  🌐 Running in cloud mode - license check bypassed


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 COMPARAÇÃO DETALHADA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Aspecto                   LOCAL                    CLOUD
─────────────────────────────────────────────────────────────
Aplicação                Desktop Windows          Servidor Online
Database                 PostgreSQL Local         PostgreSQL Cloud
Arquivo Licença          Sim (obrigatório)        Não (ignorado)
Validação Hardware ID    SIM (rigorosa)           NÃO (bypassed)
Dias license             Real (do arquivo)        365 (sempre)
Troca de Hardware        ❌ Bloqueia              ✅ Funciona
Múltiplos Restaurantes   ✅ Sim (no BD)           ✅ Sim (SaaS)
Reinicializações         ✅ LOCAL                 ✅ Auto (deploy)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 COMO CONFIGURAR:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LOCAL (desenvolvimento - .env):
─────────────────────────────
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost/cafepoint
JWT_SECRET=seu-secret-local

OU se usar SQLite:
NODE_ENV=development
DATABASE_URL=file:./dev.db

⚠️ IMPORTANTE: Arquivo .license.key OBRIGATÓRIO!


CLOUD (Render/Railway - environment variables):
──────────────────────────────────────
NODE_ENV=production
DATABASE_URL=postgresql://external-cloud-db
JWT_SECRET=seu-secret-seguro

✅ Licença automática (não precisa arquivo)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 FLUXO DE INICIALIZAÇÃO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backend inicia (index.ts)
         ↓
  Lê process.env
         ↓
  NODE_ENV = ? && DATABASE_URL = ?
    ↓                  ↓
  (dev)    &    (undefined)    → LOCAL MODE 💻
    ↓                  ↓
  (prod)   &    (postgresql://)  → CLOUD MODE 🌐
    ↓
verifyLicense() é chamado
    ↓
if (prod && DATABASE_URL) {
    ✅ CLOUD: retorna license válida (365 dias)
} else {
    💻 LOCAL: verifica arquivo + hardware ID
}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CASOS DE USO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ DESENVOLVIMENTO LOCAL (seu PC atual):
   NODE_ENV=development
   DATABASE_URL=postgresql://localhost
   License: arquivo .license.key necessário
   Funciona: Sim (temos arquivo gerado)

2️⃣ DEPLOY EM CLOUD (Render/Railway):
   NODE_ENV=production  ← Variável do serviço
   DATABASE_URL=cloud-db  ← Env var configurada
   License: automaticamente válida
   Funciona: Sim (SaaS)

3️⃣ NOVO PC/LAPTOP (mesmo projeto):
   NODE_ENV=development
   DATABASE_URL=postgresql://localhost
   License: arquivo .license.key NÃO funciona
   ❌ Erro: "Hardware ID não corresponde"
   Solução: Executar gerar_licenca_agora.js novamente


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️ VERIFICAR AMBIENTE ATUAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execute no terminal:
  echo %NODE_ENV%        → mostra environment
  echo %DATABASE_URL%    → mostra conexão DB

Se não estiver setado:
  set NODE_ENV=development
  set DATABASE_URL=postgresql://localhost/cafepoint


════════════════════════════════════════════════════════════════
`);

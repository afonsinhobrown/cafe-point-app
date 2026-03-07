/**
 * 🔐 TIPOS DE LICENÇA - CLOUD vs LOCAL
 * 
 * O sistema usa TWO COMPLETELY DIFFERENT license verification methods:
 */

console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║               🔐 DOIS TIPOS DE LICENÇA NO CAFÉPOINT                      ║
╚══════════════════════════════════════════════════════════════════════════╝


═══════════════════════════════════════════════════════════════════════════
🟢 TIPO 1: CLOUD LICENSE (Render, Railway, Heroku)
═══════════════════════════════════════════════════════════════════════════

Quando: process.env.NODE_ENV === 'production' && DATABASE_URL existe

Verificação:
  if (NODE_ENV === 'production' && DATABASE_URL) {
      console.log('🌐 Running in cloud mode - license check BYPASSED')
      
      return {
          valid: true,                    ← ✅ SEMPRE VERDADEIRO
          daysRemaining: 365,             ← SEMPRE 365 DIAS
          machineId: 'CLOUD_DEPLOYMENT',  ← Genérico, não único
          restaurantName: 'CafePoint Cloud'
      }
  }

Características:
  ✓ NÃO verifica arquivo de licença
  ✓ NÃO compara Hardware ID
  ✓ NÃO calcula checksum
  ✓ NÃO valida data de expiração
  ✓ Retorna AUTOMATICAMENTE como válida
  ✓ daysRemaining SEMPRE = 365

Lógica simples:
  "Se é cloud (prod + DATABASE_URL), confie que está tudo bem"

Por quê?
  • Na cloud, múltiplos usuários/restaurantes
  • Hardware muda automaticamente (containers, servidores)
  • SaaS mode → Licença gerenciada no backend
  • Renovação automática via planos/assinatura


═══════════════════════════════════════════════════════════════════════════
💻 TIPO 2: LOCAL LICENSE (seu PC Windows)
═══════════════════════════════════════════════════════════════════════════

Quando: NODE_ENV !== 'production' OU DATABASE_URL não existe

Verificação RIGOROSA (7 PASSOS):

PASSO 0: Anti-Clock Rollback
  ├─ Checa se relógio foi manipulado
  ├─ Verifica arquivo de trace (.system_trace)
  └─ Se data voltou no tempo → ❌ BLOQUEIA

PASSO 1: LER ARQUIVO DE LICENÇA
  ├─ Procura em 3 locais:
  │  1. ./cafe-point-license.dat (raiz projeto)
  │  2. %APPDATA%/CafePoint/license.key
  │  3. %PROGRAMDATA%/CafePoint/license.key
  ├─ Se não encontrar = ❌ BLOQUEIA ("Licença não encontrada")
  ├─ Se encontrar, decodifica Base64
  └─ Extrai dados JSON

PASSO 2: VALIDAR CHECKSUM
  ├─ Calcula checksum esperado:
  │  SHA256(machineId|expiryDate|restaurantName)
  ├─ Compara com checksum no arquivo
  └─ Se não bater = ❌ BLOQUEIA ("Licença adulterada")

PASSO 3: GARANTIR CONSISTÊNCIA
  ├─ Se arquivo existe em múltiplos locais
  ├─ Verifica se TODOS têm conteúdo idêntico
  └─ Se diferentes = ❌ BLOQUEIA ("Inconsistência detectada")

PASSO 4: COMPARAR HARDWARE ID
  ├─ Obtém Hardware ID atual:
  │  • CPU Serial (wmic cpu get processorid)
  │  • Motherboard Serial (wmic baseboard get serialnumber)
  │  • Hash SHA256 → 16 caracteres
  ├─ Compara com machineId no arquivo
  └─ Se não bater = ❌ BLOQUEIA ("Hardware ID não corresponde")

PASSO 5: VERIFICAR EXPIRAÇÃO
  ├─ Obtém expiryDate do arquivo
  ├─ Compara com data atual
  └─ Se expirado = ❌ BLOQUEIA ("Licença expirada em X")

PASSO 6: CALCULAR DIAS RESTANTES
  ├─ daysRemaining = (expiryDate - NOW) / 24h
  ├─ Se positivo = ✅ VALIDA
  └─ Se negativo = ❌ REJEITADA


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 COMPARAÇÃO LADO A LADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Aspecto                         CLOUD 🟢                LOCAL 💻
─────────────────────────────────────────────────────────────────────
AMBIENTE                        production              development
Arquivo de licença              ❌ Ignorado             ✅ Obrigatório
Leitura de arquivo              NÃO                     SIM
Checksum validation             NÃO                     SIM
Anti-tampering checks           NÃO                     SIM
Hardware ID verification        NÃO                     SIM
Clock rollback detection        NÃO                     SIM
Data expiry check               NÃO                     SIM
Relógio do sistema              Ignorado                Crítico
Days remaining                  365 (fixo)              Calculado real
Machine ID verificado           NÃO                     SIM (rigoroso)
Consegue trocar hardware?       ✅ Sim                  ❌ Não
Se falhar                       Nunca falha             Bloqueia tudo
Logs ao validar                 "🌐 cloud mode check    "🔐 verificando
                                 bypassed"               arquivo..."


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 EXEMPLO PRÁTICO - CLOUD:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Você faz deploy em Render:

  Backend inicia
        ↓
  process.env.NODE_ENV = 'production'
  process.env.DATABASE_URL = 'postgres://render-db.com'
        ↓
  verifyLicense() é chamado
        ↓
  if (NODE_ENV === 'production' && DATABASE_URL) {
      console.log('🌐 Running in cloud mode - license check bypassed')
      return { valid: true, daysRemaining: 365 }  ← ✅ PRONTO!
  }
        ↓
  ✅ Sistema liberado para TODOS os usuários
  ✅ Sem verificar nada
  ✅ SaaS funciona perfeitamente


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 EXEMPLO PRÁTICO - LOCAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Você inicia no seu PC:

  Backend inicia
        ↓
  process.env.NODE_ENV = undefined (local)
  process.env.DATABASE_URL = undefined
        ↓
  verifyLicense() é chamado
        ↓
  if (NODE_ENV === 'production' && DATABASE_URL) {
      false → PULA esse bloco
  }
        ↓
  PASSO 0: Checar anti-clock-rollback ✓ PASSA
  PASSO 1: Ler arquivo café-point-license.dat
      ✓ Encontrado em ./
      ✓ Decodificado Base64
      ✓ JSON extraído
        ↓
  PASSO 2: Validar checksum
      Checksum arquivo: 30BD24D75F10E05B9
      Checksum calculado: 30BD24D75F10E05B9
      ✓ BATE!
        ↓
  PASSO 3: Consistência (3 locais)
      ✓ Arquivo encontrado em 2 locais
      ✓ Conteúdo idêntico
  
  PASSO 4: Comparar Hardware ID
      Hardware ID arquivo: 6E2746C104B6224314C60F76C5047C2B
      Hardware ID atual:   6E2746C104B6224314C60F76C5047C2B
      ✓ BATE!
        ↓
  PASSO 5: Verificar expiração
      Expiry: 2027-03-07
      Hoje:   2026-03-07
      ✓ NÃO EXPIROU
        ↓
  PASSO 6: Calcular dias
      (2027-03-07 - 2026-03-07) = 365 dias
      ✓ daysRemaining = 365
        ↓
  return { valid: true, daysRemaining: 365, machineId: '6E27...' }
        ↓
  ✅ Sistema liberado
  ✅ Dashboard mostra: "🔑 Licença: 365 dias restantes"


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ CENÁRIO DE ERRO - LOCAL (trocar hardware):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Você move projeto para novo PC:

  Backend inicia
        ↓
  PASSO 0-3: OK ✓
        ↓
  PASSO 4: Comparar Hardware ID
      Hardware ID arquivo: 6E2746C104B6224314C60F76C5047C2B
      Hardware ID novo PC: A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6
      ❌ NÃO BATE!
        ↓
  return {
      valid: false,
      error: 'Hardware ID não corresponde.',
      machineId: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6'
  }
        ↓
  ❌ Sistema bloqueado
  ❌ Tela: "Sistema Bloqueado - Licença não encontrada para este restaurante"
  
  Solução:
    node gerar_licenca_agora.js
    ↓ Regenera arquivo com novo Hardware ID
    ↓ Sistema desbloqueado


═══════════════════════════════════════════════════════════════════════════

🔑 RESUMO - 3 PONTOS CRÍTICOS:
═══════════════════════════════════════════════════════════════════════════

1️⃣ CLOUD LICENSE
   ├─ Simples: "Se está em production + DATABASE_URL, ok"
   ├─ Rápido: 1 comparação vs 7 passos
   ├─ Seguro: Não precisa verificar (banco controla)
   └─ Resultado: ✅ SEMPRE VÁLIDO

2️⃣ LOCAL LICENSE
   ├─ Rigoroso: 7 validações sequenciais
   ├─ Anti-fraude: Checksum + Hardware locking
   ├─ Seguro: Arquivo tampering detectado
   └─ Resultado: ✅ VÁLIDO apenas se TUDO passa

3️⃣ DIFERENÇA CHAVE
   ├─ CLOUD: Confia no DATABASE_URL
   ├─ LOCAL: Confia no arquivo + hardware único
   └─ Resultado: Segurança apropriada para cada modelo


═══════════════════════════════════════════════════════════════════════════
`);

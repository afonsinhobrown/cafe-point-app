# ☕ CaféPoint - Manual de Inicialização e Operação

Este documento contém todas as instruções necessárias para configurar, iniciar e operar o sistema CaféPoint.

## 1. Pré-requisitos
Certifique-se de ter instalado:
- **Node.js** (v18 ou superior)
- **PostgreSQL** (Rodando na porta 5432)
- **Git**

## 2. Instalação do Projeto
Ao baixar o projeto pela primeira vez, execute:

```bash
# Na pasta raiz
npm install

# Instalar dependências do Frontend
cd frontend
npm install

# Instalar dependências do Backend
cd ../backend
npm install
```

## 3. Configuração do Banco de Dados
Certifique-se de que o arquivo `.env` na pasta `backend` está configurado corretamente com a URL do seu banco de dados local.

```bash
# Na pasta backend
npx prisma migrate dev --name init
npx prisma generate
```

### Criar Usuário de Demonstração (Trial)
Para criar o usuário limitado de testes:
```bash
# Na pasta backend
npx tsx create_trial_user.ts
```
*Credenciais: `trial` / `trial123`*

## 4. Como Iniciar o Sistema

### Opção A: Início Rápido (Recomendado)
Para demonstrações e uso local rápido, utilize o script automático na raiz do projeto:

c# Na pasta raiz
./INICIAR_SISTEMA.bat

### Opção B: Desenvolvimento (Manual)
Se precisar trabalhar no código:

1. **Terminal 1 (Backend):**
   ```bash
   cd backend
   npm run dev
   ```
   *Roda em: http://localhost:5000*

2. **Terminal 2 (Frontend - Apenas se editar UI):**
   ```bash
   cd frontend
   npm run dev
   ```
   *Roda em: http://localhost:5173*

## 5. Deploy e Atualização (Versão Monolito)
Para atualizar a versão que roda no `INICIAR_SISTEMA.bat` (que serve os arquivos estáticos), você precisa "construir" o frontend.

Execute o script PowerShell na raiz:
```powershell
./deploy_monolith.ps1
```
Este script:
1. Faz o build do Frontend (Vite).
2. Copia os arquivos para `backend/public`.
3. Deixa o sistema pronto para rodar apenas com o Backend.

## 6. Funcionalidades Chave
- **Login:**
  - Admin: `admin` / `admin123` (Acesso total)
  - Trial: `trial` / `trial123` (Limitado a 10 registros por categoria)
- **Financeiro:** Relatórios corregidos para mostrar Faturação Realizada (Paga) e Pendente (Servida).
- **Mobile:** Acesso via URL pública: `https://cafepoint-final.serveousercontent.com` (Pode demorar alguns segundos para ativar).

## 7. Solução de Problemas Comuns
- **Erro 502 (Bad Gateway) na URL Mobile:**
  - Isso significa que o túnel (Serveo) ainda não conseguiu conectar com o seu computador.
  - **Solução:** Aguarde 30 segundos e recarregue a página. Se persistir, feche todas as janelas pretas e rode o `INICIAR_SISTEMA.bat` novamente.
- **Erro 500 no Financeiro:** Verifique se o `getBillingStats` está consultando status válidos (PAID, SERVED).
- **Tela Branca no Mobile:** Certifique-se de usar a URL pública (https) e não localhost.
- **Login falha no Mobile:** O sistema possui fallback automático para método GET caso a rede bloqueie POST.

---
**CaféPoint 2026**

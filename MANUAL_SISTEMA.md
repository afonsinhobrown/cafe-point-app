# Documentação Técnica e Manual do Sistema - Café Point SaaS

## 1. Visão Geral

O **Café Point SaaS** é uma plataforma multi-tenant (SaaS) completa para gestão de restaurantes, cafés e bares. O sistema permite que múltiplos restaurantes se cadastrem, gerenciem seus próprios dados de forma isolada e operem seus negócios com eficiência.

### 1.1 Principais Módulos

*   **Painel Administrativo (Global)**: Para o dono da plataforma gerir todos os restaurantes inscritos.
*   **Gestão de Mesas**: Mapa de mesas, status em tempo real (Livre, Ocupada, Pendente).
*   **Fluxo de Pedidos**: Criação de pedidos, envio para Cozinha (Comidas) e Bar (Bebidas) separadamente.
*   **Cardápio e Stock**: Gestão de produtos, controle de estoque (Bebidas e Insumos) e alertas de baixo nível.
*   **Financeiro**: Relatórios de faturamento diário, mensal e histórico de vendas.
*   **Assinaturas**: Gestão de planos e limites (TRIAL, BASIC, PRO).
*   **Offline-First**: O sistema funciona offline usando banco de dados local (IndexedDB) e sincroniza quando a internet volta.

---

## 2. Acesso ao Sistema

O sistema é web-based e acessível via navegador.

*   **URL Local**: `http://localhost:3000`
*   **URL Pública (Túnel)**: `https://cafepoint-final.serveo.net` (quando o túnel está ativo)

### 2.1 Tipos de Usuário

| Tipo | Descrição | Acesso | Credenciais Padrão |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Dono da Plataforma SaaS. Vê tudo. | `/admin`, `/dashboard`, `/login` | `superadmin` / `admin123` |
| **Admin Restaurante** | Dono do Restaurante. Gere seu negócio. | `/dashboard`, `/reports`, `/subscription` | `admin` / `admin123` (Matriz) |
| **Garçom** | Funcionário. Tira pedidos. | `/tables`, `/orders` | (Criado pelo Admin) |

### 2.2 Como Criar uma Nova Conta (Cliente)

1.  Acesse `http://localhost:3000/register` (link "Criar Conta" na tela de login).
2.  Preencha nome do restaurante, dados do dono e senha.
3.  O sistema cria automaticamente um ambiente isolado em modo **TRIAL** (30 dias grátis).

---

## 3. Guia de Funcionalidades (Workflow)

### 3.1 Configuração Inicial (Cardápio)
1.  Vá em **Cardápio**.
2.  Adicione itens.
    *   **Comidas**: Vão para a tela da Cozinha.
    *   **Bebidas**: Vão para a tela do Bar. Exigem controle de stock.
    *   **Inventário**: Itens internos (ex: Farinha). Não aparecem para venda na Mesa.

### 3.2 Operação Diária (Atendimento)
1.  **Abrir Mesa**: Vá em **Mesas** e clique em "Criar Pedido" numa mesa livre.
2.  **Lançar Itens**: Selecione os produtos.
3.  **Envio**: Ao confirmar, o sistema separa automaticamente:
    *   Comidas -> Aparecem em **Cozinha** (`/kitchen`).
    *   Bebidas -> Aparecem em **Bar** (`/bar`).
4.  **Preparação**: Cozinheiro/Barman clica em "Preparar" -> "Pronto".
5.  **Entrega**: Garçom entrega e marca como "Entregue".
6.  **Pagamento**: Na mesa ou no caixa, finalize o pedido clicando em "Pagar".

### 3.3 Gestão e Relatórios
*   **Faturação**: Vá em **Faturação** para ver quanto vendeu hoje.
*   **Stock**: O Dashboard avisa se algum item está com stock baixo.
*   **Assinatura**: Vá em **Assinatura** para ver seus limites (mesas, usuários) e fazer upgrade de plano.

---

## 4. Modo Offline (PWA)

O sistema é um **PWA (Progressive Web App)**.
*   **Instalação**: No Chrome/Edge, clique no ícone de "Instalar" na barra de endereço para ter um ícone na área de trabalho.
*   **Sem Internet**: Pode continuar lançando pedidos. Eles ficam numa fila interna e são enviados assim que a conexão voltar (Ícone de "Online" monitora isso).

---

## 5. Comandos Técnicos e Manutenção

Para desenvolvedores ou suporte técnico. Os terminais devem ser mantidos abertos para o sistema rodar.

### 5.1 Iniciar Tudo (Recomendado)
Execute o script único que sobe Backend, Frontend e Túnel:
```bash
.\INICIAR_SISTEMA.bat
```

### 5.2 Comandos Manuais (Em terminais separados)

**Terminal 1 (Backend - API):**
```bash
cd backend
npm run dev
```
*Roda na porta 5000.*

**Terminal 2 (Frontend - Interface):**
```bash
cd frontend
npm run dev
```
*Roda na porta 3000.*

**Terminal 3 (Túnel Público - Opcional):**
```bash
ssh -R cafepoint-final:80:localhost:3000 serveo.net
```
*Gera URL pública.*

### 5.3 Resetar Banco de Dados
Se precisar apagar tudo e recomeçar do zero:
```bash
cd backend
npx prisma migrate reset
```
*(Isso apaga todos os dados e recria o Admin padrão)*

---

## 6. Suporte

Para problemas técnicos, verifique:
1.  Se o **Node.js** está rodando nos terminais.
2.  Se o **PostgreSQL** está ativo.
3.  Se não há antivírus bloqueando a porta 3000 ou 5000.

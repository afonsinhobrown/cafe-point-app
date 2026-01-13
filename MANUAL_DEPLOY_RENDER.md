# 🚀 Guia de Deploy no Render (Passo a Passo)

Siga estes passos para colocar o sistema online para que qualquer pessoa possa testar sem depender do seu computador.

## 1. Preparar e Enviar Código (GitHub)
Primeiro, garantimos que todo o código (incluindo as configurações novas) está no GitHub.

1. Abra um terminal na pasta do projeto.
2. Execute os comandos abaixo para salvar e enviar tudo:
   ```bash
   git add .
   git commit -m "Configuração final para Render e Trial User"
   git push origin main
   ```
   *(Se usar o script `push-to-github.bat` automático, verifique se ele enviou recentemente).*

## 2. Criar Conta no Render
1. Acesse **[dashboard.render.com](https://dashboard.render.com/)**.
2. Faça login (pode usar sua conta GitHub, é o mais fácil).

## 3. Criar o Projeto (Blueprint)
O render vai ler o arquivo `render.yaml` que criamos e configurar tudo sozinho (Banco de dados + Site).

1. No painel principal, clique no botão **"New +"** (Canto superior direito).
2. Selecione **"Blueprint"**.
3. Na lista "Connect a repository", encontre o seu repositório `cafe-point-app` (ou o nome que você deu).
   - *Se não aparecer:* Clique em "Connect account" ou "Configure GitHub" para dar permissão ao Render de ver seus repos.
4. Clique em **"Connect"**.

## 4. Confirmar e Aplicar
1. O Render vai mostrar uma prévia do que vai criar:
   - `cafepoint-db` (O Banco de Dados)
   - `cafepoint-monolith` (O Site)
2. Role até o final da página.
3. Clique no botão azul **"Apply Blueprint"**.

## 5. Aguardar o Build
O Render vai começar a trabalhar. Isso leva uns **5 a 8 minutos** na primeira vez.
- Ele vai criar o banco.
- Vai baixar o código.
- Vai executar nosso script `build_render.sh` (Construir Frontend, construir Backend).
- Vai iniciar o sistema.

**Como saber se acabou?**
- No painel do serviço `cafepoint-monolith`, você verá "Deploy status: **Live**" (em verde).

## 6. Acessar
1. No painel do `cafepoint-monolith`, logo abaixo do nome, haverá um link: `https://cafepoint-monolith.onrender.com` (ou parecido).
2. Clique no link.
3. **Login:** Use `trial` / `trial123`.

---
### 💡 Observações Importantes
- **Dados:** O banco de dados no Render começa **ZERADO**. Nosso script automático vai criar o usuário `trial` e `admin` no primeiro início.
- **Limitação:** No plano gratuito ("Free"), o site "dorme" após 15 minutos sem uso. O primeiro acesso pode demorar uns 50 segundos para "acordar".

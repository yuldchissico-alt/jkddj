# Guia de Deploy no Render — LomusTrack / LogPose

Este guia detalha o passo a passo para colocar o **LomusTrack / LogPose** em produção no **Render** ([render.com](https://render.com)) com suporte a container Docker completo (frontend integrado + backend FastAPI + PostgreSQL).

---

## 🚀 Opção 1: Deploy Automático via Blueprint (`render.yaml`) — Recomendado

O projeto já inclui um arquivo `render.yaml` pré-configurado. Com o Blueprint do Render, toda a infraestrutura (Serviço Web + Banco PostgreSQL + Health Checks) é criada automaticamente.

### Passo a Passo:

1. **Suba o código para o GitHub ou GitLab**:
   - Crie um repositório (público ou privado) e faça push do projeto.
2. **Acesse o Render**:
   - Entre no painel do [Render](https://dashboard.render.com).
3. **Criar via Blueprint**:
   - Clique no botão **New +** no canto superior direito.
   - Selecione **Blueprint**.
   - Conecte sua conta do GitHub/GitLab e selecione o repositório do LomusTrack.
4. **Revisar Recursos**:
   - O Render lerá o arquivo `render.yaml` e mostrará os recursos a serem criados:
     - **Web Service:** `lomustrack` (Docker)
     - **Database:** `lomustrack-db` (PostgreSQL)
   - Clique em **Apply**.
5. **Aguardar o Build e Deploy**:
   - O Render construirá a imagem Docker (compilando o frontend React e preparando o backend Python).
   - Assim que o status mudar para **Live**, seu app estará funcionando na URL fornecida pelo Render (ex: `https://lomustrack.onrender.com`).

---

## 🛠️ Opção 2: Deploy Manual como Web Service (Docker)

Se preferir criar o Web Service manualmente ou se já utiliza um banco de dados externo (ex: **Supabase** ou **Neon**):

### 1. Criar o Web Service:
1. No painel do Render, clique em **New +** > **Web Service**.
2. Escolha **Build and deploy from a Git repository**.
3. Selecione o repositório.
4. Preencha as configurações:
   - **Name:** `lomustrack` (ou o nome que desejar)
   - **Region:** Escolha a região mais próxima dos seus usuários (ex: `Frankfurt` ou `Oregon`)
   - **Language / Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile` (ou `./logpose-main/Dockerfile` se o código estiver numa subpasta)
   - **Docker Build Context Directory:** `.` (ou `./logpose-main`)
   - **Instance Type:** `Free` ou `Starter` (recomendado para produção contínua)

### 2. Configurar o Health Check:
- Em **Advanced Settings**:
  - **Health Check Path:** `/health`

### 3. Configurar as Variáveis de Ambiente (Environment Variables):
Na aba **Environment** do Web Service, adicione:

| Chave | Descrição / Valor de Exemplo |
|---|---|
| `DATABASE_URL` | URL de conexão do PostgreSQL (Render, Supabase ou Neon) |
| `SECRET_KEY` | Chave secreta aleatória (ex: gere 32 caracteres seguros) |
| `META_GRAPH_API_VERSION` | `v25.0` (padrão) |
| `PORT` | `10000` (o Render já define automaticamente se omitido) |

> 💡 **Nota sobre o Supabase**: Se você já usa o Supabase (como no arquivo `.env` de desenvolvimento), basta colar a sua connection string do Supabase na variável `DATABASE_URL`. O backend converte automaticamente prefixos `postgres://` para `postgresql://`.

---

## 🗄️ Opção 3: Criando Banco PostgreSQL Manualmente no Render

Caso não use o Blueprint e queira um banco no próprio Render:
1. No Render, clique em **New +** > **PostgreSQL**.
2. Preencha:
   - **Name:** `lomustrack-db`
   - **Database:** `logpose`
   - **User:** `postgres`
   - **Region:** Mesma região do seu Web Service.
3. Clique em **Create Database**.
4. Após criado, copie o valor do campo **Internal Database URL** (se o Web Service estiver na mesma região) ou **External Database URL**.
5. Cole esse valor na variável de ambiente `DATABASE_URL` do seu Web Service.

---

## 🌐 Configurando Domínio Personalizado e SSL Grátis

1. No painel do seu Web Service no Render, vá na aba **Settings**.
2. Role até a seção **Custom Domains** e clique em **Add Custom Domain**.
3. Digite o seu domínio ou subdomínio (ex: `app.seudominio.com`).
4. O Render fornecerá as entradas DNS necessárias (geralmente um registro `CNAME` apontando para o endereço `.onrender.com`).
5. Configure o CNAME no seu provedor de DNS (Cloudflare, Registro.br, GoDaddy, etc.).
6. O Render gerará e renovará o certificado SSL (HTTPS) automaticamente via Let's Encrypt.

---

## 🔍 Verificação e Testes

- **Health Check:** Acesse `https://seu-app.onrender.com/health`. O retorno deve ser:
  ```json
  {"status": "healthy"}
  ```
- **Interface Web:** Acesse `https://seu-app.onrender.com`. A tela inicial do LomusTrack será carregada.
- **Primeiro Acesso:** Caso seja a primeira inicialização com um banco novo, acesse `/setup` para criar o usuário administrador principal.

---

## ❓ Perguntas Frequentes & Solução de Problemas

### 1. O build do Docker falha com erro de memória no plano Free do Render?
O build do frontend React e a instalação das dependências Python são otimizados em multi-stage. No entanto, se o limite de 512MB do plano Free for atingido durante o build do Docker no Render, você pode utilizar o plano **Starter** do Render durante o deploy inicial.

### 2. Erro de conexão com banco de dados (`NoSuchModuleError: postgres`)?
O backend já inclui o tratamento automático para converter `postgres://` (padrão antigo do Heroku/Render) para `postgresql://` (exigido pelo SQLAlchemy).

### 3. Como reiniciar ou atualizar o projeto?
Qualquer `git push` na branch principal dispara um novo deploy automático no Render (Zero Downtime). Você também pode clicar em **Manual Deploy** > **Deploy latest commit** a qualquer momento.

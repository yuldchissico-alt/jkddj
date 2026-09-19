<div align="center">
  <!-- Substitua pelo link da imagem do banner/logo do App -->
  <img src="/frontend/public/logo_lomustrack.png" alt="Banner do LomusTrack" width="200" />

  <h1>LomusTrack</h1>
  <p>O dashboard definitivo para CEOs de Direct Response. Navegue pelos seus dados de tráfego e vendas com precisão total.</p>

  <p>
    <a href="#instalação-em-1-clique-recomendado"><b>Deploy Automático</b></a> •
    <a href="#tutorial-de-instalação"><b>Vídeo Tutorial</b></a> •
    <a href="#instalação-manual-avançado"><b>Instalação Manual</b></a> •
    <a href="#licença"><b>Licença</b></a>
  </p>
</div>

---

## Sobre o Projeto

**LomusTrack** é uma solução Open Source focada em entregar máxima clareza financeira para operações de Direct Response. 

Em poucos segundos, um CEO consegue visualizar a saúde financeira da operação através de uma interface desenhada para destacar os KPIs essenciais de forma clara, objetiva e com uma UI/UX de alto padrão.

### Principais Recursos
- **Dashboard Executivo & Funil de Vendas:** Visão panorâmica e em tempo real dos seus KPIs mais importantes (Lucro Líquido, ROAS, ROI, CPA) interligados ao acompanhamento ponta a ponta do funil.
- **Criação em Massa no Facebook Ads:** Ganhe velocidade absurda na sua esteira de tráfego. Configure templates e suba 100 campanhas com 100 conjuntos de anúncios em questão de segundos.
- **Inteligência Artificial (Google Gemini):** A IA nativa analisa seus dados, identifica padrões de compra, sugere otimizações e envia relatórios diários automáticos detalhando a saúde da operação.
- **Acompanhamento de Recuperação de Carrinho:** Módulo dedicado para monitorar leads que abandonaram compras, facilitando as ações ativas de recuperação e aumentando o faturamento.
- **Tracking Transparente (Webhooks & Vendas):** Controle centralizado de transações. Receba eventos em tempo real (PayT, Kiwify, Stripe) e unifique a jornada de compra e assinaturas sem perder rastreio.
- **Gestão Avançada de Operação:** Controle unificado de clientes, mapeamento e aliases de produtos, acompanhamento de assinaturas, rastreio de reembolsos e integração com VTurb.

---

## Instalação em 1 Clique (Recomendado)

A maneira mais rápida e segura de colocar o **Log Pose** no ar. Essa opção configura automaticamente seu banco de dados, gera os certificados de segurança (SSL) e roteia o seu domínio personalizado em poucos segundos, colocando o app em ambiente de produção sem dor de cabeça.

[➡️ Clique aqui para instalar em 1 clique na Ilumin](https://ilumin.app/?src=logpose)

[![Deploy to Ilumin](https://cdn.ilumin.app/static/banner-git.webp)](https://ilumin.app/?src=logpose)

---

## 🚀 Deploy no Render (render.com)

O projeto está 100% pronto para rodar no **Render** via Blueprint (`render.yaml`) ou Docker Web Service.

- **Guia Completo:** Consulte [RENDER_DEPLOY.md](RENDER_DEPLOY.md) para instruções detalhadas.
- **Deploy via Blueprint:** No painel do Render, clique em **New +** > **Blueprint** e conecte o repositório. O Render configurará automaticamente o container Docker (Frontend + Backend) e o banco de dados PostgreSQL.
- **Health Check Integrado:** O serviço já conta com `/health` configurado para deploys com zero downtime.

---

## Tutorial de Instalação

Preparamos um guia passo a passo em vídeo. Mostramos o aplicativo por dentro e como você pode ter a sua própria estrutura rodando em menos de 5 minutos.

[▶️ Clique aqui para assistir ao tutorial](https://www.youtube.com/watch?v=6vBqKXBLpVc)

[![Assista ao Tutorial](https://img.youtube.com/vi/6vBqKXBLpVc/maxresdefault.jpg)](https://www.youtube.com/watch?v=6vBqKXBLpVc)

---

## Instalação Manual (Avançado)

Se você tem experiência com infraestrutura cloud, gerenciamento de servidores Linux e prefere configurar o ambiente manualmente, utilize os arquivos `docker-compose` fornecidos.

**Pré-requisitos Necessários:**
- Acesso SSH a uma VPS crua (Ubuntu/Debian).
- Docker e Docker Compose instalados no servidor.
- Conhecimento para configurar Proxy Reverso (Nginx, Traefik ou Caddy).
- Geração e renovação de certificados SSL (Let's Encrypt).

<details>
<summary><b>Opção A: docker-compose-ilumin.yml (Pronto para Ilumin Cloud / Traefik)</b></summary>

Se você usa a stack da Ilumin ou Traefik, este arquivo já vem com as labels e redes configuradas corretamente.

```yaml
services:
  app:
    image: ghcr.io/ilumincloud-applications/logpose:${APP_VERSION}
    environment:
      - DATABASE_URL=postgres://logpose_user:${DB_PASSWORD}@db:5432/logpose
      - SECRET_KEY=${SECRET_KEY}
      - META_GRAPH_API_VERSION=${META_GRAPH_API_VERSION}
    networks:
      - traefik
      - internal
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik
      - traefik.http.routers.logpose.rule=Host(`${BASE_DOMAIN}`)${CUSTOM_DOMAIN:+ || Host(`${CUSTOM_DOMAIN}`)}
      - traefik.http.routers.logpose.entrypoints=websecure
      - traefik.http.routers.logpose.tls=true
      - traefik.http.routers.logpose.tls.certresolver=letsencrypt
      - traefik.http.services.logpose.loadbalancer.server.port=8000
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=logpose_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=logpose
    volumes:
      - logpose_db_data:/var/lib/postgresql/data
    networks:
      - internal
    restart: unless-stopped

volumes:
  logpose_db_data:

networks:
  traefik:
    external: true
  internal:
```
</details>

<details>
<summary><b>Opção B: docker-compose.yml (Padrão / Quick Start)</b></summary>

Arquivo docker padrão para você usar atrás do seu próprio proxy reverso (Nginx, Apache, etc).

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/ilumincloud-applications/logpose:latest
    environment:
      - DATABASE_URL=postgres://logpose_user:pass@db:5432/logpose
      - SECRET_KEY=sua_chave_secreta_aqui
      - META_GRAPH_API_VERSION=v25.0
    ports:
      - "8000:8000" # Lembre-se de configurar o proxy reverso para apontar para cá
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=logpose_user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=logpose
    volumes:
      - logpose_db_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  logpose_db_data:
```
</details>

1. Clone este repositório em seu servidor.
2. Edite as variáveis de ambiente com suas credenciais seguras.
3. Configure o bloco de servidor no proxy reverso apontando o seu domínio para a porta exposta.
4. Execute `docker compose up -d`.

---

## Tecnologias Utilizadas

- **Frontend:** React + TailwindCSS + ShadCN UI
- **Backend:** Python
- **Banco de Dados:** PostgreSQL 14
- **Deployment:** Docker

---

## Licença

Este projeto é de código aberto e está licenciado sob a [MIT License](LICENSE.md). É 100% gratuito para uso comercial e pessoal. Você tem total liberdade para usar e modificar.

---

<div align="center">
  <br>
  <p>Made with love by <a href="https://ilumin.app">Ilumin Cloud</a></p>
  <p><a href="https://instagram.com/ilumin.app">@ilumin.app</a></p>
  <p><small>© 2026 Ilumin Cloud. Simplificando a infraestrutura para criadores e empreendedores.</small></p>
</div>

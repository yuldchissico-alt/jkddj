# 🗄️ Como Instalar o Banco de Dados do Log Pose

## Opção 1: Usando Docker (Recomendado - Mais Rápido)

O banco já está rodando via Docker! Basta executar as migrações:

```powershell
# O banco PostgreSQL já está rodando na porta 5433
# Agora execute o script SQL:

docker exec -i logpose-main-db-1 psql -U postgres -d logpose < database_schema.sql
```

## Opção 2: PostgreSQL Local

Se você tem PostgreSQL instalado localmente:

```powershell
# Criar o banco
psql -U postgres -c "CREATE DATABASE logpose;"

# Executar o schema
psql -U postgres -d logpose -f database_schema.sql
```

## Opção 3: Via PgAdmin ou Cliente GUI

1. Abra seu cliente PostgreSQL (PgAdmin, DBeaver, etc.)
2. Conecte em:
   - **Host**: localhost
   - **Porta**: 5433 (se usar Docker) ou 5432 (local)
   - **Usuário**: postgres
   - **Senha**: postgres
   - **Banco**: logpose

3. Abra o arquivo `database_schema.sql`
4. Execute todo o conteúdo

## ✅ Verificar se Funcionou

Execute no PostgreSQL:

```sql
-- Ver todas as tabelas criadas
\dt

-- Ou via SQL:
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Você deve ver todas essas tabelas:
- admins
- campaign_actions
- campaign_markers
- campaign_presets
- campaign_tags
- checkouts
- company_settings
- customer_products
- customers
- facebook_accounts
- gemini_accounts
- order_bumps
- product_aliases
- products
- recoveries
- recovery_channel_configs
- refund_reasons
- stripe_accounts
- transactions
- upsells
- vturb_accounts
- webhook_endpoints

## 🚀 Depois de Criar o Banco

Atualize o arquivo `.env` do backend com a conexão correta:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/logpose
SECRET_KEY=convergeai-secret-key-change-in-production
META_GRAPH_API_VERSION=v25.0
```

Depois inicie o backend:

```powershell
cd backend
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## 📝 Notas Importantes

- O schema já cria um registro inicial em `company_settings`
- Os ENUMs já estão definidos com todos os valores necessários
- Os triggers de `updated_at` são criados automaticamente
- Todas as foreign keys têm CASCADE ou SET NULL configurados

# 🗄️ Como Instalar o Banco no Supabase

## ⚠️ Problema Identificado
Sua máquina está com problema de DNS e não consegue resolver o domínio do Supabase:
```
db.adrpyuedsyeohdhlnecj.supabase.co
```

## ✅ Solução: Execute o SQL direto no Dashboard do Supabase

### Passo 1: Acesse o Supabase Dashboard

1. Vá para: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto
4. No menu lateral, clique em **"SQL Editor"**

### Passo 2: Execute o SQL

1. Clique em **"New query"**
2. Copie TODO o conteúdo do arquivo `database_schema.sql`
3. Cole no editor SQL
4. Clique em **"Run"** (ou pressione `Ctrl+Enter`)

### Passo 3: Verifique se foi criado

Execute este SQL para ver as tabelas criadas:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Você deve ver 23 tabelas!

## 🔧 Corrigir Problema de DNS (Opcional)

### Opção 1: Adicionar no arquivo hosts

1. Abra o Bloco de Notas como Administrador
2. Abra o arquivo: `C:\Windows\System32\drivers\etc\hosts`
3. Adicione esta linha no final:
   ```
   # Supabase
   54.88.74.93 db.adrpyuedsyeohdhlnecj.supabase.co
   ```
4. Salve e feche
5. Tente iniciar o backend novamente

**Nota**: O IP `54.88.74.93` é um exemplo. Você precisadig fazer um `nslookup` ou `ping` do seu domínio Supabase para pegar o IP correto.

### Opção 2: Usar Google DNS

1. Vá em Painel de Controle > Rede e Internet > Central de Rede e Compartilhamento
2. Clique na sua conexão de rede
3. Clique em "Propriedades"
4. Selecione "Protocolo IP Versão 4 (TCP/IPv4)"
5. Clique em "Propriedades"
6. Marque "Usar os seguintes endereços de servidor DNS"
7. DNS preferencial: `8.8.8.8`
8. DNS alternativo: `8.8.4.4`
9. Clique em OK
10. Reinicie a conexão

## 🚀 Depois de Criar o Banco

Tente iniciar o backend novamente:

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File start_backend.ps1
```

Ou use o frontend que já está rodando em:
**http://localhost:5173/**

## 💡 Dica

Se o DNS continuar com problema, você pode usar o Docker local:

```powershell
cd ..
docker compose -f docker-compose-dev.yml up -d
```

E mudar o `.env` para:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/logpose
```

Depois execute o SQL localmente:
```powershell
docker exec -i logpose-main-db-1 psql -U postgres -d logpose < database_schema.sql
```

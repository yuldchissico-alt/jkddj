# 🚀 LomusTrack - Modelo SaaS Multi-Tenant

## 📋 Visão Geral

O LomusTrack agora opera como um **SaaS multi-tenant** onde:

- ✅ **Qualquer pessoa pode criar conta** (self-service signup)
- ✅ **Cada pessoa = 1 empresa isolada** (dados completamente separados)
- ✅ **Você gerencia tudo** via painel super admin
- ✅ **Controle de assinaturas** (ativar/suspender empresas)

---

## 👥 Tipos de Usuário

### 1. **Super Admin** (Você - Dono do App)
- `role = superadmin`
- `company_id = NULL` (não pertence a nenhuma empresa)
- Acessa o painel `/api/superadmin/*`
- **Pode**:
  - Ver todas as empresas cadastradas
  - Ver estatísticas globais do app
  - Suspender/ativar empresas
  - Controlar assinaturas (futuro)
- **Não pode**: Acessar dados de empresas específicas

### 2. **Owner** (Cliente - Dono da Empresa)
- `role = owner`
- `company_id = 1, 2, 3...` (ID único da empresa)
- Acessa o app normal (`/dashboard`, `/sales`, etc)
- Vê apenas dados da própria empresa
- Pode convidar admins/viewers

### 3. **Admin** (Colaborador)
- `role = admin`
- Colaborador da empresa
- Mesmas permissões do owner

### 4. **Viewer** (Visualizador)
- `role = viewer`
- Apenas visualização (sem edição)

---

## 🔐 Fluxo de Cadastro

### Para Clientes (Público):

1. Usuário acessa `/setup`
2. Preenche nome, email, senha
3. Sistema cria automaticamente:
   - Novo `company_id` único
   - Conta com `role = owner`
   - Empresa isolada
4. Login e começa a usar

### Para Colaboradores (Convite):

1. Owner/Admin convida via `/users/invite`
2. Sistema gera token único
3. Convidado acessa `/setup/invite/{token}`
4. Define email/senha
5. Herda `company_id` de quem convidou

---

## 🛠️ Painel Super Admin

### Endpoints Disponíveis:

#### 1. Listar Empresas
```http
GET /api/superadmin/companies
Authorization: Bearer {seu_token_superadmin}
```

**Retorna:**
```json
[
  {
    "company_id": 1,
    "owner_name": "João Silva",
    "owner_email": "joao@exemplo.com",
    "is_active": true,
    "created_at": "2026-09-19T10:00:00",
    "total_users": 3,
    "total_products": 5,
    "total_customers": 120,
    "total_transactions": 450,
    "total_revenue": 125000.00,
    "subscription_expires_at": null
  }
]
```

#### 2. Estatísticas Globais
```http
GET /api/superadmin/stats
Authorization: Bearer {seu_token_superadmin}
```

**Retorna:**
```json
{
  "total_companies": 50,
  "active_companies": 48,
  "suspended_companies": 2,
  "total_users": 150,
  "total_revenue": 5250000.00,
  "total_transactions": 12500,
  "avg_revenue_per_company": 105000.00
}
```

#### 3. Suspender/Ativar Empresa
```http
PATCH /api/superadmin/companies/{company_id}/status
Authorization: Bearer {seu_token_superadmin}
Content-Type: application/json

{
  "is_active": false  // false = suspender, true = ativar
}
```

**Efeito**: Bloqueia login de **todos** usuários da empresa

---

## 📊 Migração SQL

Execute a migração para ativar o modelo SaaS:

```sql
-- Arquivo: backend/database/migrations/2026-09-19-saas-model.sql
mysql -u root -p lomustrack < backend/database/migrations/2026-09-19-saas-model.sql
```

**O que faz:**
- ✅ Adiciona role `superadmin`
- ✅ Adiciona campo `is_active` (controle de suspensão)
- ✅ Adiciona campo `subscription_expires_at` (futuro)
- ✅ Cria super admin inicial:
  - **Email**: `admin@lomustrack.com`
  - **Senha**: `admin123` (⚠️ **TROCAR IMEDIATAMENTE!**)

---

## 🔑 Login Super Admin

### Primeira vez:

1. Execute a migração SQL
2. Faça login com:
   - Email: `admin@lomustrack.com`
   - Senha: `admin123`
3. **IMPORTANTE**: Troque a senha imediatamente via `/api/profile`

### Gerando nova senha (bcrypt):

```python
import bcrypt
password = "sua_nova_senha"
salt = bcrypt.gensalt()
hash = bcrypt.hashpw(password.encode('utf-8'), salt)
print(hash.decode('utf-8'))
```

Atualize no banco:
```sql
UPDATE admins 
SET password_hash = '{hash_gerado}' 
WHERE email = 'admin@lomustrack.com';
```

---

## 💰 Monetização (Futuro)

### Campos já preparados:

- `is_active`: Suspender por falta de pagamento
- `subscription_expires_at`: Data de expiração da assinatura

### Integração com Stripe/PayPal:

1. Cliente assina plano
2. Sistema atualiza `subscription_expires_at`
3. Cronjob verifica expiração diariamente
4. Se expirado: `is_active = 0` (suspende)

### Exemplo de Cronjob:

```python
# Suspender empresas com assinatura expirada
from datetime import datetime
from database.core.connection import get_db
from database.models.admin import Admin

def suspend_expired_companies():
    db = next(get_db())
    now = datetime.utcnow()
    
    expired = db.query(Admin).filter(
        Admin.subscription_expires_at < now,
        Admin.is_active == 1
    ).all()
    
    for admin in expired:
        admin.is_active = 0
    
    db.commit()
    print(f"Suspensas {len(expired)} empresas")
```

---

## 🧪 Testando

### 1. Criar primeira empresa:
```bash
# Frontend
http://localhost:5173/setup

# Dados
Nome: Empresa Teste 1
Email: teste1@exemplo.com
Senha: senha123
```

### 2. Criar segunda empresa:
```bash
# Aba anônima/privativa
http://localhost:5173/setup

# Dados
Nome: Empresa Teste 2
Email: teste2@exemplo.com
Senha: senha123
```

### 3. Verificar isolamento:
- Login como `teste1@exemplo.com` → Vê apenas dados da Empresa 1
- Login como `teste2@exemplo.com` → Vê apenas dados da Empresa 2
- Dados não cruzam!

### 4. Painel Super Admin:
```bash
# Login
POST /api/auth/login
{
  "email": "admin@lomustrack.com",
  "password": "admin123"
}

# Ver empresas
GET /api/superadmin/companies
Authorization: Bearer {token}

# Ver estatísticas
GET /api/superadmin/stats
Authorization: Bearer {token}

# Suspender empresa
PATCH /api/superadmin/companies/1/status
Authorization: Bearer {token}
{
  "is_active": false
}
```

---

## 🚨 Segurança

### ✅ Implementado:

- Isolamento total de dados por `company_id`
- Verificação de conta ativa em cada request
- Super admin separado (não acessa dados de empresas)
- Validação de email único no signup

### ⚠️ Recomendações:

1. **Troque a senha do super admin**
2. **Adicione rate limiting** no endpoint `/setup` (anti-spam)
3. **Adicione confirmação de email** (opcional)
4. **Configure HTTPS** em produção
5. **Backup diário** do banco de dados

---

## 📈 Próximos Passos

### MVP (Mínimo Viável):
- [x] Multi-tenant isolado
- [x] Signup público
- [x] Painel super admin
- [x] Suspender empresas
- [ ] Planos de assinatura
- [ ] Integração Stripe/PayPal
- [ ] Cronjob de expiração
- [ ] Dashboard de receita

### Recursos Futuros:
- [ ] Confirmação de email
- [ ] Rate limiting
- [ ] Métricas de uso por empresa
- [ ] Webhooks de pagamento
- [ ] Multi-idioma
- [ ] White label (personalização)

---

## 🆘 Suporte

Dúvidas? Entre em contato:
- Email: suporte@lomustrack.com
- Documentação completa: [em construção]

---

**LomusTrack** - SaaS de Gestão de Vendas 🚀

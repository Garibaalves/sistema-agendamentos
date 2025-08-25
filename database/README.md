# Configuração do Banco de Dados

## Instruções para configurar o Supabase

### 1. Criar projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Escolha sua organização
5. Defina um nome para o projeto
6. Crie uma senha segura para o banco de dados
7. Escolha a região mais próxima
8. Clique em "Create new project"

### 2. Executar o schema do banco
1. No painel do Supabase, vá para "SQL Editor"
2. Clique em "New query"
3. Copie todo o conteúdo do arquivo `schema.sql`
4. Cole no editor e clique em "Run"
5. Aguarde a execução completar

### 3. Configurar as variáveis de ambiente
1. No painel do Supabase, vá para "Settings" > "API"
2. Copie a "URL" do projeto
3. Copie a "anon public" key
4. Copie a "service_role" key (mantenha em segredo)
5. Atualize o arquivo `.env.local` com essas informações:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 4. Configurar autenticação
1. No painel do Supabase, vá para "Authentication" > "Settings"
2. Em "Site URL", adicione: `http://localhost:3000`
3. Em "Redirect URLs", adicione: `http://localhost:3000/auth/callback`
4. Salve as configurações

### 5. Criar usuário administrador inicial
Após configurar tudo, você pode criar o primeiro usuário administrador através da interface da aplicação ou executando este SQL no Supabase:

```sql
-- Primeiro, registre um usuário através da interface da aplicação
-- Depois, execute este comando para torná-lo admin:
UPDATE public.profiles 
SET user_type = 'admin' 
WHERE email = 'seu_email@exemplo.com';
```

## Estrutura das Tabelas

### profiles
- Estende a tabela `auth.users` do Supabase
- Armazena informações adicionais do usuário
- Campo `user_type` define se é 'admin' ou 'client'

### clients
- Cadastro de clientes do sistema
- Informações de contato e endereço

### services
- Serviços oferecidos
- Duração em minutos e preço
- Campo `active` para ativar/desativar

### appointments
- Agendamentos realizados
- Relaciona cliente, serviço e usuário responsável
- Status do agendamento e observações

## Políticas de Segurança (RLS)

O sistema implementa Row Level Security para garantir que:
- Usuários só acessem seus próprios dados
- Administradores tenham acesso completo
- Clientes só vejam seus próprios agendamentos
- Serviços ativos sejam visíveis para todos
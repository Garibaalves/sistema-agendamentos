# Sistema de Agendamentos

Sistema completo para controle de clientes e agendamentos desenvolvido em Next.js com Supabase.

## 🚀 Funcionalidades

- **Autenticação e Autorização**: Sistema completo com JWT e RLS (Row Level Security)
- **Gestão de Usuários**: Controle de perfis (Admin, Funcionário, Cliente)
- **Agendamentos**: Sistema completo de agendamentos com validação de conflitos
- **Serviços**: Cadastro e gestão de serviços oferecidos
- **Agendas**: Configuração de horários de funcionamento
- **Clientes**: Cadastro e gestão de clientes
- **Financeiro**: Controle de transações financeiras
- **Dashboard**: Visão geral do sistema

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Autenticação**: Supabase Auth com JWT Claims personalizados
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Garibaalves/sistema-agendamentos.git
cd sistema-agendamentos
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Execute o projeto:
```bash
npm run dev
```

## 🗄️ Configuração do Banco de Dados

O projeto inclui scripts SQL para configuração completa do banco:

1. **Políticas RLS**: `POLITICAS_RLS_COMPLETAS_JWT.sql`
2. **JWT Claims**: `CONFIGURAR_JWT_CLAIMS.sql`
3. **Correções**: Vários scripts de correção disponíveis na raiz do projeto

## 🔐 Sistema de Autenticação

O sistema utiliza:
- **Supabase Auth** para autenticação
- **JWT Claims personalizados** para autorização
- **Row Level Security (RLS)** para segurança dos dados
- **Três níveis de usuário**: Admin, Funcionário, Cliente

## 📱 Páginas Disponíveis

- `/login` - Página de login
- `/register` - Cadastro de usuários
- `/dashboard` - Dashboard principal
- `/agendamentos` - Lista de agendamentos
- `/novo-agendamento` - Criar novo agendamento
- `/gestao-agendamentos` - Gestão de agendamentos (Admin/Funcionário)
- `/servicos` - Gestão de serviços
- `/agendas` - Configuração de horários
- `/clientes` - Gestão de clientes
- `/usuarios` - Gestão de usuários (Admin)
- `/financeiro` - Controle financeiro

## 🎯 Funcionalidades Especiais

### Validação de Conflitos de Horários
O sistema verifica automaticamente:
- Sobreposição entre serviços
- Duração de cada serviço
- Horários de início e término
- Conflitos com agendamentos anteriores e posteriores

### Sistema de Permissões
- **Admin**: Acesso total ao sistema
- **Funcionário**: Gestão de agendamentos e clientes
- **Cliente**: Visualização dos próprios agendamentos

## 🚀 Deploy

O projeto está configurado para deploy fácil em plataformas como:
- Vercel
- Netlify
- Railway

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Desenvolvedor

Desenvolvido por [Gariba Alves](https://github.com/Garibaalves)

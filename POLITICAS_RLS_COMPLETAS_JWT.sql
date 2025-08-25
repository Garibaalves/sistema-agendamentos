-- =====================================================
-- POLÍTICAS RLS COMPLETAS COM JWT PERSONALIZADO
-- Versão aprimorada com autenticação obrigatória
-- =====================================================

-- IMPORTANTE: Execute primeiro o script CONFIGURAR_JWT_CLAIMS.sql
-- para criar as funções JWT necessárias

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

DROP POLICY IF EXISTS "appointments_select_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_policy" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_policy" ON public.appointments;

DROP POLICY IF EXISTS "services_select_policy" ON public.services;
DROP POLICY IF EXISTS "services_insert_policy" ON public.services;
DROP POLICY IF EXISTS "services_update_policy" ON public.services;
DROP POLICY IF EXISTS "services_delete_policy" ON public.services;

DROP POLICY IF EXISTS "schedules_select_policy" ON public.schedules;
DROP POLICY IF EXISTS "schedules_insert_policy" ON public.schedules;
DROP POLICY IF EXISTS "schedules_update_policy" ON public.schedules;
DROP POLICY IF EXISTS "schedules_delete_policy" ON public.schedules;

DROP POLICY IF EXISTS "financial_transactions_select_policy" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert_policy" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_policy" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete_policy" ON public.financial_transactions;

-- Remover políticas JWT antigas se existirem
DROP POLICY IF EXISTS "profiles_select_jwt" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_jwt" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_jwt" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_jwt" ON public.profiles;

DROP POLICY IF EXISTS "appointments_select_jwt" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_jwt" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_jwt" ON public.appointments;
DROP POLICY IF EXISTS "appointments_delete_jwt" ON public.appointments;

DROP POLICY IF EXISTS "services_select_jwt" ON public.services;
DROP POLICY IF EXISTS "services_insert_jwt" ON public.services;
DROP POLICY IF EXISTS "services_update_jwt" ON public.services;
DROP POLICY IF EXISTS "services_delete_jwt" ON public.services;

DROP POLICY IF EXISTS "schedules_select_jwt" ON public.schedules;
DROP POLICY IF EXISTS "schedules_insert_jwt" ON public.schedules;
DROP POLICY IF EXISTS "schedules_update_jwt" ON public.schedules;
DROP POLICY IF EXISTS "schedules_delete_jwt" ON public.schedules;

DROP POLICY IF EXISTS "financial_transactions_select_jwt" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert_jwt" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_jwt" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete_jwt" ON public.financial_transactions;

-- 2. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. POLÍTICAS PARA TABELA PROFILES (usando JWT)
-- =====================================================

-- SELECT: Admin vê todos, usuário vê apenas próprio perfil
CREATE POLICY "profiles_select_jwt" ON public.profiles
  FOR SELECT
  USING (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem ver todos os perfis
      public.is_admin_jwt() = true 
      OR
      -- Usuários podem ver apenas seu próprio perfil
      id = auth.uid()
    )
  );

-- INSERT: Usuário pode criar apenas seu próprio perfil
CREATE POLICY "profiles_insert_jwt" ON public.profiles
  FOR INSERT
  WITH CHECK (
    -- Apenas usuários autenticados podem criar seu próprio perfil
    auth.uid() IS NOT NULL
    AND id = auth.uid()
  );

-- UPDATE: Admin pode atualizar todos, usuário apenas próprio perfil
CREATE POLICY "profiles_update_jwt" ON public.profiles
  FOR UPDATE
  USING (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem editar todos os perfis
      public.is_admin_jwt() = true 
      OR
      -- Usuários podem editar apenas seu próprio perfil
      id = auth.uid()
    )
  )
  WITH CHECK (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem editar todos os perfis
      public.is_admin_jwt() = true 
      OR
      -- Usuários podem editar apenas seu próprio perfil
      id = auth.uid()
    )
  );

-- DELETE: Apenas admin pode deletar perfis
CREATE POLICY "profiles_delete_jwt" ON public.profiles
  FOR DELETE
  USING (
    -- Apenas usuários autenticados e admins podem deletar perfis
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- =====================================================
-- 4. POLÍTICAS PARA TABELA APPOINTMENTS (usando JWT)
-- =====================================================

-- SELECT: Admin vê todos, cliente vê apenas seus agendamentos
CREATE POLICY "appointments_select_jwt" ON public.appointments
  FOR SELECT
  USING (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem ver todos os agendamentos
      public.is_admin_jwt() = true 
      OR
      -- Clientes podem ver apenas seus próprios agendamentos
      client_id = auth.uid()
    )
  );

-- INSERT: Admin pode criar qualquer, cliente apenas para si
CREATE POLICY "appointments_insert_jwt" ON public.appointments
  FOR INSERT
  WITH CHECK (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem criar agendamentos para qualquer cliente
      public.is_admin_jwt() = true 
      OR
      -- Clientes podem criar apenas para si mesmos
      client_id = auth.uid()
    )
  );

-- UPDATE: Admin pode editar todos, cliente apenas seus
CREATE POLICY "appointments_update_jwt" ON public.appointments
  FOR UPDATE
  USING (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem editar todos os agendamentos
      public.is_admin_jwt() = true 
      OR
      -- Clientes podem editar apenas seus próprios agendamentos
      client_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem editar todos os agendamentos
      public.is_admin_jwt() = true 
      OR
      -- Clientes podem editar apenas seus próprios agendamentos
      client_id = auth.uid()
    )
  );

-- DELETE: Admin pode deletar todos, cliente apenas seus
CREATE POLICY "appointments_delete_jwt" ON public.appointments
  FOR DELETE
  USING (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem deletar todos os agendamentos
      public.is_admin_jwt() = true 
      OR
      -- Clientes podem deletar apenas seus próprios agendamentos
      client_id = auth.uid()
    )
  );

-- =====================================================
-- 5. POLÍTICAS PARA TABELA SERVICES (usando JWT)
-- =====================================================

-- SELECT: Todos podem ver serviços ativos, admin vê todos
CREATE POLICY "services_select_jwt" ON public.services
  FOR SELECT
  USING (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Serviços ativos são visíveis para todos os usuários autenticados
      is_active = true 
      OR
      -- Admins podem ver todos os serviços (ativos e inativos)
      public.is_admin_jwt() = true
    )
  );

-- INSERT: Apenas admin pode criar serviços
CREATE POLICY "services_insert_jwt" ON public.services
  FOR INSERT
  WITH CHECK (
    -- Apenas usuários autenticados e admins podem criar serviços
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- UPDATE: Apenas admin pode atualizar serviços
CREATE POLICY "services_update_jwt" ON public.services
  FOR UPDATE
  USING (
    -- Apenas usuários autenticados e admins podem editar serviços
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  )
  WITH CHECK (
    -- Apenas usuários autenticados e admins podem editar serviços
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- DELETE: Apenas admin pode deletar serviços
CREATE POLICY "services_delete_jwt" ON public.services
  FOR DELETE
  USING (
    -- Apenas usuários autenticados e admins podem deletar serviços
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- =====================================================
-- 6. POLÍTICAS PARA TABELA SCHEDULES (usando JWT)
-- =====================================================

-- SELECT: Admin vê todos, usuário vê apenas os que criou
CREATE POLICY "schedules_select_jwt" ON public.schedules
  FOR SELECT
  USING (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem ver todos os agendamentos
      public.is_admin_jwt() = true 
      OR
      -- Usuários podem ver apenas os agendamentos que criaram
      created_by = auth.uid()
    )
  );

-- INSERT: Admin pode criar qualquer, usuário apenas para si
CREATE POLICY "schedules_insert_jwt" ON public.schedules
  FOR INSERT
  WITH CHECK (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem criar agendamentos para qualquer usuário
      public.is_admin_jwt() = true 
      OR
      -- Usuários podem criar apenas agendamentos para si mesmos
      created_by = auth.uid()
    )
  );

-- UPDATE: Admin pode editar todos, usuário apenas os que criou
CREATE POLICY "schedules_update_jwt" ON public.schedules
  FOR UPDATE
  USING (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem editar todos os agendamentos
      public.is_admin_jwt() = true 
      OR
      -- Usuários podem editar apenas os agendamentos que criaram
      created_by = auth.uid()
    )
  )
  WITH CHECK (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem editar todos os agendamentos
      public.is_admin_jwt() = true 
      OR
      -- Usuários podem editar apenas os agendamentos que criaram
      created_by = auth.uid()
    )
  );

-- DELETE: Admin pode deletar todos, usuário apenas os que criou
CREATE POLICY "schedules_delete_jwt" ON public.schedules
  FOR DELETE
  USING (
    -- Apenas usuários autenticados
    auth.uid() IS NOT NULL
    AND (
      -- Admins podem deletar todos os agendamentos
      public.is_admin_jwt() = true 
      OR
      -- Usuários podem deletar apenas os agendamentos que criaram
      created_by = auth.uid()
    )
  );

-- =====================================================
-- 7. POLÍTICAS PARA TABELA FINANCIAL_TRANSACTIONS (usando JWT)
-- =====================================================

-- SELECT: Apenas admin pode ver transações financeiras
CREATE POLICY "financial_transactions_select_jwt" ON public.financial_transactions
  FOR SELECT
  USING (
    -- Apenas usuários autenticados e admins podem ver transações financeiras
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- INSERT: Apenas admin pode criar transações financeiras
CREATE POLICY "financial_transactions_insert_jwt" ON public.financial_transactions
  FOR INSERT
  WITH CHECK (
    -- Apenas usuários autenticados e admins podem criar transações financeiras
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- UPDATE: Apenas admin pode atualizar transações financeiras
CREATE POLICY "financial_transactions_update_jwt" ON public.financial_transactions
  FOR UPDATE
  USING (
    -- Apenas usuários autenticados e admins podem editar transações financeiras
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  )
  WITH CHECK (
    -- Apenas usuários autenticados e admins podem editar transações financeiras
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- DELETE: Apenas admin pode deletar transações financeiras
CREATE POLICY "financial_transactions_delete_jwt" ON public.financial_transactions
  FOR DELETE
  USING (
    -- Apenas usuários autenticados e admins podem deletar transações financeiras
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- =====================================================
-- 8. VERIFICAÇÃO DAS POLÍTICAS CRIADAS
-- =====================================================

-- Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'appointments', 'services', 'schedules', 'financial_transactions')
ORDER BY tablename, policyname;

-- =====================================================
-- 9. INSTRUÇÕES DE USO
-- =====================================================

/*
PASSOS PARA IMPLEMENTAÇÃO:

1. Execute primeiro o script CONFIGURAR_JWT_CLAIMS.sql
2. Configure o Custom Access Token Hook no Supabase Dashboard:
   - Vá para Authentication > Hooks
   - Adicione um Custom Access Token Hook
   - URI: pg-functions://postgres/public/custom_access_token_hook
3. Execute este script (POLITICAS_RLS_COMPLETAS_JWT.sql)
4. Teste o login e as funcionalidades

BENEFÍCIOS:
- ✅ Elimina loops infinitos nas políticas RLS
- ✅ Melhor performance (não consulta tabelas durante verificação)
- ✅ Segurança aprimorada com autenticação obrigatória
- ✅ Claims JWT personalizados para verificação de tipo de usuário
- ✅ Políticas consistentes em todas as tabelas

VERIFICAÇÃO:
- Faça logout e login novamente
- Teste todas as páginas da aplicação
- Verifique se não há mais loops infinitos
- Confirme que apenas usuários autenticados têm acesso
*/
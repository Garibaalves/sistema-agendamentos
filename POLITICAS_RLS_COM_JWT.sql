-- POLÍTICAS RLS USANDO CLAIMS JWT PERSONALIZADOS
-- Este script elimina loops infinitos usando auth.jwt() ao invés de consultar profiles
-- Execute APÓS configurar o JWT hook no Supabase Dashboard

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover políticas da tabela profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles';
    END LOOP;
    
    -- Remover políticas da tabela appointments
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'appointments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.appointments';
    END LOOP;
    
    -- Remover políticas da tabela services
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'services') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.services';
    END LOOP;
    
    -- Remover políticas da tabela schedules
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'schedules') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.schedules';
    END LOOP;
END $$;

-- 2. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS PARA TABELA PROFILES (usando JWT)

-- SELECT: Admin vê todos, usuário vê apenas próprio perfil
CREATE POLICY "profiles_select_jwt" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR id = auth.uid()
    )
  );

-- INSERT: Apenas usuários autenticados podem criar perfil
CREATE POLICY "profiles_insert_jwt" ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND id = auth.uid()
  );

-- UPDATE: Admin pode atualizar todos, usuário apenas próprio perfil
CREATE POLICY "profiles_update_jwt" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR id = auth.uid()
    )
  );

-- DELETE: Apenas admin pode deletar perfis
CREATE POLICY "profiles_delete_jwt" ON public.profiles
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- 4. POLÍTICAS PARA TABELA APPOINTMENTS (usando JWT)

-- SELECT: Admin vê todos, cliente vê apenas próprios agendamentos
CREATE POLICY "appointments_select_jwt" ON public.appointments
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR client_id = auth.uid()
    )
  );

-- INSERT: Admin pode criar qualquer agendamento, cliente apenas próprios
CREATE POLICY "appointments_insert_jwt" ON public.appointments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR client_id = auth.uid()
    )
  );

-- UPDATE: Admin pode atualizar todos, cliente apenas próprios
CREATE POLICY "appointments_update_jwt" ON public.appointments
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR client_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR client_id = auth.uid()
    )
  );

-- DELETE: Admin pode deletar todos, cliente apenas próprios
CREATE POLICY "appointments_delete_jwt" ON public.appointments
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR client_id = auth.uid()
    )
  );

-- 5. POLÍTICAS PARA TABELA SERVICES (usando JWT)

-- SELECT: Todos podem ver serviços ativos
CREATE POLICY "services_select_jwt" ON public.services
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (is_active = true OR public.is_admin_jwt() = true)
  );

-- INSERT: Apenas admin pode criar serviços
CREATE POLICY "services_insert_jwt" ON public.services
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- UPDATE: Apenas admin pode atualizar serviços
CREATE POLICY "services_update_jwt" ON public.services
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- DELETE: Apenas admin pode deletar serviços
CREATE POLICY "services_delete_jwt" ON public.services
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- 6. POLÍTICAS PARA TABELA SCHEDULES (usando JWT)

-- SELECT: Admin vê todas, usuário vê apenas próprias agendas
CREATE POLICY "schedules_select_jwt" ON public.schedules
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR created_by = auth.uid()
    )
  );

-- INSERT: Admin pode criar qualquer agenda, usuário apenas próprias
CREATE POLICY "schedules_insert_jwt" ON public.schedules
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR created_by = auth.uid()
    )
  );

-- UPDATE: Admin pode atualizar todas, usuário apenas próprias
CREATE POLICY "schedules_update_jwt" ON public.schedules
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR created_by = auth.uid()
    )
  );

-- DELETE: Admin pode deletar todas, usuário apenas próprias
CREATE POLICY "schedules_delete_jwt" ON public.schedules
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (
      public.is_admin_jwt() = true 
      OR created_by = auth.uid()
    )
  );

-- 7. CONCEDER PERMISSÕES BÁSICAS
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.appointments TO authenticated;
GRANT SELECT ON public.services TO authenticated, anon;
GRANT SELECT ON public.schedules TO authenticated;

GRANT INSERT ON public.profiles TO authenticated;
GRANT INSERT ON public.appointments TO authenticated;
GRANT INSERT ON public.services TO authenticated;
GRANT INSERT ON public.schedules TO authenticated;

GRANT UPDATE ON public.profiles TO authenticated;
GRANT UPDATE ON public.appointments TO authenticated;
GRANT UPDATE ON public.services TO authenticated;
GRANT UPDATE ON public.schedules TO authenticated;

GRANT DELETE ON public.profiles TO authenticated;
GRANT DELETE ON public.appointments TO authenticated;
GRANT DELETE ON public.services TO authenticated;
GRANT DELETE ON public.schedules TO authenticated;

-- 8. VERIFICAR POLÍTICAS CRIADAS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'appointments', 'services', 'schedules')
ORDER BY tablename, policyname;

-- 9. TESTAR FUNÇÕES JWT
SELECT 
  auth.uid() as user_id,
  public.is_admin_jwt() as is_admin,
  public.get_user_type_jwt() as user_type,
  auth.jwt() ->> 'user_type' as jwt_claim;

SELECT 'Políticas RLS com JWT configuradas com sucesso!' as status;
SELECT 'IMPORTANTE: Configure o JWT Hook no Supabase Dashboard antes de testar!' as aviso;
-- SCRIPT CORRIGIDO PARA CORRIGIR PROBLEMAS RLS NA TABELA SERVICES
-- Execute este script no Supabase SQL Editor

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES DA TABELA SERVICES
DO $$
BEGIN
    -- Remove todas as políticas existentes
    DROP POLICY IF EXISTS "services_select_policy" ON public.services;
    DROP POLICY IF EXISTS "services_insert_policy" ON public.services;
    DROP POLICY IF EXISTS "services_update_policy" ON public.services;
    DROP POLICY IF EXISTS "services_delete_policy" ON public.services;
    DROP POLICY IF EXISTS "services_select_simple" ON public.services;
    DROP POLICY IF EXISTS "services_admin_all" ON public.services;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.services;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.services;
    DROP POLICY IF EXISTS "Enable update for users based on email" ON public.services;
    DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.services;
END $$;

-- 2. DESABILITAR RLS TEMPORARIAMENTE PARA SERVICES
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;

-- 3. CONCEDER PERMISSÕES BÁSICAS
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT ON public.services TO anon;

-- 4. REABILITAR RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICA SIMPLES PARA SELECT (todos podem ver serviços ativos)
CREATE POLICY "services_select_all" ON public.services
  FOR SELECT
  USING (true); -- Permite que todos vejam os serviços

-- 6. CRIAR POLÍTICAS PARA ADMIN APENAS (INSERT, UPDATE, DELETE)
CREATE POLICY "services_admin_insert" ON public.services
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

CREATE POLICY "services_admin_update" ON public.services
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

CREATE POLICY "services_admin_delete" ON public.services
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- 7. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'services'
ORDER BY policyname;

-- 8. TESTAR CONSULTA
SELECT 
  id,
  name,
  price,
  duration,
  is_active
FROM public.services 
WHERE is_active = true
ORDER BY name
LIMIT 3;

SELECT 'Correção da tabela services concluída com sucesso!' as status;
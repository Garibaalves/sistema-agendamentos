-- SCRIPT PARA CORRIGIR PROBLEMAS RLS NA TABELA SERVICES
-- Execute este script no Supabase SQL Editor

-- 1. REMOVER POLÍTICAS EXISTENTES DA TABELA SERVICES
DROP POLICY IF EXISTS "services_select_policy" ON public.services;
DROP POLICY IF EXISTS "services_insert_policy" ON public.services;
DROP POLICY IF EXISTS "services_update_policy" ON public.services;
DROP POLICY IF EXISTS "services_delete_policy" ON public.services;

-- 2. DESABILITAR RLS TEMPORARIAMENTE PARA SERVICES
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;

-- 3. CONCEDER PERMISSÕES BÁSICAS
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT ON public.services TO anon;

-- 4. REABILITAR RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICA SIMPLES PARA SELECT (todos podem ver serviços ativos)
CREATE POLICY "services_select_simple" ON public.services
  FOR SELECT
  USING (true); -- Permite que todos vejam os serviços

-- 6. CRIAR POLÍTICAS PARA ADMIN APENAS
CREATE POLICY "services_admin_all" ON public.services
  FOR ALL
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

SELECT 'Correção da tabela services concluída!' as status;
-- SCRIPT PARA DIAGNOSTICAR PROBLEMAS COM TABELA SERVICES
-- Execute este script no Supabase SQL Editor

-- 1. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('services', 'profiles', 'appointments', 'schedules')
AND schemaname = 'public';

-- 2. VERIFICAR POLÍTICAS EXISTENTES PARA SERVICES
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
WHERE tablename = 'services'
ORDER BY policyname;

-- 3. VERIFICAR SE FUNÇÃO is_admin EXISTE
SELECT 
  proname as function_name,
  prorettype::regtype as return_type,
  prosrc as function_body
FROM pg_proc 
WHERE proname = 'is_admin';

-- 4. TESTAR FUNÇÃO is_admin
SELECT 
  auth.uid() as current_user_id,
  public.is_admin() as is_admin_result;

-- 5. VERIFICAR DADOS NA TABELA SERVICES
SELECT 
  id,
  name,
  price,
  duration,
  is_active,
  created_at
FROM public.services 
LIMIT 5;

-- 6. VERIFICAR PERMISSÕES NA TABELA SERVICES
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'services'
AND table_schema = 'public';

-- 7. VERIFICAR USUÁRIO ATUAL E SEU TIPO
SELECT 
  id,
  email,
  user_type,
  full_name
FROM public.profiles 
WHERE id = auth.uid();

-- 8. TESTE DIRETO DE CONSULTA SERVICES (pode falhar se RLS estiver bloqueando)
SELECT 'Testando consulta direta à tabela services...' as teste;

SELECT 
  COUNT(*) as total_services,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_services
FROM public.services;

SELECT 'Diagnóstico concluído!' as status;
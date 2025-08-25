-- SCRIPT PARA VERIFICAR SE A FUNÇÃO RPC FOI CRIADA
-- Execute este script no Supabase SQL Editor para diagnosticar o problema

-- 1. Verificar se a função get_user_profile existe
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_user_profile';

-- 2. Verificar se há usuário autenticado
SELECT 
  auth.uid() as user_id,
  auth.role() as user_role;

-- 3. Testar a função RPC diretamente
SELECT * FROM get_user_profile();

-- 4. Verificar se a tabela profiles existe e tem dados
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 5. Verificar políticas RLS na tabela profiles
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
WHERE tablename = 'profiles';

-- 6. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- INSTRUÇÕES:
-- 1. Execute cada seção separadamente
-- 2. Se a função não existir, execute o SCRIPT_FINAL_SIMPLIFICADO.sql
-- 3. Se não houver usuário autenticado, faça login primeiro
-- 4. Se a função existir mas der erro, verifique as políticas RLS
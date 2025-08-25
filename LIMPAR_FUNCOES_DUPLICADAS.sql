-- SCRIPT PARA LIMPAR FUNÇÕES DUPLICADAS E RECRIAR get_user_profile
-- Execute este script no Supabase SQL Editor

-- 1. Remover TODAS as versões da função get_user_profile
DROP FUNCTION IF EXISTS public.get_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_profile(text) CASCADE;
DROP FUNCTION IF EXISTS get_user_profile() CASCADE;
DROP FUNCTION IF EXISTS get_user_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_profile(text) CASCADE;

-- 2. Aguardar um momento para garantir que as funções foram removidas
-- (Execute este comando separadamente se necessário)

-- 3. Criar a função get_user_profile ÚNICA e CORRETA
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  user_type text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Retornar o perfil do usuário autenticado
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.user_type,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- 4. Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile() TO anon;

-- 5. Verificar se a função foi criada corretamente
SELECT 
  routine_name,
  routine_type,
  specific_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_user_profile'
ORDER BY specific_name;

-- 6. Testar a função (execute apenas se estiver logado)
-- SELECT * FROM public.get_user_profile();

-- INSTRUÇÕES:
-- 1. Execute as seções 1-4 em sequência
-- 2. Verifique se apenas UMA função foi criada na seção 5
-- 3. Teste a função na seção 6 (descomente a linha)
-- 4. Se tudo estiver OK, teste o login na aplicação
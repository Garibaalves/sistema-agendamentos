-- SCRIPT PARA CONFIGURAR CLAIMS JWT PERSONALIZADOS NO SUPABASE
-- Este script resolve o problema de loop infinito nas políticas RLS
-- Execute este script no Supabase SQL Editor

-- 1. CRIAR FUNÇÃO PARA ADICIONAR CLAIMS PERSONALIZADOS AO JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Buscar o user_type do usuário na tabela profiles
  SELECT user_type INTO user_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  -- Se não encontrar o usuário, definir como 'client' por padrão
  IF user_role IS NULL THEN
    user_role := 'client';
  END IF;

  -- Adicionar o claim personalizado
  claims := event->'claims';
  claims := jsonb_set(claims, '{user_type}', to_jsonb(user_role));

  -- Retornar o evento com os claims atualizados
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- 2. CONCEDER PERMISSÕES PARA A FUNÇÃO
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO postgres;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO service_role;

-- 3. CRIAR FUNÇÃO PARA VERIFICAR SE USUÁRIO É ADMIN (usando JWT)
CREATE OR REPLACE FUNCTION public.is_admin_jwt()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o claim user_type no JWT é 'admin'
  RETURN COALESCE(
    (auth.jwt() ->> 'user_type') = 'admin',
    false
  );
END;
$$;

-- 4. CONCEDER PERMISSÕES PARA A FUNÇÃO is_admin_jwt
GRANT EXECUTE ON FUNCTION public.is_admin_jwt() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_jwt() TO anon;

-- 5. CRIAR FUNÇÃO PARA OBTER USER_TYPE DO JWT
CREATE OR REPLACE FUNCTION public.get_user_type_jwt()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Retornar o user_type do JWT ou 'client' como padrão
  RETURN COALESCE(
    auth.jwt() ->> 'user_type',
    'client'
  );
END;
$$;

-- 6. CONCEDER PERMISSÕES PARA A FUNÇÃO get_user_type_jwt
GRANT EXECUTE ON FUNCTION public.get_user_type_jwt() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_type_jwt() TO anon;

-- 7. VERIFICAR SE AS FUNÇÕES FORAM CRIADAS
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('custom_access_token_hook', 'is_admin_jwt', 'get_user_type_jwt')
ORDER BY routine_name;

-- 8. TESTAR AS FUNÇÕES (após configurar o hook)
-- SELECT public.is_admin_jwt() as is_admin;
-- SELECT public.get_user_type_jwt() as user_type;
-- SELECT auth.jwt() ->> 'user_type' as jwt_user_type;

SELECT 'Funções JWT personalizadas criadas com sucesso!' as status;

-- PRÓXIMOS PASSOS:
-- 1. Configure o hook no Supabase Dashboard:
--    - Vá para Authentication > Hooks
--    - Adicione um "Custom Access Token Hook"
--    - Use a função: public.custom_access_token_hook
-- 2. Execute o script POLITICAS_RLS_COM_JWT.sql para recriar as políticas
-- 3. Atualize o AuthContext no frontend para usar os claims JWT
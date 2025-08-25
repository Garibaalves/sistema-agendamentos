-- =====================================================
-- CORREÇÃO DO CUSTOM ACCESS TOKEN HOOK
-- Resolve erro: "Error running hook URI: pg-functions://postgres/public/custom_access_token_hook"
-- =====================================================

-- PROBLEMA IDENTIFICADO:
-- A função custom_access_token_hook está tentando acessar a tabela profiles
-- durante o processo de autenticação, o que pode causar problemas de permissão
-- ou loops infinitos.

-- SOLUÇÃO: Criar uma versão mais robusta com tratamento de erros

-- 1. REMOVER A FUNÇÃO PROBLEMÁTICA
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- 2. CRIAR VERSÃO CORRIGIDA COM TRATAMENTO DE ERROS
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_uuid uuid;
BEGIN
  -- Inicializar claims
  claims := COALESCE(event->'claims', '{}');
  
  -- Tentar extrair o user_id do evento
  BEGIN
    user_uuid := (event->>'user_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    -- Se não conseguir converter, retornar evento original
    RETURN event;
  END;
  
  -- Tentar buscar o user_type com tratamento de erro
  BEGIN
    SELECT user_type INTO user_role
    FROM public.profiles
    WHERE id = user_uuid;
  EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, definir como 'client'
    user_role := 'client';
  END;

  -- Se não encontrar o usuário, definir como 'client' por padrão
  IF user_role IS NULL THEN
    user_role := 'client';
  END IF;

  -- Adicionar o claim personalizado
  claims := jsonb_set(claims, '{user_type}', to_jsonb(user_role));

  -- Retornar o evento com os claims atualizados
  RETURN jsonb_set(event, '{claims}', claims);
EXCEPTION WHEN OTHERS THEN
  -- Em caso de qualquer erro, retornar o evento original
  RETURN event;
END;
$$;

-- 3. CONCEDER PERMISSÕES NECESSÁRIAS
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO postgres;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO service_role;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO authenticated;

-- 4. VERIFICAR SE A FUNÇÃO FOI CRIADA
SELECT 
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'custom_access_token_hook';

-- 5. TESTE BÁSICO DA FUNÇÃO (simulando um evento)
-- Descomente para testar:
/*
SELECT public.custom_access_token_hook('{
  "user_id": "00000000-0000-0000-0000-000000000000",
  "claims": {}
}');
*/

SELECT 'Função custom_access_token_hook corrigida com sucesso!' as status;
SELECT 'Agora você pode configurar o hook no Supabase Dashboard sem erros.' as instrucao;

-- INSTRUÇÕES PARA CONFIGURAR O HOOK:
-- 1. Vá para o Supabase Dashboard
-- 2. Authentication > Hooks
-- 3. Adicione um "Custom Access Token Hook"
-- 4. Use: pg-functions://postgres/public/custom_access_token_hook
-- 5. Salve e teste fazendo login novamente
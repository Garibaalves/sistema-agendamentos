-- SCRIPT FINAL SIMPLIFICADO PARA CORRIGIR AUTENTICAÇÃO
-- Este script remove todas as políticas RLS e usa apenas função RPC

-- 1. DESABILITAR RLS na tabela profiles (temporariamente para debug)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- 3. Remover funções existentes
DROP FUNCTION IF EXISTS public.get_user_profile(uuid);
DROP FUNCTION IF EXISTS public.get_user_profile(text);
DROP FUNCTION IF EXISTS public.get_user_profile();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.debug_auth_context();

-- 4. Criar função RPC simples para buscar perfil
CREATE OR REPLACE FUNCTION public.get_user_profile()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  address text,
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

  -- Retornar o perfil do usuário atual
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.address,
    p.user_type,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- 5. Criar políticas RLS MUITO SIMPLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política SELECT: usuário pode ver apenas seu próprio perfil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Política INSERT: usuário pode inserir apenas seu próprio perfil
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Política UPDATE: usuário pode atualizar apenas seu próprio perfil
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 6. Conceder permissões
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile() TO authenticated;

-- 7. Verificar se tudo está funcionando
SELECT 'Script executado com sucesso!' as status;

-- INSTRUÇÕES PARA TESTE:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Faça logout da aplicação
-- 3. Limpe o cache do navegador (Ctrl+Shift+R)
-- 4. Faça login novamente
-- 5. Se ainda houver erro, use apenas a função RPC no código
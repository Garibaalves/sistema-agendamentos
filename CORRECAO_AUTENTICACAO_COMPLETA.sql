-- ========================================
-- 🔧 CORREÇÃO COMPLETA - AUTENTICAÇÃO SUPABASE
-- ========================================

-- 1. HABILITAR RLS NA TABELA PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLÍTICAS EXISTENTES (SE HOUVER)
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- 3. CRIAR POLÍTICAS RLS PARA PROFILES

-- SELECT: Admin vê todos, Client vê apenas próprio profile
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- Admin pode ver todos os profiles
      (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'admin'
      OR
      -- Client pode ver apenas seu próprio profile
      id = auth.uid()
    )
  );

-- INSERT: Apenas sistema pode inserir (via triggers)
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    id = auth.uid()
  );

-- UPDATE: Admin atualiza qualquer, Client atualiza apenas próprio
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      -- Admin pode atualizar qualquer profile
      (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'admin'
      OR
      -- Client pode atualizar apenas seu próprio profile
      id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Admin pode atualizar qualquer profile
      (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'admin'
      OR
      -- Client pode atualizar apenas seu próprio profile
      id = auth.uid()
    )
  );

-- DELETE: Admin deleta qualquer, Client deleta apenas próprio
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (
      -- Admin pode deletar qualquer profile
      (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'admin'
      OR
      -- Client pode deletar apenas seu próprio profile
      id = auth.uid()
    )
  );

-- 4. CRIAR FUNÇÃO RPC DE FALLBACK
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  user_type TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Admin pode buscar qualquer profile
  IF (SELECT p.user_type FROM profiles p WHERE p.id = auth.uid()) = 'admin' THEN
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.phone, p.address, p.user_type::TEXT, p.created_at, p.updated_at
    FROM profiles p
    WHERE p.id = user_id;
  -- Client pode buscar apenas seu próprio profile
  ELSIF auth.uid() = user_id THEN
    RETURN QUERY
    SELECT p.id, p.email, p.full_name, p.phone, p.address, p.user_type::TEXT, p.created_at, p.updated_at
    FROM profiles p
    WHERE p.id = user_id;
  ELSE
    RAISE EXCEPTION 'Acesso negado ao profile solicitado';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. CONCEDER PERMISSÕES PARA FUNÇÃO RPC
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO anon;

-- 6. CRIAR FUNÇÃO PARA VERIFICAR CONTEXTO DE AUTENTICAÇÃO
CREATE OR REPLACE FUNCTION debug_auth_context()
RETURNS TABLE(
  user_id UUID,
  user_role TEXT,
  jwt_claims JSON
)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    auth.role()::TEXT as user_role,
    auth.jwt()::JSON as jwt_claims;
END;
$$ LANGUAGE plpgsql;

-- Conceder permissões para função de debug
GRANT EXECUTE ON FUNCTION debug_auth_context() TO authenticated;
GRANT EXECUTE ON FUNCTION debug_auth_context() TO anon;

-- ========================================
-- ✅ SCRIPT APLICADO COM SUCESSO!
-- ========================================

-- PRÓXIMOS PASSOS:
-- 1. Faça logout do aplicativo
-- 2. Faça login novamente
-- 3. Teste o acesso ao dashboard
-- 4. Verifique se não há mais erros no console

-- PARA TESTAR A AUTENTICAÇÃO:
-- SELECT * FROM debug_auth_context();
-- SELECT * FROM get_user_profile(auth.uid());
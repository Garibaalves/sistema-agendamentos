-- ========================================
-- 🔧 SCRIPT CORRIGIDO - SEM RECURSÃO INFINITA
-- ========================================

-- 1. HABILITAR RLS NA TABELA PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLÍTICAS EXISTENTES (SE HOUVER)
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

-- 3. REMOVER FUNÇÃO EXISTENTE (SE HOUVER)
DROP FUNCTION IF EXISTS get_user_profile(UUID);

-- 4. CRIAR POLÍTICAS RLS SIMPLES (SEM RECURSÃO)

-- SELECT: Usuário pode ver apenas seu próprio profile
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: Usuário pode inserir apenas seu próprio profile
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: Usuário pode atualizar apenas seu próprio profile
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: Usuário pode deletar apenas seu próprio profile
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- 5. CRIAR FUNÇÃO RPC PARA ADMIN (SEM RECURSÃO)
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  user_type TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
AS $$
BEGIN
  -- Se user_id não fornecido, usar o usuário atual
  IF user_id IS NULL THEN
    user_id := auth.uid();
  END IF;

  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Retornar apenas o profile do usuário atual (sem verificar tipo)
  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.user_type, p.phone, p.created_at, p.updated_at
  FROM profiles p
  WHERE p.id = user_id AND p.id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- 6. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile() TO authenticated;

-- 7. CRIAR FUNÇÃO PARA VERIFICAR SE USUÁRIO É ADMIN
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'user_type' = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- ========================================
-- ✅ SCRIPT EXECUTADO COM SUCESSO!
-- ========================================

-- PRÓXIMOS PASSOS:
-- 1. Faça logout completo do aplicativo
-- 2. Limpe o cache do navegador
-- 3. Faça login novamente
-- 4. Teste o acesso ao dashboard

-- TESTE DE VERIFICAÇÃO:
-- SELECT auth.uid(), auth.role();
-- SELECT * FROM get_user_profile();
-- SELECT is_admin();
-- =====================================================
-- POLÍTICAS RLS PARA TABELA FINANCIAL_TRANSACTIONS
-- Apenas administradores podem fazer CRUD completo
-- =====================================================

-- 1. REMOVER POLÍTICAS EXISTENTES (se houver)
DROP POLICY IF EXISTS "financial_transactions_select" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_select_jwt" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert_jwt" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_jwt" ON public.financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete_jwt" ON public.financial_transactions;

-- 2. HABILITAR RLS NA TABELA
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS PARA FINANCIAL_TRANSACTIONS (usando JWT)
-- Apenas administradores podem fazer qualquer operação

-- SELECT: Apenas admin pode visualizar transações financeiras
CREATE POLICY "financial_transactions_select_jwt" ON public.financial_transactions
  FOR SELECT
  USING (
    -- Apenas usuários autenticados e admins podem ver transações financeiras
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- INSERT: Apenas admin pode criar transações financeiras
CREATE POLICY "financial_transactions_insert_jwt" ON public.financial_transactions
  FOR INSERT
  WITH CHECK (
    -- Apenas usuários autenticados e admins podem criar transações financeiras
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- UPDATE: Apenas admin pode atualizar transações financeiras
CREATE POLICY "financial_transactions_update_jwt" ON public.financial_transactions
  FOR UPDATE
  USING (
    -- Apenas usuários autenticados e admins podem editar transações financeiras
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  )
  WITH CHECK (
    -- Apenas usuários autenticados e admins podem editar transações financeiras
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- DELETE: Apenas admin pode deletar transações financeiras
CREATE POLICY "financial_transactions_delete_jwt" ON public.financial_transactions
  FOR DELETE
  USING (
    -- Apenas usuários autenticados e admins podem deletar transações financeiras
    auth.uid() IS NOT NULL
    AND public.is_admin_jwt() = true
  );

-- 4. VERIFICAÇÃO DAS POLÍTICAS CRIADAS
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
WHERE tablename = 'financial_transactions'
ORDER BY policyname;

-- 5. TESTE DAS POLÍTICAS
-- Execute estes comandos para testar:
/*
-- Como admin (deve funcionar):
SELECT * FROM financial_transactions LIMIT 5;

-- Como usuário comum (deve retornar vazio ou erro):
-- Faça logout do admin e login como cliente para testar
SELECT * FROM financial_transactions LIMIT 5;
*/

PRINT 'Políticas RLS para financial_transactions criadas com sucesso!';
PRINT 'Apenas administradores podem fazer operações CRUD na tabela financial_transactions.';
PRINT 'Execute os testes comentados no final do script para verificar o funcionamento.';
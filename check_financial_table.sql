-- Script para verificar se a tabela financial_transactions existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'financial_transactions'
) as table_exists;

-- Se a tabela existir, mostrar sua estrutura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'financial_transactions'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela (se existir)
SELECT COUNT(*) as total_records 
FROM financial_transactions;
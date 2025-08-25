-- Script para remover todas as políticas RLS e tornar tabelas públicas
-- Execute este script no Supabase SQL Editor

-- Desabilitar RLS em todas as tabelas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas RLS existentes
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;

DROP POLICY IF EXISTS "appointments_select_client" ON appointments;
DROP POLICY IF EXISTS "appointments_select_admin" ON appointments;
DROP POLICY IF EXISTS "appointments_insert_client" ON appointments;
DROP POLICY IF EXISTS "appointments_insert_admin" ON appointments;
DROP POLICY IF EXISTS "appointments_update_client" ON appointments;
DROP POLICY IF EXISTS "appointments_update_admin" ON appointments;
DROP POLICY IF EXISTS "appointments_delete_admin" ON appointments;

DROP POLICY IF EXISTS "services_select_all" ON services;
DROP POLICY IF EXISTS "services_insert_admin" ON services;
DROP POLICY IF EXISTS "services_update_admin" ON services;
DROP POLICY IF EXISTS "services_delete_admin" ON services;

DROP POLICY IF EXISTS "schedules_select_all" ON schedules;
DROP POLICY IF EXISTS "schedules_insert_admin" ON schedules;
DROP POLICY IF EXISTS "schedules_update_admin" ON schedules;
DROP POLICY IF EXISTS "schedules_delete_admin" ON schedules;

DROP POLICY IF EXISTS "financial_select_admin" ON financial_transactions;
DROP POLICY IF EXISTS "financial_insert_admin" ON financial_transactions;
DROP POLICY IF EXISTS "financial_update_admin" ON financial_transactions;
DROP POLICY IF EXISTS "financial_delete_admin" ON financial_transactions;

-- Remover funções personalizadas
DROP FUNCTION IF EXISTS get_user_profile(uuid);
DROP FUNCTION IF EXISTS get_all_users_admin();
DROP FUNCTION IF EXISTS update_user_admin(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS delete_user_admin(uuid);

-- Garantir que todas as tabelas sejam acessíveis publicamente
GRANT ALL ON profiles TO anon, authenticated;
GRANT ALL ON appointments TO anon, authenticated;
GRANT ALL ON services TO anon, authenticated;
GRANT ALL ON schedules TO anon, authenticated;
GRANT ALL ON financial_transactions TO anon, authenticated;

-- Garantir acesso às sequências
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

SELECT 'Todas as políticas RLS removidas! Tabelas agora são públicas.' as status;
# 🚨 CORREÇÃO FINAL DE AUTENTICAÇÃO

## ⚠️ SOLUÇÃO DEFINITIVA: Execute os scripts na ordem correta

Existem múltiplas funções `get_user_profile()` no banco, causando erro de ambiguidade. Siga os passos abaixo na ordem exata.

### 📋 PASSOS PARA APLICAR A CORREÇÃO:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query" para criar uma nova consulta

3. **PRIMEIRO: Limpar Funções Duplicadas**
   - Abra o arquivo `LIMPAR_FUNCOES_DUPLICADAS.sql`
   - Execute as seções 1-4 em sequência
   - Verifique se apenas UMA função foi criada na seção 5

4. **SEGUNDO: Verificar Estado Atual**
   - Abra o arquivo `VERIFICAR_FUNCAO_RPC.sql`
   - Copie e execute cada seção separadamente
   - Anote os resultados para diagnóstico

5. **TERCEIRO: Execute o Script Final (se necessário)**
   - Se ainda houver problemas, abra o arquivo `SCRIPT_FINAL_SIMPLIFICADO.sql`
   - Copie TODO o conteúdo do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" para executar

6. **QUARTO: Implementar Políticas RLS para Agendamentos**
   - Abra o arquivo `POLITICAS_RLS_AGENDAMENTOS.sql`
   - Copie TODO o conteúdo do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" para executar
   - **Este script implementa:**
     - ✅ ADMIN: Acesso completo (CRUD) a todas as tabelas
     - ✅ CLIENT: Acesso apenas aos próprios dados
     - ✅ Políticas RLS para: profiles, appointments, services, schedules
     - ✅ Função `is_admin()` para verificar tipo de usuário

7. **QUINTO: Se houver erro "Erro Supabase ao buscar serviços"**
   - **PRIMEIRO:** Execute o arquivo `DIAGNOSTICO_RLS_SERVICES.sql` para diagnosticar o problema
   - **DEPOIS:** Execute o arquivo `CORRIGIR_SERVICES_RLS_FIXED.sql` para aplicar a correção
   - **NOTA:** Use o arquivo `CORRIGIR_SERVICES_RLS_FIXED.sql` que corrige o problema de políticas duplicadas
   - **Este script corrige:**
     - ✅ Políticas RLS da tabela services
     - ✅ Acesso adequado para ADMIN e CLIENT
     - ✅ Resolução de conflitos de permissão

6. **Verificar Execução**
   - Certifique-se de que todas as linhas foram executadas sem erro
   - Você deve ver a mensagem: "Script executado com sucesso!"
   - Execute novamente o `VERIFICAR_FUNCAO_RPC.sql` para confirmar

### 🔄 APÓS EXECUTAR O SCRIPT:

1. **Reiniciar Aplicação**
   - Pare o servidor (Ctrl+C no terminal)
   - Inicie novamente: `npm run dev`
   - Faça logout da aplicação
   - Limpe o cache do navegador (Ctrl+Shift+R)
   - Faça login novamente

2. **Testar Acesso**
   - Tente acessar o Dashboard
   - Verifique se o erro "Erro na consulta direta: {}" foi resolvido

### 📊 O QUE O SCRIPT FAZ:

- ✅ Remove TODAS as políticas RLS problemáticas
- ✅ Cria políticas RLS MUITO SIMPLES:
  - **SELECT**: `id = auth.uid()` (apenas próprio perfil)
  - **INSERT**: `id = auth.uid()` (apenas próprio perfil)
  - **UPDATE**: `id = auth.uid()` (apenas próprio perfil)
- ✅ Cria função RPC `get_user_profile()` SEM PARÂMETROS
- ✅ Remove consulta direta do código (usa apenas RPC)
- ✅ Configura permissões adequadas

### 🎯 RESULTADO ESPERADO:
- ✅ Login funcionando sem erros
- ✅ Dashboard acessível para ADMIN e CLIENT
- ✅ Sem conflitos de RLS ou recursão infinita
- ✅ Autenticação 100% via função RPC

### 🔧 MUDANÇAS NO CÓDIGO:
- ✅ AuthContext modificado para usar APENAS função RPC
- ✅ Removida consulta direta à tabela profiles
- ✅ Eliminado problema de autorização JWT

## 🧪 TESTES APÓS APLICAÇÃO

### **Teste 1: Login Admin**
1. Faça login com usuário admin
2. Verifique se acessa o dashboard sem erros
3. Confirme se pode ver seu próprio profile

### **Teste 2: Login Client**
1. Faça login com usuário client
2. Verifique se acessa o dashboard sem erros
3. Confirme se vê apenas seu próprio profile

### **Teste 3: Sem Autenticação**
1. Faça logout
2. Tente acessar páginas protegidas
3. Confirme redirecionamento para login

## 🚨 SE AINDA HOUVER ERROS

### **Verificar Contexto de Autenticação:**
```sql
SELECT auth.uid(), auth.role();
```

### **Testar Função RPC:**
```sql
SELECT * FROM get_user_profile();
```

### **Verificar Políticas:**
```sql
SELECT * FROM profiles WHERE id = auth.uid();
```

## 📞 PRÓXIMOS PASSOS

1. **Execute o script `SCRIPT_FINAL_SIMPLIFICADO.sql` no Supabase**
2. **Reinicie o servidor da aplicação**
3. **Faça logout/login no aplicativo**
4. **Teste todas as funcionalidades**
5. **Reporte se ainda há erros**

---
**⚠️ IMPORTANTE:** Use o arquivo `SCRIPT_FINAL_SIMPLIFICADO.sql` que remove todos os conflitos de RLS e usa apenas função RPC para autenticação.
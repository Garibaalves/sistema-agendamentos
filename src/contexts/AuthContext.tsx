'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string, userType: 'admin' | 'client', phone?: string) => Promise<{ error: any }>
  signUpWithPhone: (email: string, password: string, phone: string) => Promise<{ error: any }>
  checkEmailExists: (email: string) => Promise<{ exists: boolean, error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isClient: boolean
  getUserTypeFromJWT: () => string | null
  isAdminFromJWT: () => boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      
      setLoading(false)
    }

    getSession()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Buscando perfil para usuário:', userId)
      
      // Verificar se há sessão ativa
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('Nenhuma sessão ativa encontrada')
        return
      }
      
      console.log('Sessão ativa encontrada, chamando RPC...')
      
      // Usar apenas função RPC para evitar problemas com RLS
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_profile')

      if (rpcError) {
        console.error('Erro detalhado na função RPC:', {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code
        })
        
        // Fallback: tentar consulta direta se RPC falhar
        console.log('Tentando fallback com consulta direta...')
        const { data: directData, error: directError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
          
        if (directError) {
          console.error('Erro na consulta direta também:', directError)
          return
        }
        
        console.log('Perfil obtido via consulta direta (fallback):', directData)
        setProfile(directData)
        return
      }

      // A função RPC retorna um array, pegar o primeiro item
      const profileData = Array.isArray(rpcData) ? rpcData[0] : rpcData
      
      if (!profileData) {
        console.error('Nenhum perfil retornado pela função RPC')
        return
      }
      
      console.log('Perfil obtido via RPC:', profileData)
      setProfile(profileData)
    } catch (error) {
      console.error('Erro geral ao buscar perfil:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string, userType: 'admin' | 'client', phone?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
          phone: phone || null,
        }
      }
    })

    if (error) {
      return { error }
    }

    return { error: null }
  }

  const signUpWithPhone = async (email: string, password: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone: phone,
          user_type: 'client',
        }
      }
    })

    if (error) {
      return { error }
    }

    return { error: null }
  }

  const checkEmailExists = async (email: string) => {
    try {
      // Consulta na tabela profiles sem usar .single() para evitar erros
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
      
      if (error) {
        console.error('Erro na consulta:', error)
        return { exists: false, error }
      }
      
      // Se encontrou dados (array não vazio), o email existe
      const userExists = data && data.length > 0
      
      return { exists: userExists, error: null }
    } catch (err) {
      console.error('Erro ao verificar email:', err)
      return { exists: false, error: err }
    }
  }

  const signOut = async () => {
    try {
      // Usar signOut com scope local para evitar erro de rede
      await supabase.auth.signOut({ scope: 'local' })
      
      // Limpar estado local
      setUser(null)
      setProfile(null)
      
      // Redirecionar para login
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      // Mesmo com erro, limpar estado e redirecionar
      setUser(null)
      setProfile(null)
      window.location.href = '/login'
    }
  }

  // Funções para verificar user_type do JWT (para usar com políticas RLS)
  const getUserTypeFromJWT = () => {
    if (!user) return null
    return user.user_metadata?.user_type || user.app_metadata?.user_type || null
  }

  const isAdminFromJWT = () => {
    const userType = getUserTypeFromJWT()
    return userType === 'admin'
  }

  // Função para atualizar a sessão e sincronizar claims JWT
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Erro ao atualizar sessão:', error)
        return
      }
      
      if (data.user) {
        setUser(data.user)
        await fetchProfile(data.user.id)
      }
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error)
    }
  }

  // Manter compatibilidade com verificações baseadas no perfil
  const isAdmin = profile?.user_type === 'admin'
  const isClient = profile?.user_type === 'client'

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signUpWithPhone,
    checkEmailExists,
    signOut,
    isAdmin,
    isClient,
    getUserTypeFromJWT,
    isAdminFromJWT,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
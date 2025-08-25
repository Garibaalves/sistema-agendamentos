'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireClient?: boolean
  fallback?: React.ReactNode
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireClient = false,
  fallback = null,
}: ProtectedRouteProps) {
  const { user, profile, loading, isAdmin, isClient } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Se não está logado, redireciona para login
      if (!user) {
        router.push('/login')
        return
      }

      // Se requer admin mas não é admin
      if (requireAdmin && !isAdmin) {
        router.push('/dashboard')
        return
      }

      // Se requer client mas não é client
      if (requireClient && !isClient) {
        router.push('/dashboard')
        return
      }
    }
  }, [user, profile, loading, isAdmin, isClient, requireAdmin, requireClient, router])

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // Se não está logado, não renderiza nada (será redirecionado)
  if (!user) {
    return fallback
  }

  // Se requer admin mas não é admin
  if (requireAdmin && !isAdmin) {
    return fallback
  }

  // Se requer client mas não é client
  if (requireClient && !isClient) {
    return fallback
  }

  return <>{children}</>
}
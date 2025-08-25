import { useAuth } from '@/contexts/AuthContext'

export function usePermissions() {
  const { profile, isAdmin, isClient } = useAuth()

  const canManageUsers = isAdmin
  const canManageServices = isAdmin
  const canManageClients = isAdmin
  const canViewAllAppointments = isAdmin
  const canManageAppointments = isAdmin
  const canCreateAppointments = isClient || isAdmin
  const canViewOwnAppointments = isClient || isAdmin
  const canAccessAdminPanel = isAdmin
  const canAccessClientPanel = isClient

  return {
    profile,
    isAdmin,
    isClient,
    canManageUsers,
    canManageServices,
    canManageClients,
    canViewAllAppointments,
    canManageAppointments,
    canCreateAppointments,
    canViewOwnAppointments,
    canAccessAdminPanel,
    canAccessClientPanel,
  }
}
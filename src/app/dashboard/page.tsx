'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { CalendarIcon, UserGroupIcon, CogIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

interface DashboardStats {
  totalClients: number
  appointmentsToday: number
  activeServices: number
  pendingAppointments: number
  userAppointments: number
  nextAppointment: string
}

interface RecentActivity {
  id: string
  type: 'client' | 'appointment' | 'service'
  title: string
  description: string
  status: string
  created_at: string
}

export default function DashboardPage() {
  const { user, userType, profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    appointmentsToday: 0,
    activeServices: 0,
    pendingAppointments: 0,
    userAppointments: 0,
    nextAppointment: 'Nenhum'
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      if (!userType) {
        if (isMounted) setLoading(false)
        return
      }
      
      if (userType === 'client' && !user?.id) {
        if (isMounted) setLoading(false)
        return
      }
      
      try {
        if (userType === 'admin') {
          await fetchAdminStats()
          await fetchRecentActivities()
        } else {
          await fetchClientStats()
          await fetchClientActivities()
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    loadData()
    
    return () => {
      isMounted = false
    }
  }, [userType, user?.id])



  const fetchAdminStats = async () => {
    // Total de clientes
    const { count: totalClients } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'client')

    // Agendamentos hoje
    const today = new Date().toISOString().split('T')[0]
    const { count: appointmentsToday } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('appointment_date', today)
      .lt('appointment_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    // Serviços ativos
    const { count: activeServices } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Agendamentos pendentes
    const { count: pendingAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')

    setStats(prev => ({
      ...prev,
      totalClients: totalClients || 0,
      appointmentsToday: appointmentsToday || 0,
      activeServices: activeServices || 0,
      pendingAppointments: pendingAppointments || 0
    }))
  }

  const fetchClientStats = async () => {
    if (!user) return

    // Total de agendamentos do usuário
    const { count: userAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Próximo agendamento
    const { data: nextAppointmentData } = await supabase
      .from('appointments')
      .select(`
        appointment_date,
        appointment_time,
        services(name)
      `)
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(1)
      .single()

    let nextAppointmentText = 'Nenhum'
    if (nextAppointmentData) {
      const date = new Date(nextAppointmentData.appointment_date)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      if (date.toDateString() === today.toDateString()) {
        nextAppointmentText = `Hoje às ${nextAppointmentData.appointment_time.substring(0, 5)}`
      } else if (date.toDateString() === tomorrow.toDateString()) {
        nextAppointmentText = `Amanhã às ${nextAppointmentData.appointment_time.substring(0, 5)}`
      } else {
        nextAppointmentText = `${date.toLocaleDateString('pt-BR')} às ${nextAppointmentData.appointment_time.substring(0, 5)}`
      }
    }

    setStats(prev => ({
      ...prev,
      userAppointments: userAppointments || 0,
      nextAppointment: nextAppointmentText
    }))
  }

  const fetchRecentActivities = async () => {
    const activities: RecentActivity[] = []

    // Novos clientes (últimos 7 dias)
    const { data: newClients } = await supabase
      .from('profiles')
      .select('full_name, created_at')
      .eq('user_type', 'client')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(3)

    newClients?.forEach(client => {
      activities.push({
        id: `client-${client.created_at}`,
        type: 'client',
        title: 'Novo cliente cadastrado',
        description: `${client.full_name} - ${getTimeAgo(client.created_at)}`,
        status: 'Novo',
        created_at: client.created_at
      })
    })

    // Agendamentos recentes
    const { data: recentAppointments } = await supabase
      .from('appointments')
      .select(`
        id,
        status,
        appointment_date,
        appointment_time,
        created_at,
        profiles(full_name),
        services(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    recentAppointments?.forEach(appointment => {
      activities.push({
        id: `appointment-${appointment.id}`,
        type: 'appointment',
        title: 'Agendamento realizado',
        description: `${appointment.profiles?.full_name} - ${appointment.services?.name} - ${getTimeAgo(appointment.created_at)}`,
        status: appointment.status === 'scheduled' ? 'Agendado' : appointment.status === 'confirmed' ? 'Confirmado' : 'Concluído',
        created_at: appointment.created_at
      })
    })

    // Ordenar por data de criação
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setRecentActivities(activities.slice(0, 5))
  }

  const fetchClientActivities = async () => {
    if (!user) return

    const { data: userAppointments } = await supabase
      .from('appointments')
      .select(`
        id,
        status,
        appointment_date,
        appointment_time,
        created_at,
        services(name)
      `)
      .eq('user_id', user.id)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .limit(5)

    const activities: RecentActivity[] = userAppointments?.map(appointment => {
      const date = new Date(appointment.appointment_date)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      let dateText = ''
      if (date.toDateString() === today.toDateString()) {
        dateText = `Hoje às ${appointment.appointment_time.substring(0, 5)}`
      } else if (date.toDateString() === tomorrow.toDateString()) {
        dateText = `Amanhã às ${appointment.appointment_time.substring(0, 5)}`
      } else if (date < today) {
        dateText = `${date.toLocaleDateString('pt-BR')}`
      } else {
        dateText = `${date.toLocaleDateString('pt-BR')} às ${appointment.appointment_time.substring(0, 5)}`
      }

      return {
        id: appointment.id,
        type: 'appointment' as const,
        title: appointment.services?.name || 'Serviço',
        description: dateText,
        status: appointment.status === 'scheduled' ? 'Agendado' : appointment.status === 'confirmed' ? 'Confirmado' : 'Concluído',
        created_at: appointment.created_at
      }
    }) || []

    setRecentActivities(activities)
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'há poucos minutos'
    } else if (diffInHours < 24) {
      return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'novo':
        return 'bg-green-100 text-green-800'
      case 'confirmado':
        return 'bg-blue-100 text-blue-800'
      case 'agendado':
        return 'bg-yellow-100 text-yellow-800'
      case 'concluído':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const adminStatsConfig = [
    {
      name: 'Total de Clientes',
      value: stats.totalClients.toString(),
      icon: UserGroupIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Agendamentos Hoje',
      value: stats.appointmentsToday.toString(),
      icon: CalendarIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Serviços Ativos',
      value: stats.activeServices.toString(),
      icon: CogIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'Agendamentos Pendentes',
      value: stats.pendingAppointments.toString(),
      icon: ClipboardDocumentListIcon,
      color: 'bg-yellow-500'
    }
  ]

  const clientStatsConfig = [
    {
      name: 'Meus Agendamentos',
      value: stats.userAppointments.toString(),
      icon: CalendarIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Próximo Agendamento',
      value: stats.nextAppointment,
      icon: ClipboardDocumentListIcon,
      color: 'bg-green-500'
    }
  ]

  const statsConfig = userType === 'admin' ? adminStatsConfig : clientStatsConfig

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-black mb-2">
            Bem-vindo, {user?.user_metadata?.full_name || user?.email}!
          </h1>
          <p className="text-gray-600">
            {userType === 'admin' 
              ? 'Gerencie seus clientes, serviços e agendamentos.' 
              : 'Visualize e gerencie seus agendamentos.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsConfig.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-semibold text-black">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">
              {userType === 'admin' ? 'Atividades Recentes' : 'Meus Agendamentos Recentes'}
            </h2>
          </div>
          <div className="p-6">
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const getIcon = () => {
                    switch (activity.type) {
                      case 'client':
                        return UserGroupIcon
                      case 'appointment':
                        return CalendarIcon
                      case 'service':
                        return CogIcon
                      default:
                        return CalendarIcon
                    }
                  }
                  
                  const getIconColor = () => {
                    switch (activity.type) {
                      case 'client':
                        return 'bg-green-100 text-green-600'
                      case 'appointment':
                        return 'bg-blue-100 text-blue-600'
                      case 'service':
                        return 'bg-purple-100 text-purple-600'
                      default:
                        return 'bg-gray-100 text-gray-600'
                    }
                  }
                  
                  const Icon = getIcon()
                  
                  return (
                    <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 ${getIconColor()} rounded-full flex items-center justify-center`}>
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.description}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-black">
                  {userType === 'admin' ? 'Nenhuma atividade recente' : 'Nenhum agendamento encontrado'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {userType === 'admin' 
                    ? 'As atividades aparecerão aqui conforme acontecem.' 
                    : 'Seus agendamentos aparecerão aqui quando você fizer um.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userType === 'admin' ? (
              <>
                <button className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Novo Cliente
                </button>
                <button className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Novo Agendamento
                </button>
                <button className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">
                  <CogIcon className="h-5 w-5 mr-2" />
                  Novo Serviço
                </button>
              </>
            ) : (
              <>
                <button className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Novo Agendamento
                </button>
                <button className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200">
                  <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                  Ver Agendamentos
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
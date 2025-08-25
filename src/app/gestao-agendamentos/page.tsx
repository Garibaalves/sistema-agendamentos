'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { MagnifyingGlassIcon, EyeIcon, CheckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

interface Appointment {
  id: string
  client_id: string
  service_id: string
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  service_price?: number
  admin_notes?: string
  completed_at?: string
  payment_method?: string
  created_at: string
  updated_at: string
  profiles: {
    full_name: string
    email: string
    phone?: string
  }
  services: {
    name: string
    description: string
    price: number
  }
}

interface Message {
  type: 'success' | 'error'
  text: string
}

export default function GestaoAgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [message, setMessage] = useState<Message | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingAppointment, setPendingAppointment] = useState<{ id: string, servicePrice: number } | null>(null)
  const { isAdmin, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchAppointments()
    }
  }, [isAdmin, authLoading])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          client_id,
          service_id,
          appointment_date,
          appointment_time,
          status,
          notes,
          service_price,
          admin_notes,
          completed_at,
          payment_method,
          created_at,
          updated_at,
          profiles!appointments_client_id_fkey (
            full_name,
            email,
            phone
          ),
          services (
            name,
            description,
            price
          )
        `)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })

      if (error) {
        console.error('Erro ao buscar agendamentos:', error)
        setMessage({ type: 'error', text: 'Erro ao carregar agendamentos' })
        return
      }

      setAppointments(data || [])
      setMessage({ type: 'success', text: `${data?.length || 0} agendamentos carregados` })
    } catch (err) {
      console.error('Erro:', err)
      setMessage({ type: 'error', text: 'Erro inesperado ao carregar agendamentos' })
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (id: string, newStatus: string) => {
    try {
      // Se está marcando como concluído, solicitar método de pagamento
      if (newStatus === 'completed') {
        const appointment = appointments.find(a => a.id === id)
        if (!appointment) {
          setMessage({ type: 'error', text: 'Agendamento não encontrado' })
          return
        }

        // Armazenar dados do agendamento e mostrar modal
        setPendingAppointment({ id: appointment.id, servicePrice: appointment.service_price || appointment.services.price })
        setShowPaymentModal(true)
        return // Aguardar seleção no modal
      } else {
        // Para outros status, apenas atualizar normalmente
        const updateData: any = { status: newStatus }
        
        const { error } = await supabase
          .from('appointments')
          .update(updateData)
          .eq('id', id)

        if (error) throw error
        setMessage({ type: 'success', text: 'Status atualizado com sucesso!' })
      }

      fetchAppointments()
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      setMessage({ type: 'error', text: 'Erro ao atualizar status do agendamento' })
    }
  }

  const handlePaymentMethodSelect = async (paymentMethod: string) => {
    if (!pendingAppointment) return

    setShowPaymentModal(false)
    
    try {
      const appointment = appointments.find(a => a.id === pendingAppointment.id)
      if (!appointment) {
        setMessage({ type: 'error', text: 'Agendamento não encontrado' })
        return
      }

      // Atualizar agendamento com status concluído e método de pagamento
      const updateData = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        payment_method: paymentMethod
      }

      const { error: appointmentError } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', pendingAppointment.id)

      if (appointmentError) throw appointmentError

      // Registrar transação financeira como receita
      const servicePrice = appointment.service_price || appointment.services.price
      const { error: transactionError } = await supabase
        .from('financial_transactions')
        .insert({
          type: 'income',
          description: `Serviço: ${appointment.services.name} - Cliente: ${appointment.profiles.full_name}`,
          amount: servicePrice,
          payment_method: paymentMethod,
          category: 'servicos',
          transaction_date: new Date().toISOString().split('T')[0]
        })

      if (transactionError) {
        console.error('Erro ao registrar transação financeira:', transactionError)
        setMessage({ type: 'error', text: 'Agendamento concluído, mas erro ao registrar receita financeira. Verifique se a tabela financial_transactions existe no banco.' })
      } else {
        setMessage({ type: 'success', text: 'Agendamento concluído e receita registrada com sucesso!' })
      }

      fetchAppointments()
    } catch (error) {
      console.error('Erro ao processar conclusão:', error)
      setMessage({ type: 'error', text: 'Erro inesperado ao processar conclusão do agendamento' })
    } finally {
      setPendingAppointment(null)
    }
  }

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false)
    setPendingAppointment(null)
  }

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.services?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'scheduled': return 'Agendado'
      case 'confirmed': return 'Confirmado'
      case 'completed': return 'Concluído'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  if (authLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </Layout>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Agendamentos</h1>
              <p className="mt-2 text-sm text-gray-700">
                Gerencie todos os agendamentos do sistema
              </p>
            </div>
          </div>

          {/* Mensagens de feedback */}
          {message && (
            <div className={`p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Buscar por cliente, serviço ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos os status</option>
                  <option value="pending">Pendente</option>
                  <option value="scheduled">Agendado</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de agendamentos */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agendamento encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Não há agendamentos cadastrados no momento.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <li key={appointment.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {appointment.profiles?.full_name || 'Cliente não encontrado'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.profiles?.email}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getStatusColor(appointment.status)
                            }`}>
                              {getStatusText(appointment.status)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="font-medium">{appointment.services?.name}</span>
                            <span className="mx-2">•</span>
                            <span>{formatDate(appointment.appointment_date)}</span>
                            <span className="mx-2">•</span>
                            <span>{formatTime(appointment.appointment_time)}</span>
                            <span className="mx-2">•</span>
                            <span className="font-medium text-green-600">
                              {formatPrice(appointment.service_price || appointment.services?.price || 0)}
                            </span>
                          </div>
                          {appointment.notes && (
                            <p className="mt-1 text-sm text-gray-600">
                              <span className="font-medium">Observações:</span> {appointment.notes}
                            </p>
                          )}
                          {appointment.admin_notes && (
                            <p className="mt-1 text-sm text-blue-600">
                              <span className="font-medium">Notas Admin:</span> {appointment.admin_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {(appointment.status === 'pending' || appointment.status === 'scheduled') && (
                          <>
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                              className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              title="Confirmar agendamento"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                              className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              title="Cancelar agendamento"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                            className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            title="Marcar como concluído"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Estatísticas */}
          {!loading && appointments.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {appointments.filter(a => a.status === 'pending' || a.status === 'scheduled').length}
                  </div>
                  <div className="text-sm text-gray-500">Pendentes/Agendados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {appointments.filter(a => a.status === 'confirmed').length}
                  </div>
                  <div className="text-sm text-gray-500">Confirmados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {appointments.filter(a => a.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-500">Concluídos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {appointments.filter(a => a.status === 'cancelled').length}
                  </div>
                  <div className="text-sm text-gray-500">Cancelados</div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Método de Pagamento */}
          {showPaymentModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Método de Pagamento</h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">Selecione o método de pagamento utilizado:</p>
                  </div>
                  <div className="space-y-2 mt-4">
                    <button
                      onClick={() => handlePaymentMethodSelect('pix')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      PIX
                    </button>
                    <button
                      onClick={() => handlePaymentMethodSelect('credit_card')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cartão de Crédito
                    </button>
                    <button
                      onClick={() => handlePaymentMethodSelect('debit_card')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cartão de Débito
                    </button>
                    <button
                      onClick={() => handlePaymentMethodSelect('cash')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Dinheiro
                    </button>
                    <button
                      onClick={handlePaymentModalClose}
                      className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
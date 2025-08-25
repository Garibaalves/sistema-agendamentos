'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { PlusIcon, MagnifyingGlassIcon, CalendarIcon, ClockIcon, UserIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

interface Appointment {
  id: string
  client_id: string
  service_id: string
  appointment_date: string
  appointment_time: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  profiles: {
    full_name: string
    email: string
    phone: string
  }
  services: {
    name: string
    price: number
    duration: number
  }
}

interface Client {
  id: string
  full_name: string
  email: string
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

export default function AppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Cliente Supabase já importado

  useEffect(() => {
    // Aguardar o usuário ser carregado antes de fazer consultas
    if (user) {
      fetchAppointments()
      fetchClients()
      fetchServices()
    }
  }, [user])

  const fetchAppointments = async () => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          profiles (full_name, email, phone),
          services (name, price, duration)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })

      // Se for cliente, mostrar apenas seus agendamentos
      if (user?.user_type === 'client') {
        query = query.eq('client_id', user.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro Supabase ao buscar agendamentos:', error)
        throw error
      }
      setAppointments(data || [])
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err)
      setError('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      // Apenas ADMIN pode ver lista de clientes
      if (user?.user_type !== 'admin') {
        setClients([])
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('user_type', 'client')
        .order('full_name')

      if (error) {
        console.error('Erro Supabase ao buscar clientes:', error)
        throw error
      }
      setClients(data || [])
    } catch (err) {
      console.error('Erro ao buscar clientes:', err)
      setError('Erro ao carregar lista de clientes')
    }
  }

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, duration')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Erro Supabase ao buscar serviços:', error)
        throw error
      }
      setServices(data || [])
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
      setError('Erro ao carregar lista de serviços')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const appointmentData = {
      client_id: formData.client_id,
      service_id: formData.service_id,
      appointment_date: formData.appointment_date,
      appointment_time: formData.appointment_time,
      status: 'scheduled' as const,
      notes: formData.notes || null
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData])

      if (error) throw error
      setSuccess('Agendamento criado com sucesso!')
      setShowModal(false)
      setFormData({ client_id: '', service_id: '', appointment_date: '', appointment_time: '', notes: '' })
      fetchAppointments()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar agendamento')
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (error) throw error
      setSuccess('Status do agendamento atualizado!')
      fetchAppointments()
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status')
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.services.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // Remove os segundos
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado'
      case 'confirmed':
        return 'Confirmado'
      case 'completed':
        return 'Concluído'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  const isAdmin = user?.user_type === 'admin'

  return (
    <ProtectedRoute>
      <Layout title="Agendamentos">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black">Agendamentos</h1>
              <p className="text-gray-600">
                {isAdmin ? 'Gerencie todos os agendamentos' : 'Seus agendamentos'}
              </p>
            </div>
            {isAdmin ? (
              <button
                onClick={() => {
                  setFormData({ client_id: '', service_id: '', appointment_date: '', appointment_time: '', notes: '' })
                  setShowModal(true)
                }}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Novo Agendamento
              </button>
            ) : (
              <button
                onClick={() => window.location.href = '/novo-agendamento'}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Novo Agendamento
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">Todos os status</option>
              <option value="scheduled">Agendado</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Appointments List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando agendamentos...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <UserIcon className="h-5 w-5 text-gray-400" />
                          <span className="font-semibold text-gray-900">{appointment.profiles.full_name}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {formatDate(appointment.appointment_date)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4 mr-2" />
                            {formatTime(appointment.appointment_time)}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">{appointment.services.name}</span>
                          </div>
                          <div className="text-sm text-green-600 font-semibold">
                            {formatPrice(appointment.services.price)}
                          </div>
                        </div>
                      </div>
                      
                      {appointment.notes && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Observações:</strong> {appointment.notes}
                        </div>
                      )}
                    </div>
                    
                    {isAdmin && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        {appointment.status === 'scheduled' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                            className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200 text-sm"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Confirmar
                          </button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                            className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors duration-200 text-sm"
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Concluir
                          </button>
                        )}
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                          className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors duration-200 text-sm"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredAppointments.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              Nenhum agendamento encontrado.
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-black mb-4">
                Novo Agendamento
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente
                  </label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.full_name} - {client.email}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serviço
                  </label>
                  <select
                    required
                    value={formData.service_id}
                    onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Selecione um serviço</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {formatPrice(service.price)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.appointment_date}
                      onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.appointment_time}
                      onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    placeholder="Observações sobre o agendamento"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                  >
                    Criar Agendamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  )
}
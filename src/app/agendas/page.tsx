'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import { Plus, Edit, Trash2, Clock, Calendar, AlertCircle } from 'lucide-react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

type Schedule = Database['public']['Tables']['schedules']['Row'] & {
  services: {
    name: string
    duration: number
  } | null
}

type Service = Database['public']['Tables']['services']['Row']

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
]

export default function AgendasPage() {
  const { user, profile } = useAuth()
  const { isAdmin } = usePermissions()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    service_id: '',
    days_of_week: [] as number[],
    start_time: '08:00',
    end_time: '17:00',
    slot_duration: 30,
    is_active: true
  })

  useEffect(() => {
    if (isAdmin) {
      fetchSchedules()
      fetchServices()
    }
  }, [user])

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          services (name, duration)
        `)
        .order('day_of_week')
        .order('start_time')

      if (error) throw error
      setSchedules(data || [])
    } catch (err) {
      console.error('Erro ao buscar agendas:', err)
      setError('Erro ao carregar agendas')
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setServices(data || [])
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
    }
  }

  const checkTimeConflicts = (startTime: string, endTime: string, dayOfWeek: number, serviceId: string, excludeId?: string) => {
    return schedules.filter(schedule => {
      if (excludeId && schedule.id === excludeId) return false
      if (schedule.service_id !== serviceId) return false
      if (schedule.day_of_week !== dayOfWeek) return false
      
      const existingStart = schedule.start_time
      const existingEnd = schedule.end_time
      
      // Verifica sobreposição de horários
      return (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      )
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.days_of_week.length === 0) {
      setError('Selecione pelo menos um dia da semana')
      return
    }

    // Validação de horários
    if (formData.start_time >= formData.end_time) {
      setError('O horário de início deve ser anterior ao horário de fim')
      return
    }

    try {
      if (editingSchedule) {
        // Para edição, verifica conflitos excluindo a agenda atual
        const conflicts = checkTimeConflicts(
          formData.start_time,
          formData.end_time,
          formData.days_of_week[0],
          formData.service_id,
          editingSchedule.id
        )

        if (conflicts.length > 0) {
          setError('Já existe uma agenda para este serviço neste dia e horário')
          return
        }

        const scheduleData = {
          service_id: formData.service_id,
          day_of_week: formData.days_of_week[0],
          start_time: formData.start_time,
          end_time: formData.end_time,
          slot_duration: formData.slot_duration,
          is_active: formData.is_active,
          created_by: user?.id
        }

        const { error } = await supabase
          .from('schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id)

        if (error) throw error
      } else {
        // Para criação, verifica conflitos para cada dia selecionado
        const conflictingDays: string[] = []
        
        for (const day of formData.days_of_week) {
          const conflicts = checkTimeConflicts(
            formData.start_time,
            formData.end_time,
            day,
            formData.service_id
          )
          
          if (conflicts.length > 0) {
            const dayName = DAYS_OF_WEEK.find(d => d.value === day)?.label || 'Desconhecido'
            conflictingDays.push(dayName)
          }
        }

        if (conflictingDays.length > 0) {
          setError(`Já existem agendas para este serviço nos seguintes dias: ${conflictingDays.join(', ')}`)
          return
        }

        // Cria uma agenda para cada dia selecionado
        const schedulesData = formData.days_of_week.map(day => ({
          service_id: formData.service_id,
          day_of_week: day,
          start_time: formData.start_time,
          end_time: formData.end_time,
          slot_duration: formData.slot_duration,
          is_active: formData.is_active,
          created_by: user?.id
        }))

        const { error } = await supabase
          .from('schedules')
          .insert(schedulesData)

        if (error) throw error
      }

      await fetchSchedules()
      resetForm()
    } catch (err: unknown) {
      console.error('Erro ao salvar agenda:', err)
      setError(err instanceof Error ? err.message : 'Erro ao salvar agenda')
    }
  }

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      service_id: schedule.service_id,
      days_of_week: [schedule.day_of_week],
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      slot_duration: schedule.slot_duration,
      is_active: schedule.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta agenda?')) return

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchSchedules()
    } catch (err: unknown) {
      console.error('Erro ao excluir agenda:', err)
      setError(err instanceof Error ? err.message : 'Erro ao excluir agenda')
    }
  }

  const resetForm = () => {
    setFormData({
      service_id: '',
      days_of_week: [],
      start_time: '08:00',
      end_time: '17:00',
      slot_duration: 30,
      is_active: true
    })
    setEditingSchedule(null)
    setShowForm(false)
    setError('')
  }

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(day => day.value === dayOfWeek)?.label || 'Desconhecido'
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5) // Remove seconds
  }

  if (loading) {
    return (
      <ProtectedRoute requiredUserType="admin">
        <Layout title="Gestão de Agendas">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredUserType="admin">
      <Layout title="Gestão de Agendas">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black">Agendas</h1>
              <p className="text-gray-600">Configure os horários disponíveis para cada serviço</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Agenda
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-black">
                  {editingSchedule ? 'Editar Agenda' : 'Nova Agenda'}
                </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Serviço</label>
                  <select
                    value={formData.service_id}
                    onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:border-red-500"
                    required
                  >
                    <option value="">Selecione um serviço</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">
                    {editingSchedule ? 'Dia da Semana' : 'Dias da Semana'}
                  </label>
                  {editingSchedule ? (
                    <select
                      value={formData.days_of_week[0] || 1}
                      onChange={(e) => setFormData({ ...formData, days_of_week: [parseInt(e.target.value)] })}
                      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:border-red-500"
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                     <div className="space-y-3">
                       {/* Botões de seleção rápida */}
                       <div className="flex gap-2 mb-3">
                         <button
                           type="button"
                           onClick={() => setFormData({ ...formData, days_of_week: [1, 2, 3, 4, 5] })}
                           className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                         >
                           Dias Úteis
                         </button>
                         <button
                           type="button"
                           onClick={() => setFormData({ ...formData, days_of_week: [0, 6] })}
                           className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                         >
                           Fins de Semana
                         </button>
                         <button
                           type="button"
                           onClick={() => setFormData({ ...formData, days_of_week: [0, 1, 2, 3, 4, 5, 6] })}
                           className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                         >
                           Todos os Dias
                         </button>
                         <button
                           type="button"
                           onClick={() => setFormData({ ...formData, days_of_week: [] })}
                           className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                         >
                           Limpar
                         </button>
                       </div>
                       
                       {/* Checkboxes dos dias */}
                       <div className="grid grid-cols-2 gap-2">
                         {DAYS_OF_WEEK.map((day) => (
                           <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                             <input
                               type="checkbox"
                               checked={formData.days_of_week.includes(day.value)}
                               onChange={(e) => {
                                 if (e.target.checked) {
                                   setFormData({
                                     ...formData,
                                     days_of_week: [...formData.days_of_week, day.value].sort()
                                   })
                                 } else {
                                   setFormData({
                                     ...formData,
                                     days_of_week: formData.days_of_week.filter(d => d !== day.value)
                                   })
                                 }
                               }}
                               className="rounded border-gray-600 text-red-600 focus:ring-red-500 focus:ring-2"
                             />
                             <span className="text-sm text-gray-700">{day.label}</span>
                           </label>
                         ))}
                       </div>
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Horário Início</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Horário Fim</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Duração do Slot (minutos)</label>
                  <select
                    value={formData.slot_duration}
                    onChange={(e) => setFormData({ ...formData, slot_duration: parseInt(e.target.value) })}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:border-red-500"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1 hora e 30 minutos</option>
                    <option value={120}>2 horas</option>
                    <option value={150}>2 horas e 30 minutos</option>
                    <option value={180}>3 horas</option>
                    <option value={210}>3 horas e 30 minutos</option>
                    <option value={240}>4 horas</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">Agenda ativa</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    {editingSchedule ? 'Atualizar' : 'Criar'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

          {/* Schedules List */}
          <div className="grid gap-6">
            {schedules.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhuma agenda configurada</h3>
                <p className="text-gray-500 mb-4">Crie sua primeira agenda para começar a receber agendamentos.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md transition-colors"
                >
                  Criar Primeira Agenda
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-black">{schedule.services?.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            schedule.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {schedule.is_active ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{getDayName(schedule.day_of_week)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Slots de {schedule.slot_duration} min</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
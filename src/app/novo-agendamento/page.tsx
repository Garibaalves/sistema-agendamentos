'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { CalendarIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
}

interface TimeSlot {
  time: string
  available: boolean
}

export default function NewAppointmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Cliente Supabase já importado

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    if (selectedDate && selectedService) {
      generateTimeSlots()
    }
  }, [selectedDate, selectedService])

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
      setError('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = async () => {
    if (!selectedDate || !selectedService) return

    try {
      // Obter o dia da semana (0 = domingo, 1 = segunda, etc.)
      const selectedDateObj = new Date(selectedDate + 'T00:00:00')
      const dayOfWeek = selectedDateObj.getDay()

      // Buscar agendas ativas para o serviço e dia da semana
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .eq('service_id', selectedService.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)

      if (schedulesError) throw schedulesError

      if (!schedules || schedules.length === 0) {
        setTimeSlots([])
        return
      }

      // Buscar TODOS os agendamentos para a data selecionada (não apenas do serviço atual)
      const { data: allAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('appointment_time, service_id, services(duration)')
        .eq('appointment_date', selectedDate)
        .in('status', ['scheduled', 'confirmed'])

      if (appointmentsError) throw appointmentsError

      const bookedTimes = allAppointments?.filter(apt => apt.service_id === selectedService.id)
        .map(apt => apt.appointment_time) || []

      // Função auxiliar para converter horário em minutos
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.replace(':00', '').split(':').map(Number)
        return hours * 60 + minutes
      }

      // Função auxiliar para verificar conflitos de horário
      const hasTimeConflict = (slotStartMinutes: number, slotDuration: number) => {
        const slotEndMinutes = slotStartMinutes + slotDuration
        
        return allAppointments?.some(appointment => {
          if (!appointment.services || appointment.service_id === selectedService.id) return false
          
          const appointmentStartMinutes = timeToMinutes(appointment.appointment_time)
          const appointmentDuration = appointment.services.duration
          const appointmentEndMinutes = appointmentStartMinutes + appointmentDuration
          
          // Verificar se há sobreposição
          return (
            (slotStartMinutes < appointmentEndMinutes && slotEndMinutes > appointmentStartMinutes)
          )
        }) || false
      }

      // Gerar horários disponíveis baseados nas agendas
      const slots: TimeSlot[] = []
      const now = new Date()

      for (const schedule of schedules) {
        const startTime = schedule.start_time
        const endTime = schedule.end_time
        const slotDuration = schedule.slot_duration

        // Converter horários para minutos para facilitar o cálculo
        const [startHour, startMinute] = startTime.split(':').map(Number)
        const [endHour, endMinute] = endTime.split(':').map(Number)
        
        const startMinutes = startHour * 60 + startMinute
        const endMinutes = endHour * 60 + endMinute

        // Gerar slots baseados na duração configurada
        for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += slotDuration) {
          const hour = Math.floor(currentMinutes / 60)
          const minute = currentMinutes % 60
          
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
          const displayTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          
          // Verificar se o horário não está ocupado pelo mesmo serviço
          const isBooked = bookedTimes.includes(timeString)
          
          // Verificar se não é no passado (para hoje)
          const slotDateTime = new Date(`${selectedDate}T${timeString}`)
          const isPast = slotDateTime < now
          
          // Verificar se o slot completo cabe no horário da agenda
          const slotEndMinutes = currentMinutes + selectedService.duration
          const fitsInSchedule = slotEndMinutes <= endMinutes
          
          // Verificar conflitos com outros serviços
          const hasConflict = hasTimeConflict(currentMinutes, selectedService.duration)
          
          if (fitsInSchedule) {
            slots.push({
              time: displayTime,
              available: !isBooked && !isPast && !hasConflict
            })
          }
        }
      }

      // Remover duplicatas e ordenar
      const uniqueSlots = slots.filter((slot, index, self) => 
        index === self.findIndex(s => s.time === slot.time)
      ).sort((a, b) => a.time.localeCompare(b.time))

      setTimeSlots(uniqueSlots)
    } catch (err) {
      console.error('Erro ao gerar horários:', err)
      setError('Erro ao carregar horários disponíveis')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService || !selectedDate || !selectedTime || !user) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const appointmentData = {
        client_id: user.id,
        service_id: selectedService.id,
        appointment_date: selectedDate,
        appointment_time: `${selectedTime}:00`,
        status: 'scheduled' as const,
        notes: notes || null
      }

      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData])

      if (error) throw error

      setSuccess('Agendamento realizado com sucesso!')
      
      // Redirecionar para a página de agendamentos após 2 segundos
      setTimeout(() => {
        router.push('/agendamentos')
      }, 2000)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar agendamento')
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
    }
    return `${minutes}min`
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <ProtectedRoute requiredUserType="client">
      <Layout title="Novo Agendamento">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-black mb-2">Novo Agendamento</h1>
            <p className="text-gray-600">Escolha o serviço, data e horário para seu agendamento</p>
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

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Seleção de Serviço */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-black mb-4 flex items-center">
                <CurrencyDollarIcon className="h-6 w-6 mr-2 text-red-600" />
                Escolha o Serviço
              </h2>
              
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando serviços...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedService?.id === service.id
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-green-600 font-semibold">{formatPrice(service.price)}</span>
                            <span className="text-gray-500 text-sm">{formatDuration(service.duration)}</span>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedService?.id === service.id
                            ? 'bg-red-500 border-red-500'
                            : 'border-gray-300'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seleção de Data */}
            {selectedService && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-black mb-4 flex items-center">
                  <CalendarIcon className="h-6 w-6 mr-2 text-red-600" />
                  Escolha a Data
                </h2>
                
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedTime('') // Reset time when date changes
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-lg"
                  min={getTomorrowDate()}
                />
              </div>
            )}

            {/* Seleção de Horário */}
            {selectedService && selectedDate && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-black mb-4 flex items-center">
                  <ClockIcon className="h-6 w-6 mr-2 text-red-600" />
                  Escolha o Horário
                </h2>
                
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`p-3 rounded-md text-sm font-medium transition-all duration-200 ${
                        !slot.available
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : selectedTime === slot.time
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-red-100 hover:text-red-700'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
                
                {timeSlots.length === 0 && (
                  <div className="text-center py-8">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">
                      Não há agendas configuradas para este serviço neste dia da semana.
                    </p>
                    <p className="text-sm text-gray-400">
                      Entre em contato conosco para verificar a disponibilidade.
                    </p>
                  </div>
                )}
                
                {timeSlots.length > 0 && timeSlots.filter(slot => slot.available).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">
                      Todos os horários estão ocupados para esta data.
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Tente selecionar outra data.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Observações */}
            {selectedService && selectedDate && selectedTime && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Observações (opcional)
                </h2>
                
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  rows={4}
                  placeholder="Alguma observação especial para seu agendamento?"
                />
              </div>
            )}

            {/* Resumo e Confirmação */}
            {selectedService && selectedDate && selectedTime && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-black mb-4">
                  Resumo do Agendamento
                </h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Serviço:</span>
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Data:</span>
                    <span className="font-medium">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Horário:</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium">{formatDuration(selectedService.duration)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-gray-600 font-medium">Valor:</span>
                    <span className="font-bold text-green-600 text-lg">{formatPrice(selectedService.price)}</span>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-red-600 text-white py-4 px-6 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-semibold text-lg"
                >
                  {submitting ? 'Confirmando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            )}
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
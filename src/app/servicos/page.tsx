'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
  is_active: boolean
  created_at: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    is_active: true
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Cliente Supabase já importado

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setServices(data || [])
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
      setError('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const serviceData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
      is_active: formData.is_active
    }

    try {
      if (editingService) {
        // Atualizar serviço existente
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)

        if (error) throw error
        setSuccess('Serviço atualizado com sucesso!')
      } else {
        // Criar novo serviço
        const { error } = await supabase
          .from('services')
          .insert([serviceData])

        if (error) throw error
        setSuccess('Serviço criado com sucesso!')
      }

      setShowModal(false)
      setEditingService(null)
      setFormData({ name: '', description: '', price: '', duration: '', is_active: true })
      fetchServices()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar serviço')
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      is_active: service.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error
      setSuccess('Serviço excluído com sucesso!')
      fetchServices()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir serviço')
    }
  }

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId)

      if (error) throw error
      setSuccess(`Serviço ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`)
      fetchServices()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status do serviço')
    }
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  return (
    <ProtectedRoute requiredUserType="admin">
      <Layout title="Gestão de Serviços">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black">Serviços</h1>
              <p className="text-gray-600">Gerencie os serviços oferecidos</p>
            </div>
            <button
              onClick={() => {
                setEditingService(null)
                setFormData({ name: '', description: '', price: '', duration: '', is_active: true })
                setShowModal(true)
              }}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Novo Serviço
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar serviços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
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

          {/* Services Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando serviços...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-black">{service.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Preço:</span>
                      <span className="font-semibold text-green-600">{formatPrice(service.price)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Duração:</span>
                      <span className="font-medium text-gray-900">{formatDuration(service.duration)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Excluir"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => toggleServiceStatus(service.id, service.is_active)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${
                        service.is_active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {service.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredServices.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              Nenhum serviço encontrado.
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-black mb-4">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Serviço
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Ex: Corte de cabelo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    placeholder="Descreva o serviço oferecido"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                      placeholder="0,00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duração (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                      placeholder="60"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Serviço ativo
                  </label>
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
                    {editingService ? 'Atualizar' : 'Criar'}
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
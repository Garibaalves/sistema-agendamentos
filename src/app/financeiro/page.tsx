'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { PlusIcon, CurrencyDollarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

interface FinancialTransaction {
  id: string
  type: 'income' | 'expense'
  description: string
  amount: number
  payment_method: 'pix' | 'credit_card' | 'debit_card' | 'cash'
  category?: string
  transaction_date: string
  created_at: string
}

const paymentMethodLabels = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro'
}

const typeLabels = {
  income: 'Receita',
  expense: 'Despesa'
}

export default function FinanceiroPage() {
  const { user, userType } = useAuth()
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    description: '',
    amount: '',
    payment_method: 'pix' as 'pix' | 'credit_card' | 'debit_card' | 'cash',
    category: '',
    transaction_date: new Date().toISOString().split('T')[0]
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
      setMessage('Erro ao carregar transações financeiras')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description.trim() || !formData.amount) {
      setMessage('Por favor, preencha todos os campos obrigatórios')
      setMessageType('error')
      return
    }

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: user?.id,
          type: formData.type,
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
          payment_method: formData.payment_method,
          category: formData.category.trim() || null,
          transaction_date: formData.transaction_date
        })

      if (error) throw error

      setMessage(`${typeLabels[formData.type]} adicionada com sucesso!`)
      setMessageType('success')
      setShowForm(false)
      setFormData({
        type: 'income',
        description: '',
        amount: '',
        payment_method: 'pix',
        category: '',
        transaction_date: new Date().toISOString().split('T')[0]
      })
      fetchTransactions()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      setMessage('Erro ao salvar transação financeira')
      setMessageType('error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessage('Transação excluída com sucesso!')
      setMessageType('success')
      fetchTransactions()
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      setMessage('Erro ao excluir transação')
      setMessageType('error')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getTotalBalance = () => {
    return transactions.reduce((total, transaction) => {
      return transaction.type === 'income' 
        ? total + transaction.amount 
        : total - transaction.amount
    }, 0)
  }

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((total, t) => total + t.amount, 0)
  }

  const getTotalExpense = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((total, t) => total + t.amount, 0)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
              <p className="text-gray-600">Controle suas receitas e despesas</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Nova Transação
            </button>
          </div>

          {/* Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total de Receitas</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(getTotalIncome())}</p>
                </div>
                <ArrowUpIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Total de Despesas</p>
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(getTotalExpense())}</p>
                </div>
                <ArrowDownIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className={`p-6 rounded-lg border ${
              getTotalBalance() >= 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    getTotalBalance() >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}>Saldo Total</p>
                  <p className={`text-2xl font-bold ${
                    getTotalBalance() >= 0 ? 'text-blue-700' : 'text-orange-700'
                  }`}>{formatCurrency(getTotalBalance())}</p>
                </div>
                <CurrencyDollarIcon className={`h-8 w-8 ${
                  getTotalBalance() >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
              </div>
            </div>
          </div>

          {/* Mensagens */}
          {message && (
            <div className={`p-4 rounded-lg ${
              messageType === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Formulário */}
          {showForm && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nova Transação</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'income' | 'expense'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    >
                      <option value="income">Receita</option>
                      <option value="expense">Despesa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Método de Pagamento *
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({...formData, payment_method: e.target.value as 'cash' | 'card' | 'pix' | 'transfer'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    >
                      <option value="pix">PIX</option>
                      <option value="credit_card">Cartão de Crédito</option>
                      <option value="debit_card">Cartão de Débito</option>
                      <option value="cash">Dinheiro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Descreva a transação"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="0,00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Ex: Alimentação, Transporte"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data *
                    </label>
                    <input
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Salvar Transação
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Transações */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Transações Recentes</h2>
            </div>
            
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma transação encontrada</p>
                <p className="text-sm">Adicione sua primeira transação financeira</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {typeLabels[transaction.type]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.category || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {paymentMethodLabels[transaction.payment_method]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
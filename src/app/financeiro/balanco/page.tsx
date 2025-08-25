'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { CalendarIcon, ChartBarIcon, CurrencyDollarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

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

interface CategorySummary {
  category: string
  income: number
  expense: number
  total: number
}

interface PaymentMethodSummary {
  method: string
  income: number
  expense: number
  total: number
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

export default function BalancoPage() {
  const { user, userType } = useAuth()
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user, dateFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', dateFilter.startDate)
        .lte('transaction_date', dateFilter.endDate)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Erro ao buscar transações:', error)
      setMessage('Erro ao carregar dados do balanço')
      setMessageType('error')
    } finally {
      setLoading(false)
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

  const getCategorySummary = (): CategorySummary[] => {
    const categoryMap = new Map<string, CategorySummary>()

    transactions.forEach(transaction => {
      const category = transaction.category || 'Sem categoria'
      const existing = categoryMap.get(category) || {
        category,
        income: 0,
        expense: 0,
        total: 0
      }

      if (transaction.type === 'income') {
        existing.income += transaction.amount
      } else {
        existing.expense += transaction.amount
      }
      existing.total = existing.income - existing.expense

      categoryMap.set(category, existing)
    })

    return Array.from(categoryMap.values()).sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
  }

  const getPaymentMethodSummary = (): PaymentMethodSummary[] => {
    const methodMap = new Map<string, PaymentMethodSummary>()

    transactions.forEach(transaction => {
      const method = paymentMethodLabels[transaction.payment_method]
      const existing = methodMap.get(method) || {
        method,
        income: 0,
        expense: 0,
        total: 0
      }

      if (transaction.type === 'income') {
        existing.income += transaction.amount
      } else {
        existing.expense += transaction.amount
      }
      existing.total = existing.income - existing.expense

      methodMap.set(method, existing)
    })

    return Array.from(methodMap.values()).sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
  }

  const getQuickDateFilters = () => {
    const today = new Date()
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    const currentYear = new Date(today.getFullYear(), 0, 1)
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    return [
      {
        label: 'Últimos 30 dias',
        startDate: last30Days.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      },
      {
        label: 'Mês atual',
        startDate: currentMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      },
      {
        label: 'Mês passado',
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: lastMonthEnd.toISOString().split('T')[0]
      },
      {
        label: 'Ano atual',
        startDate: currentYear.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }
    ]
  }

  const applyQuickFilter = (startDate: string, endDate: string) => {
    setDateFilter({ startDate, endDate })
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
              <h1 className="text-2xl font-bold text-gray-900">Balanço Financeiro</h1>
              <p className="text-gray-600">Análise detalhada das suas finanças</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              {formatDate(dateFilter.startDate)} - {formatDate(dateFilter.endDate)}
            </div>
          </div>

          {/* Filtros de Data */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros de Período</h2>
            
            {/* Filtros Rápidos */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Períodos Rápidos:</p>
              <div className="flex flex-wrap gap-2">
                {getQuickDateFilters().map((filter, index) => (
                  <button
                    key={index}
                    onClick={() => applyQuickFilter(filter.startDate, filter.endDate)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro Personalizado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchTransactions}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Aplicar Filtro
                </button>
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

          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Total de Receitas</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(getTotalIncome())}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {transactions.filter(t => t.type === 'income').length} transações
                  </p>
                </div>
                <ArrowUpIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Total de Despesas</p>
                  <p className="text-2xl font-bold text-red-700">{formatCurrency(getTotalExpense())}</p>
                  <p className="text-xs text-red-600 mt-1">
                    {transactions.filter(t => t.type === 'expense').length} transações
                  </p>
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
                  }`}>Saldo do Período</p>
                  <p className={`text-2xl font-bold ${
                    getTotalBalance() >= 0 ? 'text-blue-700' : 'text-orange-700'
                  }`}>{formatCurrency(getTotalBalance())}</p>
                  <p className={`text-xs mt-1 ${
                    getTotalBalance() >= 0 ? 'text-blue-600' : 'text-orange-600'
                  }`}>
                    {transactions.length} transações totais
                  </p>
                </div>
                <CurrencyDollarIcon className={`h-8 w-8 ${
                  getTotalBalance() >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
              </div>
            </div>
          </div>

          {/* Análise por Categoria */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5" />
                Análise por Categoria
              </h2>
            </div>
            
            {getCategorySummary().length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Nenhuma transação encontrada no período selecionado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receitas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Despesas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getCategorySummary().map((category, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {category.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {category.income > 0 ? formatCurrency(category.income) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {category.expense > 0 ? formatCurrency(category.expense) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={category.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(category.total)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Análise por Método de Pagamento */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CurrencyDollarIcon className="h-5 w-5" />
                Análise por Método de Pagamento
              </h2>
            </div>
            
            {getPaymentMethodSummary().length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Nenhuma transação encontrada no período selecionado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método de Pagamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receitas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Despesas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaymentMethodSummary().map((method, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {method.method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {method.income > 0 ? formatCurrency(method.income) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {method.expense > 0 ? formatCurrency(method.expense) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={method.total >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(method.total)}
                          </span>
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
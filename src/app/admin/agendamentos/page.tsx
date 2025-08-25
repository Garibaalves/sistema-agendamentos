'use client'

import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function AdminSchedulesPage() {
  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Página Movida
            </h1>
            <p className="text-gray-600">
              A funcionalidade de gestão de agendamentos foi movida para uma nova página.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Nova Localização
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>A gestão de agendamentos agora está disponível em:</p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/gestao-agendamentos"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Ir para Gestão de Agendamentos
                    <ArrowRightIcon className="ml-2 -mr-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
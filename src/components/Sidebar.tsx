'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  CogIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface MenuItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
  clientOnly?: boolean
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Agendamentos',
    href: '/agendamentos',
    icon: CalendarIcon,
  },
  {
    name: 'Novo Agendamento',
    href: '/novo-agendamento',
    icon: PlusIcon,
  },
  {
    name: 'Gestão Financeira',
    href: '/financeiro',
    icon: CurrencyDollarIcon,
    adminOnly: true,
  },
  {
    name: 'Balanço Financeiro',
    href: '/financeiro/balanco',
    icon: ChartBarIcon,
    adminOnly: true,
  },
  {
    name: 'Gestão de Agendamentos',
    href: '/gestao-agendamentos',
    icon: CalendarIcon,
    adminOnly: true,
  },
  {
    name: 'Serviços',
    href: '/servicos',
    icon: ClipboardDocumentListIcon,
    adminOnly: true,
  },
  {
    name: 'Agendas',
    href: '/agendas',
    icon: CalendarIcon,
    adminOnly: true,
  },
  {
    name: 'Usuários',
    href: '/usuarios',
    icon: UsersIcon,
    adminOnly: true,
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: CogIcon,
    adminOnly: true,
  },
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const { signOut, profile } = useAuth()
  const { isAdmin, isClient } = usePermissions()

  const handleSignOut = async () => {
    await signOut()
  }

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false
    if (item.clientOnly && !isClient) return false
    return true
  })

  return (
    <>


      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-black transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          {
            'translate-x-0': isOpen,
            '-translate-x-full': !isOpen,
          }
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
            <div className="flex items-center space-x-3">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
                <h1 className="text-xl font-bold text-white">
                  MarllonFilms
                </h1>
              </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {profile?.user_type === 'admin' ? 'Administrador' : 'Cliente'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
                    {
                      'bg-red-600 text-white': isActive,
                      'text-gray-300 hover:bg-gray-800 hover:text-white': !isActive,
                    }
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon
                    className={clsx('mr-3 h-5 w-5', {
                      'text-white': isActive,
                      'text-gray-400': !isActive,
                    })}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-gray-800">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
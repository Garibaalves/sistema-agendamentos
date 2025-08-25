import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para uso no browser
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Cliente para uso no servidor
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Tipos para o banco de dados
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          address: string | null
          user_type: 'admin' | 'client'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          address?: string | null
          user_type?: 'admin' | 'client'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          address?: string | null
          user_type?: 'admin' | 'client'
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          duration: number
          price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration: number
          price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration?: number
          price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          client_id: string
          service_id: string
          appointment_date: string
          appointment_time: string
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
          notes: string | null
          service_price: number | null
          admin_notes: string | null
          completed_at: string | null
          payment_method: 'cash' | 'card' | 'pix' | 'transfer' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          service_id: string
          appointment_date: string
          appointment_time: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
          notes?: string | null
          service_price?: number | null
          admin_notes?: string | null
          completed_at?: string | null
          payment_method?: 'cash' | 'card' | 'pix' | 'transfer' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          service_id?: string
          appointment_date?: string
          appointment_time?: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
          notes?: string | null
          service_price?: number | null
          admin_notes?: string | null
          completed_at?: string | null
          payment_method?: 'cash' | 'card' | 'pix' | 'transfer' | null
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          service_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_duration: number
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_duration?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          slot_duration?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
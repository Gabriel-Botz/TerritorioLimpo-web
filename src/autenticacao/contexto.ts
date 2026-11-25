import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export interface ValorContextoSessao {
  carregando: boolean
  sessao: Session | null
  autenticado: boolean
  configurado: boolean
  entrar: (email: string, senha: string) => Promise<string | null>
  sair: () => Promise<void>
}

export const Contexto = createContext<ValorContextoSessao | null>(null)

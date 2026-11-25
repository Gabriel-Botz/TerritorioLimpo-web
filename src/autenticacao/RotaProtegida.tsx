import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { Carregando } from '../componentes/Carregando'
import { useSessao } from './useSessao'

/** Protege rotas /admin/**: sem sessão, manda para o login. A autorização
 *  real é da API (papel ADMIN) — o front só trata 401/403. */
export function RotaProtegida({ children }: { children: ReactNode }) {
  const { carregando, autenticado } = useSessao()

  if (carregando) return <Carregando texto="Verificando a sessão…" />
  if (!autenticado) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

import { useContext } from 'react'
import { Contexto, type ValorContextoSessao } from './contexto'

export function useSessao(): ValorContextoSessao {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useSessao precisa estar dentro de ProvedorSessao')
  return contexto
}

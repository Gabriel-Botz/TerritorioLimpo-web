import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { sufixoTitulo, titulosRotas } from './titulos'

function paraExpressao(padrao: string): RegExp {
  const corpo = padrao
    .split('/')
    .map((pedaco) => (pedaco.startsWith(':') ? '[^/]+' : pedaco.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/')
  return new RegExp(`^${corpo}/?$`)
}

function tituloParaCaminho(caminho: string): string {
  const direto = titulosRotas[caminho]
  if (direto) return direto
  const comPadrao = Object.entries(titulosRotas).find(
    ([padrao]) => padrao.includes(':') && paraExpressao(padrao).test(caminho),
  )
  return comPadrao ? comPadrao[1] : 'Página não encontrada'
}

/**
 * Define document.title a cada troca de rota e move o foco para o h1 da
 * nova página (WCAG 2.4.3 / 4.1.3), sem focar na carga inicial.
 */
export function GerenciadorTituloFoco() {
  const { pathname } = useLocation()
  const primeiraCarga = useRef(true)

  useEffect(() => {
    document.title = tituloParaCaminho(pathname) + sufixoTitulo
    if (primeiraCarga.current) {
      primeiraCarga.current = false
      return
    }
    document.querySelector<HTMLHeadingElement>('h1')?.focus()
  }, [pathname])

  return null
}

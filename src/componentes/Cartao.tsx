import type { ReactNode } from 'react'
import './Cartao.css'

interface PropsCartao {
  children: ReactNode
  className?: string
}

/** Bloco de conteúdo com fundo claro e cantos arredondados. */
export function Cartao({ children, className = '' }: PropsCartao) {
  return <div className={`cartao ${className}`.trim()}>{children}</div>
}

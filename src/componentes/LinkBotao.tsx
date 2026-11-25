import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import type { VarianteBotao } from './Botao'
import './Botao.css'

interface PropsLinkBotao {
  variante?: VarianteBotao
  ocuparLargura?: boolean
  className?: string
  children: ReactNode
  /** Rota interna (React Router). */
  to?: LinkProps['to']
  /** URL ou âncora externa. */
  href?: string
  /** Abre em nova aba com rel="noopener noreferrer". */
  destinoExterno?: boolean
}

/** Link com aparência de botão: `to` para rotas internas, `href` para âncoras. */
export function LinkBotao({
  variante = 'primario',
  ocuparLargura = false,
  className = '',
  children,
  to,
  href,
  destinoExterno = false,
}: PropsLinkBotao) {
  const classes = ['botao', `botao--${variante}`, ocuparLargura ? 'botao--largura' : '', className]
    .filter(Boolean)
    .join(' ')

  if (to !== undefined) {
    return (
      <Link className={classes} to={to}>
        {children}
      </Link>
    )
  }

  return (
    <a
      className={classes}
      href={href ?? '#'}
      {...(destinoExterno ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}

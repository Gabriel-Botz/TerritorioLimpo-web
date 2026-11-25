import type { ComponentPropsWithRef, ReactNode } from 'react'
import './Botao.css'

export type VarianteBotao = 'primario' | 'claro' | 'secundario' | 'contorno' | 'perigo'

interface PropsBotao extends ComponentPropsWithRef<'button'> {
  variante?: VarianteBotao
  carregando?: boolean
  ocuparLargura?: boolean
  children: ReactNode
}

export function Botao({
  variante = 'primario',
  carregando = false,
  ocuparLargura = false,
  className = '',
  disabled,
  children,
  ...demais
}: PropsBotao) {
  const classes = ['botao', `botao--${variante}`, ocuparLargura ? 'botao--largura' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...demais}
    >
      {children}
    </button>
  )
}

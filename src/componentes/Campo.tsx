import type { ReactNode } from 'react'
import './Campo.css'

interface PropsCampo {
  id: string
  rotulo: string
  dica?: string
  erro?: string | null
  /** Indica obrigatoriedade em texto (nunca só visual). */
  obrigatorio?: boolean
  /** Indica opcionalidade em texto. */
  opcional?: boolean
  /** Recebe os atributos de acessibilidade que devem ir no campo. */
  children: (props: {
    id: string
    'aria-describedby': string | undefined
    'aria-invalid': true | undefined
  }) => ReactNode
}

/** Rótulo + dica + erro ligados ao campo por aria-describedby. */
export function Campo({
  id,
  rotulo,
  dica,
  erro,
  obrigatorio = false,
  opcional = false,
  children,
}: PropsCampo) {
  const descricoes: string[] = []
  if (dica) descricoes.push(`${id}-dica`)
  if (erro) descricoes.push(`${id}-erro`)

  return (
    <div className={`campo${erro ? ' campo--erro' : ''}`}>
      <label className="campo__rotulo" htmlFor={id}>
        {rotulo}
        {obrigatorio && <span className="campo__marca"> (obrigatório)</span>}
        {opcional && <span className="campo__marca"> (opcional)</span>}
      </label>
      {dica && (
        <p className="campo__dica" id={`${id}-dica`}>
          {dica}
        </p>
      )}
      {children({
        id,
        'aria-describedby': descricoes.length > 0 ? descricoes.join(' ') : undefined,
        'aria-invalid': erro ? true : undefined,
      })}
      {erro && (
        <p className="campo__erro" id={`${id}-erro`}>
          {erro}
        </p>
      )}
    </div>
  )
}

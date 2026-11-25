import type { ReactNode } from 'react'
import './GrupoOpcoes.css'

interface PropsGrupoOpcoes {
  id: string
  legenda: string
  dica?: string
  erro?: string | null
  orientacao?: 'coluna' | 'linha'
  children: ReactNode
}

/** Grupo de escolhas (fieldset + legend), com dica e erro anunciados juntos. */
export function GrupoOpcoes({
  id,
  legenda,
  dica,
  erro,
  orientacao = 'coluna',
  children,
}: PropsGrupoOpcoes) {
  const descricoes: string[] = []
  if (dica) descricoes.push(`${id}-dica`)
  if (erro) descricoes.push(`${id}-erro`)

  return (
    <fieldset
      className="grupo-opcoes"
      aria-describedby={descricoes.length > 0 ? descricoes.join(' ') : undefined}
    >
      <legend className="grupo-opcoes__legenda">{legenda}</legend>
      {dica && (
        <p className="grupo-opcoes__dica" id={`${id}-dica`}>
          {dica}
        </p>
      )}
      <div className={`grupo-opcoes__lista grupo-opcoes__lista--${orientacao}`}>{children}</div>
      {erro && (
        <p className="grupo-opcoes__erro" id={`${id}-erro`}>
          {erro}
        </p>
      )}
    </fieldset>
  )
}

interface PropsOpcao {
  nome: string
  valor: string
  rotulo: string
  marcado: boolean
  aoMudar: () => void
  desabilitado?: boolean
}

/** Opção de escolha única dentro de um GrupoOpcoes. */
export function Opcao({ nome, valor, rotulo, marcado, aoMudar, desabilitado }: PropsOpcao) {
  return (
    <label className="opcao">
      <input
        type="radio"
        name={nome}
        value={valor}
        checked={marcado}
        onChange={aoMudar}
        disabled={desabilitado}
      />
      <span>{rotulo}</span>
    </label>
  )
}

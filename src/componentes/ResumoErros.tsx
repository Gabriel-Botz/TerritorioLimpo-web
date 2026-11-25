import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import './ResumoErros.css'

export interface ErroTela {
  /** id do campo de destino (ou do bloco). */
  id: string
  mensagem: string
}

interface PropsResumoErros {
  erros: ErroTela[]
  titulo?: string
  children?: ReactNode
}

/** Resumo de erros no topo do formulário: role="alert", foco automático
 *  e links que levam ao campo com problema. */
export function ResumoErros({ erros, titulo = 'Corrija os problemas encontrados' }: PropsResumoErros) {
  const referencia = useRef<HTMLDivElement>(null)
  const chave = erros.map((erro) => erro.id).join('|')

  useEffect(() => {
    if (chave) referencia.current?.focus()
  }, [chave])

  if (erros.length === 0) return null

  function irParaCampo(evento: MouseEvent<HTMLAnchorElement>, id: string) {
    const alvo = document.getElementById(id)
    if (!alvo) return
    evento.preventDefault()
    alvo.focus()
  }

  return (
    <div className="resumo-erros" role="alert" tabIndex={-1} ref={referencia}>
      <h2 className="resumo-erros__titulo">
        <TriangleAlert size={20} aria-hidden="true" />
        {titulo}
      </h2>
      <ul>
        {erros.map((erro) => (
          <li key={erro.id}>
            <a href={`#${erro.id}`} onClick={(evento) => irParaCampo(evento, erro.id)}>
              {erro.mensagem}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Botao } from './Botao'
import './Dialogo.css'

interface PropsDialogo {
  aberto: boolean
  aoFechar: () => void
  aoConfirmar: () => void
  titulo: string
  children: ReactNode
  textoConfirmar?: string
  textoCancelar?: string
  perigo?: boolean
}

/** Diálogo de confirmação sobre <dialog> nativo: foco ao abrir (no botão
 *  seguro), Esc cancela e o foco volta ao elemento que o abriu. */
export function Dialogo({
  aberto,
  aoFechar,
  aoConfirmar,
  titulo,
  children,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  perigo = false,
}: PropsDialogo) {
  const idTitulo = useId()
  const referencia = useRef<HTMLDialogElement>(null)
  const botaoCancelar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialogo = referencia.current
    if (!dialogo) return
    if (aberto && !dialogo.open) {
      dialogo.showModal()
      botaoCancelar.current?.focus()
    } else if (!aberto && dialogo.open) {
      dialogo.close()
    }
  }, [aberto])

  return (
    <dialog className="dialogo" ref={referencia} aria-labelledby={idTitulo} onCancel={aoFechar}>
      <h2 className="dialogo__titulo" id={idTitulo}>
        {titulo}
      </h2>
      <div className="dialogo__conteudo">{children}</div>
      <div className="dialogo__acoes">
        <Botao ref={botaoCancelar} variante="contorno" onClick={aoFechar}>
          {textoCancelar}
        </Botao>
        <Botao variante={perigo ? 'perigo' : 'primario'} onClick={aoConfirmar}>
          {textoConfirmar}
        </Botao>
      </div>
    </dialog>
  )
}

import type { ReactNode } from 'react'
import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import './Alerta.css'

type TipoAlerta = 'info' | 'sucesso' | 'aviso' | 'erro'

const icones: Record<TipoAlerta, typeof Info> = {
  info: Info,
  sucesso: CircleCheck,
  aviso: TriangleAlert,
  erro: TriangleAlert,
}

interface PropsAlerta {
  tipo?: TipoAlerta
  titulo?: string
  /** `alert` para erros; `status` para demais mensagens (padrão). */
  papel?: 'status' | 'alert'
  children: ReactNode
}

/** Mensagem em destaque. O texto nunca desaparece sozinho. */
export function Alerta({ tipo = 'info', titulo, papel, children }: PropsAlerta) {
  const Icone = icones[tipo]
  const papelFinal = papel ?? (tipo === 'erro' ? 'alert' : 'status')
  return (
    <div className={`alerta alerta--${tipo}`} role={papelFinal}>
      <Icone size={20} aria-hidden="true" className="alerta__icone" />
      <div className="alerta__corpo">
        {titulo && <strong className="alerta__titulo">{titulo}</strong>}
        <div>{children}</div>
      </div>
    </div>
  )
}

import { Check, Clock, Inbox, Search, Send, X } from 'lucide-react'
import type { Situacao } from '../tipos'
import { rotulosSituacao } from '../util/rotulos'
import './Emblemas.css'

const icones: Record<Situacao, typeof Inbox> = {
  RECEBIDA: Inbox,
  EM_ANALISE: Search,
  ENCAMINHADA: Send,
  AGUARDANDO_ATENDIMENTO: Clock,
  RESOLVIDA: Check,
  NAO_SOLUCIONADA: X,
}

/** Emblema da situação: ícone + rótulo exato + cor de apoio (nunca só cor). */
export function EmblemaStatus({ situacao }: { situacao: Situacao }) {
  const Icone = icones[situacao]
  const classe = situacao.toLowerCase().replace(/_/g, '-')
  return (
    <span className={`emblema emblema--${classe}`}>
      <Icone size={16} aria-hidden="true" />
      {rotulosSituacao[situacao]}
    </span>
  )
}

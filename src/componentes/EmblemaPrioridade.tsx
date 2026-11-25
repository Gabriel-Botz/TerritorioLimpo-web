import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { Prioridade } from '../tipos'
import { rotulosPrioridade } from '../util/rotulos'
import './Emblemas.css'

const icones: Record<Prioridade, typeof ArrowUp> = {
  BAIXA: ArrowDown,
  MEDIA: Minus,
  ALTA: ArrowUp,
}

/** Emblema da prioridade: ícone + rótulo + cor de apoio (nunca só cor). */
export function EmblemaPrioridade({ prioridade }: { prioridade: Prioridade }) {
  const Icone = icones[prioridade]
  const classe = prioridade.toLowerCase()
  return (
    <span className={`emblema emblema--${classe}`}>
      <Icone size={16} aria-hidden="true" />
      {rotulosPrioridade[prioridade]}
    </span>
  )
}

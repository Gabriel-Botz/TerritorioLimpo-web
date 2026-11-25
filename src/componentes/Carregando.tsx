import './Carregando.css'

interface PropsCarregando {
  texto?: string
}

/** Estado de carregamento anunciado por leitores de tela (sem depender de spinner). */
export function Carregando({ texto = 'Carregando…' }: PropsCarregando) {
  return (
    <p className="carregando" role="status">
      {texto}
    </p>
  )
}

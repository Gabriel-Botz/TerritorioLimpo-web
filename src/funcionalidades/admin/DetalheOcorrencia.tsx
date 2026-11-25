import { useParams } from 'react-router'

/** Detalhe da ocorrência — implementado na Fase 5. */
export function DetalheOcorrencia() {
  const { id } = useParams()
  return (
    <article>
      <h1>Ocorrência</h1>
      <p>O detalhe será implementado na Fase 5. (id: {id})</p>
    </article>
  )
}

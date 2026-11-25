import { LinkBotao } from '../componentes/LinkBotao'

/** Rota não encontrada. */
export function NaoEncontrada() {
  return (
    <article>
      <h1>Página não encontrada</h1>
      <p>O endereço acessado não existe ou foi movido.</p>
      <LinkBotao to="/">Voltar ao início</LinkBotao>
    </article>
  )
}

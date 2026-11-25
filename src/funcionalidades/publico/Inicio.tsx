import { LinkBotao } from '../../componentes/LinkBotao'

/** Home pública — conteúdo completo será implementado na Fase 1. */
export function Inicio() {
  return (
    <article>
      <h1>Território Limpo</h1>
      <p>Registre pontos de descarte irregular de lixo e entulho na ESF Estrada da Saudade 1.</p>
      <LinkBotao to="/registrar">Registrar um ponto</LinkBotao>
    </article>
  )
}

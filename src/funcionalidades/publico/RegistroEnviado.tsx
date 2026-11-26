import { useLocation } from 'react-router'
import { Alerta } from '../../componentes/Alerta'
import { LinkBotao } from '../../componentes/LinkBotao'
import { formatarDataHora } from '../../util/formatacao'
import { instituicao } from '../../util/instituicao'
import { formatarProtocolo } from '../../util/protocolo'
import type { ResultadoRegistro } from '../../tipos'
import './RegistroEnviado.css'

/** Confirmação após o envio (API-FRONT §7.3): recebe o resultado por estado. */
export function RegistroEnviado() {
  const local = useLocation()
  const resultado = local.state as ResultadoRegistro | null

  if (!resultado || typeof resultado.numero !== 'number') {
    return (
      <article className="enviado">
        <h1>Registro não encontrado</h1>
        <Alerta tipo="info">
          Não encontramos os dados de um registro nesta tela. Se você acabou de
          registrar um ponto, anote o número que apareceu na confirmação.
        </Alerta>
        <div className="enviado__botoes">
          <LinkBotao to="/">Voltar ao início</LinkBotao>
        </div>
      </article>
    )
  }

  const falhas = resultado.fotos.falhas

  return (
    <article className="enviado">
      <h1>Registro enviado</h1>

      <p className="enviado__protocolo">
        <strong>Nº do registro {formatarProtocolo(resultado.numero)}</strong>
      </p>

      <dl className="enviado__dados">
        <div>
          <dt>Data e hora</dt>
          <dd>{formatarDataHora(resultado.criadoEm)}</dd>
        </div>
        <div>
          <dt>Local</dt>
          <dd>{resultado.resumoLocalizacao}</dd>
        </div>
      </dl>

      <Alerta tipo="info">{resultado.mensagem}</Alerta>

      {falhas > 0 && (
        <Alerta tipo="aviso" titulo="Fotos não salvas">
          {falhas === 1
            ? 'Uma foto não pôde ser salva, mas o registro foi recebido.'
            : `${falhas} fotos não puderam ser salvas, mas o registro foi recebido.`}
        </Alerta>
      )}

      <p className="enviado__orientacao">
        <strong>Anote o número do registro.</strong>
      </p>

      <div className="enviado__botoes">
        <LinkBotao to="/registrar">Fazer outro registro</LinkBotao>
        <LinkBotao variante="contorno" to="/">
          Voltar ao início
        </LinkBotao>
      </div>

      <p className="enviado__nota">{instituicao.avisoEmergencia}</p>
    </article>
  )
}

import { coordenadaValida, LIMITES } from '../../util/validacao'
import { formatarCoordenada } from '../../util/formatacao'
import {
  rotulosAcesso,
  rotulosDrenagem,
  rotulosTipoResiduo,
  rotulosVolume,
} from '../../util/rotulos'
import type { RascunhoRegistro } from '../../tipos'
import './Registrar.css'

interface PropsRevisao {
  rascunho: RascunhoRegistro
}

/** Revisão antes do envio: todos os dados em lista de definição (§7.2). */
export function RevisaoRegistro({ rascunho }: PropsRevisao) {
  const partes: string[] = []
  if (coordenadaValida(rascunho.latitude, rascunho.longitude)) {
    const precisao =
      rascunho.precisaoMetros !== null && Number.isFinite(rascunho.precisaoMetros)
        ? ` (precisão de aproximadamente ${Math.round(rascunho.precisaoMetros)} metros)`
        : ''
    partes.push(
      `Coordenadas do GPS: ${formatarCoordenada(rascunho.latitude ?? 0)}, ${formatarCoordenada(rascunho.longitude ?? 0)}${precisao}`,
    )
  }
  if (rascunho.endereco.trim()) partes.push(`Rua e número: ${rascunho.endereco.trim()}`)
  if (rascunho.pontoReferencia.trim()) {
    partes.push(`Ponto de referência: ${rascunho.pontoReferencia.trim()}`)
  }

  return (
    <div className="revisao">
      <h2 className="revisao__titulo">
        <span className="registro__num" aria-hidden="true">
          8
        </span>
        Revise antes de enviar
      </h2>
      <p className="revisao__dica">
        Se algo estiver errado, volte e corrija. Nada é enviado até você confirmar.
      </p>

      <dl className="revisao__lista">
        <div className="revisao__item">
          <dt>Fotos</dt>
          <dd>
            {rascunho.fotos.length === 0 ? (
              'Nenhuma foto.'
            ) : (
              <ul className="revisao__fotos">
                {rascunho.fotos.map((foto, indice) => (
                  <li key={foto.id}>
                    {foto.preview !== '' && (
                      <img
                        src={foto.preview}
                        alt={`Foto ${indice + 1} selecionada`}
                        width={72}
                        height={72}
                        className="registro__miniatura-img"
                      />
                    )}
                    <span>Foto {indice + 1}</span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>

        <div className="revisao__item">
          <dt>Localização</dt>
          <dd>{partes.length > 0 ? partes.join('; ') : 'Não informada.'}</dd>
        </div>

        <div className="revisao__item">
          <dt>Tipo de resíduo</dt>
          <dd>{rascunho.tipoResiduo ? rotulosTipoResiduo[rascunho.tipoResiduo] : '—'}</dd>
        </div>

        <div className="revisao__item">
          <dt>Volume aproximado</dt>
          <dd>{rascunho.volume ? rotulosVolume[rascunho.volume] : '—'}</dd>
        </div>

        <div className="revisao__item">
          <dt>Acesso para o caminhão</dt>
          <dd>{rascunho.acesso ? rotulosAcesso[rascunho.acesso] : '—'}</dd>
        </div>

        <div className="revisao__item">
          <dt>Há bueiro entupido ou água acumulada?</dt>
          <dd>{rascunho.drenagem ? rotulosDrenagem[rascunho.drenagem] : '—'}</dd>
        </div>

        <div className="revisao__item">
          <dt>Observações</dt>
          <dd>
            {rascunho.observacoes.trim()
              ? rascunho.observacoes.trim()
              : 'Nenhuma observação.'}
          </dd>
        </div>
      </dl>

      <p className="revisao__dica">
        Limite de {LIMITES.fotos} fotos e {LIMITES.observacoes} caracteres nas
        observações.
      </p>
    </div>
  )
}

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { ArrowLeft, Camera, MapPin, Trash2 } from 'lucide-react'
import { Alerta } from '../../componentes/Alerta'
import { Botao } from '../../componentes/Botao'
import { Campo } from '../../componentes/Campo'
import { GrupoOpcoes, Opcao } from '../../componentes/GrupoOpcoes'
import { ResumoErros, type ErroTela } from '../../componentes/ResumoErros'
import { ErroApi } from '../../api/http'
import { enviarRegistro } from '../../api/registro'
import {
  acessosCaminhao,
  rascunhoInicial,
  situacoesDrenagem,
  tiposResiduo,
  volumesResiduo,
  type FotoRascunho,
  type NovaOcorrencia,
  type RascunhoRegistro,
} from '../../tipos'
import { errosDaApiParaTela } from '../../util/erros'
import { minutosDeEspera } from '../../util/formatacao'
import { ACEITADOS, comprimirFoto, recusarFoto } from '../../util/fotos'
import { ErroGps, obterCoordenadas, type EstadoGps } from '../../util/gps'
import { escolherChave, type MemoriaIdempotencia } from '../../util/idempotencia'
import { instituicao } from '../../util/instituicao'
import {
  rotulosAcesso,
  rotulosDrenagem,
  rotulosTipoResiduo,
  rotulosVolume,
} from '../../util/rotulos'
import { LIMITES, validarRascunho } from '../../util/validacao'
import { RevisaoRegistro } from './RevisaoRegistro'
import './Registrar.css'

interface AvisoEnvio {
  texto: string
  tipo: 'erro' | 'aviso'
}

/** miniatura ausente quando o navegador não oferece object URL. */
function criarPreview(arquivo: File): string {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return ''
  return URL.createObjectURL(arquivo)
}

function revogarPreview(preview: string): void {
  if (preview !== '' && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(preview)
  }
}

/** Formulário público de registro (API-FRONT §7.2) com etapa de revisão. */
export function RegistrarOcorrencia() {
  const [rascunho, setRascunho] = useState<RascunhoRegistro>(rascunhoInicial)
  const [etapa, setEtapa] = useState<'formulario' | 'revisao'>('formulario')
  const [erros, setErros] = useState<ErroTela[]>([])
  const [avisoEnvio, setAvisoEnvio] = useState<AvisoEnvio | null>(null)
  const [bloqueioMinutos, setBloqueioMinutos] = useState<number | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erroFoto, setErroFoto] = useState<string | null>(null)
  const [estadoGps, setEstadoGps] = useState<EstadoGps>('inicial')
  const [tokenTurnstile, setTokenTurnstile] = useState<string | null>(null)

  const memoriaIdempotencia = useRef<MemoriaIdempotencia | null>(null)
  const turnstileRef = useRef<TurnstileInstance | undefined>(null)
  const previewsRef = useRef<string[]>([])

  const navegar = useNavigate()
  const chaveSite = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''
  const turnstilePendente = chaveSite !== '' && tokenTurnstile === null

  // Libera as miniaturas ao desmontar (URL.createObjectURL exige revogação).
  useEffect(() => {
    const urls = previewsRef.current
    return () => {
      for (const preview of urls) revogarPreview(preview)
    }
  }, [])

  // 429: libera o botão de envio quando a espera indicada termina.
  useEffect(() => {
    if (bloqueioMinutos === null) return
    const temporizador = setTimeout(() => {
      setBloqueioMinutos(null)
      setAvisoEnvio(null)
    }, bloqueioMinutos * 60_000)
    return () => clearTimeout(temporizador)
  }, [bloqueioMinutos])

  function erroDe(id: string): string | null {
    return erros.find((erro) => erro.id === id)?.mensagem ?? null
  }

  /** Atualiza o rascunho e limpa os erros dos campos tocados. */
  function atualizar(parcial: Partial<RascunhoRegistro>, ...idsErro: string[]) {
    setRascunho((anterior) => ({ ...anterior, ...parcial }))
    if (idsErro.length > 0) {
      setErros((anteriores) =>
        anteriores.filter((erro) => !idsErro.includes(erro.id)),
      )
    }
  }

  async function aoEscolherFotos(evento: ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(evento.target.files ?? [])
    evento.target.value = ''
    setErroFoto(null)

    const novas: FotoRascunho[] = []
    for (const arquivo of arquivos) {
      const recusa = recusarFoto(arquivo, rascunho.fotos.length + novas.length)
      if (recusa) {
        setErroFoto(recusa)
        continue
      }
      const processado = await comprimirFoto(arquivo)
      const preview = criarPreview(processado)
      previewsRef.current.push(preview)
      novas.push({ id: crypto.randomUUID(), arquivo: processado, preview })
    }

    if (novas.length > 0) {
      atualizar({ fotos: [...rascunho.fotos, ...novas] }, 'registro-fotos')
    }
  }

  function removerFoto(id: string) {
    const alvo = rascunho.fotos.find((foto) => foto.id === id)
    if (alvo) revogarPreview(alvo.preview)
    atualizar(
      { fotos: rascunho.fotos.filter((foto) => foto.id !== id) },
      'registro-fotos',
    )
    setErroFoto(null)
  }

  async function usarGps() {
    setEstadoGps('buscando')
    try {
      const coordenadas = await obterCoordenadas()
      atualizar(
        {
          latitude: coordenadas.latitude,
          longitude: coordenadas.longitude,
          precisaoMetros: coordenadas.precisaoMetros,
        },
        'registro-localizacao',
      )
      setEstadoGps('obtida')
    } catch (falha) {
      setEstadoGps(falha instanceof ErroGps ? falha.estado : 'indisponivel')
    }
  }

  function removerLocalizacao() {
    atualizar(
      { latitude: null, longitude: null, precisaoMetros: null },
      'registro-localizacao',
    )
    setEstadoGps('inicial')
  }

  function aoRevisar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (etapa !== 'formulario') return
    setAvisoEnvio(null)
    const encontrados = validarRascunho(rascunho)
    setErros(encontrados)
    if (encontrados.length === 0) setEtapa('revisao')
  }

  function aoCorrigir() {
    setEtapa('formulario')
    setErros([])
    setAvisoEnvio(null)
  }

  /** Token do Turnstile é de uso único: reinicia após qualquer falha. */
  function reiniciarTurnstile() {
    setTokenTurnstile(null)
    try {
      turnstileRef.current?.reset()
    } catch {
      // Widget já desmontado ou sem script: o próximo carregamento pede novo token.
    }
  }

  function tratarFalhaEnvio(falha: unknown) {
    reiniciarTurnstile()

    if (!(falha instanceof ErroApi)) {
      setAvisoEnvio({
        texto: 'Não foi possível concluir. Tente novamente.',
        tipo: 'erro',
      })
      return
    }

    switch (falha.status) {
      case 400: {
        const daApi = falha.erros.length > 0 ? errosDaApiParaTela(falha.erros) : []
        setErros(
          daApi.length > 0
            ? daApi
            : [{ id: 'registro-geral', mensagem: falha.detalhe }],
        )
        setEtapa('formulario')
        return
      }
      case 409:
        setAvisoEnvio({ texto: falha.detalhe, tipo: 'aviso' })
        return
      case 413:
        setAvisoEnvio({
          texto: 'A foto é grande demais. O limite é 5 MB.',
          tipo: 'erro',
        })
        return
      case 422:
        setAvisoEnvio({ texto: falha.detalhe, tipo: 'erro' })
        return
      case 429: {
        const minutos =
          falha.esperarSegundos !== null ? minutosDeEspera(falha.esperarSegundos) : 1
        setBloqueioMinutos(minutos)
        setAvisoEnvio({
          texto: `Você fez muitos envios em pouco tempo. Tente novamente em cerca de ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.`,
          tipo: 'aviso',
        })
        return
      }
      case 500:
        setAvisoEnvio({
          texto: `Não foi possível concluir. Tente novamente.${falha.idCorrelacao ? ` Código para suporte: ${falha.idCorrelacao}` : ''}`,
          tipo: 'erro',
        })
        return
      case 503:
        setAvisoEnvio({
          texto: 'O serviço está indisponível no momento. Tente novamente em instantes.',
          tipo: 'erro',
        })
        return
      default:
        setAvisoEnvio({ texto: falha.detalhe, tipo: 'erro' })
    }
  }

  async function aoEnviar() {
    const { tipoResiduo, volume, acesso, drenagem } = rascunho
    if (!tipoResiduo || !volume || !acesso || !drenagem) {
      setErros(validarRascunho(rascunho))
      setEtapa('formulario')
      return
    }

    setEnviando(true)
    setAvisoEnvio(null)
    try {
      const conteudo: NovaOcorrencia = {
        tipoResiduo,
        volume,
        acesso,
        drenagem,
        observacoes: rascunho.observacoes.trim() || null,
        latitude: rascunho.latitude,
        longitude: rascunho.longitude,
        precisaoMetros: rascunho.precisaoMetros,
        endereco: rascunho.endereco.trim() || null,
        pontoReferencia: rascunho.pontoReferencia.trim() || null,
      }

      // Uma chave por conteúdo: reenvio idêntico reutiliza; alteração gera nova.
      const memoria = escolherChave(memoriaIdempotencia.current, rascunho)
      memoriaIdempotencia.current = memoria

      const resultado = await enviarRegistro({
        conteudo,
        fotos: rascunho.fotos.map((foto) => foto.arquivo),
        chaveIdempotencia: memoria.chave,
        tokenTurnstile,
      })

      navegar('/registro-enviado', { state: resultado })
    } catch (falha) {
      tratarFalhaEnvio(falha)
    } finally {
      setEnviando(false)
    }
  }

  const erroLocalizacao = erroDe('registro-localizacao')
  const erroBlocoFotos = erroDe('registro-fotos')

  const descricoesFotos = [
    'registro-fotos-dica',
    erroFoto ? 'registro-fotos-erro' : null,
  ]
    .filter((id): id is string => id !== null)
    .join(' ')

  const precisaoGps =
    rascunho.precisaoMetros !== null && Number.isFinite(rascunho.precisaoMetros)
      ? Math.round(rascunho.precisaoMetros)
      : null

  return (
    <article className="registro">
      <Link to="/" className="registro__voltar">
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar para o início
      </Link>

      <h1>Registrar ponto de descarte</h1>
      {etapa === 'formulario' && (
        <p className="registro__subtitulo">
          Preencha as informações abaixo para registrar o local.
        </p>
      )}
      <Alerta tipo="info">{instituicao.frasePrivacidade}</Alerta>

      <form
        id="registro-geral"
        tabIndex={-1}
        onSubmit={aoRevisar}
        noValidate
        className="registro__form"
      >
        {etapa === 'formulario' ? (
          <>
            <ResumoErros erros={erros} />

            {/* 1. Fotos */}
            <section
              className="registro__bloco"
              id="registro-fotos"
              tabIndex={-1}
              aria-describedby={
                erroBlocoFotos !== null ? 'registro-fotos-bloco-erro' : undefined
              }
            >
              <h2 className="registro__bloco-titulo">
                <span className="registro__num" aria-hidden="true">
                  1
                </span>
                Foto do local <span className="registro__marca">(opcional)</span>
              </h2>
              <p className="campo__dica" id="registro-fotos-dica">
                Até {LIMITES.fotos} fotos em JPEG ou PNG, de até {LIMITES.fotoMb} MB
                cada. A imagem é reduzida antes do envio.
              </p>
              {erroBlocoFotos !== null && (
                <p className="campo__erro" id="registro-fotos-bloco-erro">
                  {erroBlocoFotos}
                </p>
              )}
              <input
                className="registro__input-oculto"
                type="file"
                accept={ACEITADOS}
                multiple
                id="registro-fotos-input"
                aria-describedby={descricoesFotos || undefined}
                aria-invalid={erroFoto !== null || erroDe('registro-fotos') !== null || undefined}
                onChange={aoEscolherFotos}
              />
              <label className="registro__fotos-area" htmlFor="registro-fotos-input">
                <Camera size={28} aria-hidden="true" className="registro__fotos-icone" />
                <span className="registro__fotos-titulo">Escolher fotos</span>
                <span className="registro__fotos-dica">
                  Abre a câmera ou a galeria no celular
                </span>
              </label>
              {erroFoto && (
                <p className="campo__erro" id="registro-fotos-erro">
                  {erroFoto}
                </p>
              )}
              {rascunho.fotos.length > 0 && (
                <ul className="registro__miniaturas">
                  {rascunho.fotos.map((foto, indice) => (
                    <li key={foto.id} className="registro__miniatura">
                      {foto.preview !== '' && (
                        <img
                          src={foto.preview}
                          alt=""
                          width={72}
                          height={72}
                          className="registro__miniatura-img"
                        />
                      )}
                      <Botao
                        variante="contorno"
                        type="button"
                        onClick={() => removerFoto(foto.id)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        Remover foto {indice + 1}
                      </Botao>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* 2. Localização */}
            <section
              className="registro__bloco"
              id="registro-localizacao"
              tabIndex={-1}
              aria-describedby={
                erroLocalizacao !== null ? 'registro-localizacao-erro' : undefined
              }
            >
              <h2 className="registro__bloco-titulo">
                <span className="registro__num" aria-hidden="true">
                  2
                </span>
                Localização
              </h2>
              <p className="campo__dica">
                Informe ao menos uma forma: GPS, rua e número ou ponto de referência.
              </p>
              {erroLocalizacao !== null && (
                <p className="campo__erro" id="registro-localizacao-erro">
                  {erroLocalizacao}
                </p>
              )}

              <div className="registro__gps">
                <p className="campo__dica" id="registro-gps-explicacao">
                  Usamos sua localização apenas para indicar onde está o ponto de
                  descarte.
                </p>
                <Botao
                  variante="secundario"
                  type="button"
                  onClick={usarGps}
                  disabled={estadoGps === 'buscando'}
                  aria-describedby="registro-gps-explicacao"
                >
                  <MapPin size={18} aria-hidden="true" />
                  {estadoGps === 'buscando'
                    ? 'Buscando sua localização…'
                    : 'Usar minha localização (GPS)'}
                </Botao>

                <div className="registro__gps-status" aria-live="polite">
                  {estadoGps === 'buscando' && (
                    <p>Buscando sua localização…</p>
                  )}
                  {estadoGps === 'obtida' && (
                    <>
                      <p>
                        Localização obtida
                        {precisaoGps !== null
                          ? `, com precisão aproximada de ${precisaoGps} metros`
                          : ''}
                        .
                      </p>
                      <Botao variante="contorno" type="button" onClick={removerLocalizacao}>
                        Remover localização
                      </Botao>
                    </>
                  )}
                  {estadoGps === 'negada' && (
                    <p>
                      Não foi possível usar o GPS porque a permissão foi negada.
                      Sem problema: escreva o endereço ou um ponto de referência.
                    </p>
                  )}
                  {estadoGps === 'indisponivel' && (
                    <p>
                      Não foi possível usar o GPS agora. Sem problema: escreva o
                      endereço ou um ponto de referência.
                    </p>
                  )}
                </div>
              </div>

              <Campo
                id="registro-endereco"
                rotulo="Rua e número"
                opcional
                dica={`${rascunho.endereco.length} de ${LIMITES.endereco} caracteres`}
                erro={erroDe('registro-endereco')}
              >
                {(props) => (
                  <input
                    type="text"
                    maxLength={LIMITES.endereco}
                    autoComplete="street-address"
                    {...props}
                    value={rascunho.endereco}
                    onChange={(evento) =>
                      atualizar(
                        { endereco: evento.target.value },
                        'registro-endereco',
                        'registro-localizacao',
                      )
                    }
                  />
                )}
              </Campo>

              <Campo
                id="registro-referencia"
                rotulo="Ponto de referência"
                opcional
                dica={`${rascunho.pontoReferencia.length} de ${LIMITES.referencia} caracteres`}
                erro={erroDe('registro-referencia')}
              >
                {(props) => (
                  <input
                    type="text"
                    maxLength={LIMITES.referencia}
                    {...props}
                    value={rascunho.pontoReferencia}
                    onChange={(evento) =>
                      atualizar(
                        { pontoReferencia: evento.target.value },
                        'registro-referencia',
                        'registro-localizacao',
                      )
                    }
                  />
                )}
              </Campo>
            </section>

            {/* 3. Tipo de resíduo */}
            <div className="registro__grupo" id="registro-tipo" tabIndex={-1}>
              <GrupoOpcoes
                id="registro-tipo"
                legenda="Tipo de resíduo"
                erro={erroDe('registro-tipo')}
              >
                {tiposResiduo.map((valor) => (
                  <Opcao
                    key={valor}
                    nome="registro-tipo"
                    valor={valor}
                    rotulo={rotulosTipoResiduo[valor]}
                    marcado={rascunho.tipoResiduo === valor}
                    aoMudar={() => atualizar({ tipoResiduo: valor }, 'registro-tipo')}
                  />
                ))}
              </GrupoOpcoes>
            </div>

            {/* 4. Volume */}
            <div className="registro__grupo" id="registro-volume" tabIndex={-1}>
              <GrupoOpcoes
                id="registro-volume"
                legenda="Volume aproximado"
                erro={erroDe('registro-volume')}
              >
                {volumesResiduo.map((valor) => (
                  <Opcao
                    key={valor}
                    nome="registro-volume"
                    valor={valor}
                    rotulo={rotulosVolume[valor]}
                    marcado={rascunho.volume === valor}
                    aoMudar={() => atualizar({ volume: valor }, 'registro-volume')}
                  />
                ))}
              </GrupoOpcoes>
            </div>

            {/* 5. Acesso para o caminhão */}
            <div className="registro__grupo" id="registro-acesso" tabIndex={-1}>
              <GrupoOpcoes
                id="registro-acesso"
                legenda="Acesso para o caminhão"
                erro={erroDe('registro-acesso')}
              >
                {acessosCaminhao.map((valor) => (
                  <Opcao
                    key={valor}
                    nome="registro-acesso"
                    valor={valor}
                    rotulo={rotulosAcesso[valor]}
                    marcado={rascunho.acesso === valor}
                    aoMudar={() => atualizar({ acesso: valor }, 'registro-acesso')}
                  />
                ))}
              </GrupoOpcoes>
            </div>

            {/* 6. Drenagem */}
            <div className="registro__grupo" id="registro-drenagem" tabIndex={-1}>
              <GrupoOpcoes
                id="registro-drenagem"
                legenda="Há bueiro entupido ou água acumulada?"
                erro={erroDe('registro-drenagem')}
              >
                {situacoesDrenagem.map((valor) => (
                  <Opcao
                    key={valor}
                    nome="registro-drenagem"
                    valor={valor}
                    rotulo={rotulosDrenagem[valor]}
                    marcado={rascunho.drenagem === valor}
                    aoMudar={() => atualizar({ drenagem: valor }, 'registro-drenagem')}
                  />
                ))}
              </GrupoOpcoes>
            </div>

            {/* 7. Observações */}
            <div className="registro__bloco">
              <Campo
                id="registro-observacoes"
                rotulo="Observações"
                opcional
                dica={`${rascunho.observacoes.length} de ${LIMITES.observacoes} caracteres`}
                erro={erroDe('registro-observacoes')}
              >
                {(props) => (
                  <textarea
                    rows={4}
                    maxLength={LIMITES.observacoes}
                    {...props}
                    value={rascunho.observacoes}
                    onChange={(evento) =>
                      atualizar(
                        { observacoes: evento.target.value },
                        'registro-observacoes',
                      )
                    }
                  />
                )}
              </Campo>
            </div>
          </>
        ) : (
          <RevisaoRegistro rascunho={rascunho} />
        )}

        {chaveSite !== '' && (
          <div className="registro__turnstile">
            <Turnstile
              ref={turnstileRef}
              siteKey={chaveSite}
              onSuccess={(token) => setTokenTurnstile(token)}
              onExpire={() => setTokenTurnstile(null)}
              onError={() => setTokenTurnstile(null)}
            />
          </div>
        )}

        <div className="registro__acoes">
          {etapa === 'formulario' ? (
            <>
              {turnstilePendente && (
                <p className="campo__dica" id="registro-turnstile-dica">
                  Complete a confirmação acima para continuar.
                </p>
              )}
              <Botao
                type="submit"
                disabled={turnstilePendente}
                aria-describedby={
                  turnstilePendente ? 'registro-turnstile-dica' : undefined
                }
              >
                Revisar registro
              </Botao>
            </>
          ) : (
            <>
              {avisoEnvio && (
                <Alerta tipo={avisoEnvio.tipo}>{avisoEnvio.texto}</Alerta>
              )}
              {turnstilePendente && (
                <p className="campo__dica" id="registro-turnstile-dica">
                  Complete a confirmação acima para continuar.
                </p>
              )}
              <div className="registro__botoes">
                <Botao
                  variante="contorno"
                  type="button"
                  onClick={aoCorrigir}
                  disabled={enviando}
                >
                  Corrigir
                </Botao>
                <Botao
                  type="button"
                  onClick={aoEnviar}
                  disabled={enviando || bloqueioMinutos !== null || turnstilePendente}
                  carregando={enviando}
                  aria-describedby={
                    turnstilePendente ? 'registro-turnstile-dica' : undefined
                  }
                >
                  {enviando ? 'Enviando…' : 'Enviar registro'}
                </Botao>
              </div>
            </>
          )}
        </div>
      </form>
    </article>
  )
}

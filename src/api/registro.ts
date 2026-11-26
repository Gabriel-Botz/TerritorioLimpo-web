/*
 * Envio do registro público (API-FRONT §7.2): POST multipart com a
 * parte `data` (JSON com Content-Type application/json), as fotos e os
 * cabeçalhos Idempotency-Key / X-Turnstile-Token.
 */

import type { NovaOcorrencia, ResultadoRegistro } from '../tipos'
import type * as Dto from './dto'
import { caminhos } from './caminhos'
import { requisitar } from './http'
import { paraRequestRegistro, paraResultadoRegistro } from './mapeadores'

export interface EnvioRegistro {
  conteudo: NovaOcorrencia
  fotos: File[]
  /** UUID por conteúdo (ver util/idempotencia.ts). */
  chaveIdempotencia: string
  /** Token do Turnstile; null quando o widget não está configurado. */
  tokenTurnstile: string | null
}

/** Registra a ocorrência e devolve o resultado mapeado para o modelo interno. */
export async function enviarRegistro(envio: EnvioRegistro): Promise<ResultadoRegistro> {
  const dados = paraRequestRegistro(envio.conteudo)

  const formulario = new FormData()
  // A parte `data` precisa do Content-Type application/json (a API valida).
  const conteudoJson = new Blob([JSON.stringify(dados)], { type: 'application/json' })
  formulario.append('data', conteudoJson, 'data.json')
  for (const foto of envio.fotos) {
    formulario.append('fotos', foto, foto.name)
  }

  const cabecalhos: Record<string, string> = { 'Idempotency-Key': envio.chaveIdempotencia }
  if (envio.tokenTurnstile) cabecalhos['X-Turnstile-Token'] = envio.tokenTurnstile

  const resposta = await requisitar<Dto.OcorrenciaCreatedResponse>(
    caminhos.publico.registrarOcorrencia,
    { metodo: 'POST', formulario, cabecalhos },
  )

  return paraResultadoRegistro(resposta)
}

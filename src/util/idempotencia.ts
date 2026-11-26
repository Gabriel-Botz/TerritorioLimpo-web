/*
 * Chave de idempotência do envio público (API-FRONT §6.6).
 * Uma chave por conteúdo: reenvio idêntico reutiliza a mesma chave;
 * qualquer alteração gera chave nova.
 */

import type { RascunhoRegistro } from '../tipos'

export interface MemoriaIdempotencia {
  chave: string
  assinatura: string
}

/** Assinatura do conteúdo enviado (campos + identidade das fotos). */
export function calcularAssinatura(rascunho: RascunhoRegistro): string {
  const fotos = rascunho.fotos
    .map((foto) => `${foto.arquivo.name}:${foto.arquivo.size}:${foto.arquivo.lastModified}`)
    .join('|')

  return JSON.stringify([
    rascunho.tipoResiduo,
    rascunho.volume,
    rascunho.acesso,
    rascunho.drenagem,
    rascunho.endereco,
    rascunho.pontoReferencia,
    rascunho.observacoes,
    rascunho.latitude,
    rascunho.longitude,
    rascunho.precisaoMetros,
    fotos,
  ])
}

/**
 * Devolve a chave para o conteúdo atual: reaproveita a da memória se o
 * conteúdo não mudou; caso contrário, gera uma chave nova.
 */
export function escolherChave(
  memoria: MemoriaIdempotencia | null,
  rascunho: RascunhoRegistro,
): MemoriaIdempotencia {
  const assinatura = calcularAssinatura(rascunho)
  if (memoria && memoria.assinatura === assinatura) return memoria
  return { chave: crypto.randomUUID(), assinatura }
}

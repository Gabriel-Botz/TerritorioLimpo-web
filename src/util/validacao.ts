/*
 * Validação do formulário público, espelhando as regras do contrato
 * (API-FRONT §7.2): obrigatórios, localização presente, pares de
 * coordenadas e limites de texto/fotos.
 */

import type { ErroTela } from '../componentes/ResumoErros'
import type { RascunhoRegistro } from '../tipos'

export const LIMITES = {
  endereco: 300,
  referencia: 300,
  observacoes: 1000,
  fotos: 3,
  fotoMb: 5,
} as const

/** Coordenadas aceitas pela API (mesmo critério do backend). */
export function coordenadaValida(latitude: number | null, longitude: number | null): boolean {
  if (latitude === null || longitude === null) return false
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

/** Ao menos uma forma de localização: coordenadas, rua ou referência. */
export function localizacaoPresente(rascunho: RascunhoRegistro): boolean {
  return (
    coordenadaValida(rascunho.latitude, rascunho.longitude) ||
    rascunho.endereco.trim().length > 0 ||
    rascunho.pontoReferencia.trim().length > 0
  )
}

function erro(id: string, mensagem: string): ErroTela {
  return { id, mensagem }
}

/** Valida o rascunho e devolve os erros por bloco (para ResumoErros). */
export function validarRascunho(rascunho: RascunhoRegistro): ErroTela[] {
  const erros: ErroTela[] = []

  if (!rascunho.tipoResiduo) erros.push(erro('registro-tipo', 'Informe o tipo de resíduo.'))
  if (!rascunho.volume) erros.push(erro('registro-volume', 'Informe o volume estimado.'))
  if (!rascunho.acesso) erros.push(erro('registro-acesso', 'Informe como é o acesso para coleta.'))
  if (!rascunho.drenagem) erros.push(erro('registro-drenagem', 'Informe se há risco de drenagem.'))

  // Par de coordenadas obrigatório quando uma das metades foi preenchida.
  const temLatitude = rascunho.latitude !== null
  const temLongitude = rascunho.longitude !== null
  const coordenadasIncompletas =
    temLatitude !== temLongitude || (temLatitude && !coordenadaValida(rascunho.latitude, rascunho.longitude))

  if (coordenadasIncompletas) {
    erros.push(
      erro(
        'registro-localizacao',
        'As coordenadas do GPS estão incompletas ou fora dos limites. Use o botão de localização novamente.',
      ),
    )
  } else if (!localizacaoPresente(rascunho)) {
    erros.push(
      erro(
        'registro-localizacao',
        'Informe ao menos uma forma de localização: use o GPS, informe a rua e o número ou descreva um ponto de referência.',
      ),
    )
  }

  if (rascunho.endereco.length > LIMITES.endereco) {
    erros.push(
      erro('registro-endereco', `A rua e número pode ter no máximo ${LIMITES.endereco} caracteres.`),
    )
  }
  if (rascunho.pontoReferencia.length > LIMITES.referencia) {
    erros.push(
      erro(
        'registro-referencia',
        `O ponto de referência pode ter no máximo ${LIMITES.referencia} caracteres.`,
      ),
    )
  }
  if (rascunho.observacoes.length > LIMITES.observacoes) {
    erros.push(
      erro(
        'registro-observacoes',
        `As observações podem ter no máximo ${LIMITES.observacoes} caracteres.`,
      ),
    )
  }

  if (rascunho.fotos.length > LIMITES.fotos) {
    erros.push(erro('registro-fotos', `Envie no máximo ${LIMITES.fotos} fotos.`))
  }

  return erros
}

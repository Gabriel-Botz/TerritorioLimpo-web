/*
 * Rascunho do formulário público de registro (Fase 2).
 * Estado editado pelo morador antes da revisão e do envio.
 */

import type { AcessoCaminhao, SituacaoDrenagem, TipoResiduo, VolumeResiduo } from './valores'

/** Foto escolhida pelo morador, já comprimida no navegador. */
export interface FotoRascunho {
  id: string
  arquivo: File
  /** Object URL para a miniatura ('' quando o navegador não oferece preview). */
  preview: string
}

/** Todo o conteúdo do formulário. Nada é gravado em localStorage. */
export interface RascunhoRegistro {
  tipoResiduo: TipoResiduo | null
  volume: VolumeResiduo | null
  acesso: AcessoCaminhao | null
  drenagem: SituacaoDrenagem | null
  endereco: string
  pontoReferencia: string
  observacoes: string
  latitude: number | null
  longitude: number | null
  precisaoMetros: number | null
  fotos: FotoRascunho[]
}

export const rascunhoInicial: RascunhoRegistro = {
  tipoResiduo: null,
  volume: null,
  acesso: null,
  drenagem: null,
  endereco: '',
  pontoReferencia: '',
  observacoes: '',
  latitude: null,
  longitude: null,
  precisaoMetros: null,
  fotos: [],
}

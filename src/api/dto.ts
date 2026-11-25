/*
 * Espelho EXATO do contrato da API (API-FRONT §10).
 * Estes nomes só podem existir aqui, em caminhos.ts e em mapeadores.ts.
 * A API tem `fail-on-unknown-properties: true`: não inventar campos.
 */

// ── Enums ──────────────────────────────────────────────
export type OcorrenciaStatus =
  | 'RECEBIDA'
  | 'EM_ANALISE'
  | 'ENCAMINHADA'
  | 'AGUARDANDO_ATENDIMENTO'
  | 'RESOLVIDA'
  | 'NAO_SOLUCIONADA'

export type OcorrenciaType =
  | 'LIXO_COMUM'
  | 'ENTULHO'
  | 'VOLUMOSO'
  | 'DRENAGEM_OBSTRUIDA'
  | 'OUTRO'

export type NivelPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA'
export type VolumeEstimado = 'PEQUENO' | 'MEDIO' | 'GRANDE'
export type AcessoColeta = 'NORMAL' | 'DIFICIL' | 'IMPOSSIVEL_CAMINHAO'
export type RiscoDrenagem = 'SIM' | 'NAO' | 'NAO_SEI'
export type OrigemLocalizacao = 'GPS' | 'MANUAL' | 'CONFIRMADA_PELA_EQUIPE'

export type PrioridadeReasonCode =
  | 'DRENAGEM_COM_RISCO'
  | 'DRENAGEM_INCERTA'
  | 'POSSIVEL_OBSTRUCAO'
  | 'VOLUME_GRANDE'
  | 'VOLUME_MEDIO'
  | 'ACESSO_DIFICIL'
  | 'ACESSO_IMPOSSIVEL_CAMINHAO'
  | 'AREA_VULNERAVEL_VERIFICADA'

// ── Fluxo público ──────────────────────────────────────
export interface PublicOcorrenciaRequest {
  type: OcorrenciaType
  estimatedVolume: VolumeEstimado
  collectionAcesso: AcessoColeta
  drenagemRisk: RiscoDrenagem
  observacaos?: string | null
  latitude?: number | null
  longitude?: number | null
  precisaoMeters?: number | null
  addressText?: string | null
  referenciaPoint?: string | null
}

export interface OcorrenciaCreatedResponse {
  number: number
  createdAt: string
  localizacaoSummary: string
  status: OcorrenciaStatus
  fotos: { received: number; saved: number; failed: number }
  message: string
}

// ── Paginação ──────────────────────────────────────────
export interface Pagina<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Admin: listagem ────────────────────────────────────
export interface AdminOcorrenciaListItem {
  id: string
  number: number
  createdAt: string
  type: OcorrenciaType
  estimatedVolume: VolumeEstimado
  collectionAcesso: AcessoColeta
  drenagemRisk: RiscoDrenagem
  status: OcorrenciaStatus
  prioridade: NivelPrioridade
  prioridadeSetManually: boolean
  addressText: string | null
  referenciaPoint: string | null
  hasCoordinates: boolean
  fotoCount: number
}

export interface FiltrosOcorrencia {
  status?: OcorrenciaStatus
  type?: OcorrenciaType
  prioridade?: NivelPrioridade
  hasCoordinates?: boolean
  from?: string
  to?: string
  q?: string
  page?: number
  size?: number
}

// ── Admin: detalhe ─────────────────────────────────────
export interface AdminOcorrenciaDetail {
  id: string
  number: number
  createdAt: string
  updatedAt: string | null
  type: OcorrenciaType
  estimatedVolume: VolumeEstimado
  collectionAcesso: AcessoColeta
  drenagemRisk: RiscoDrenagem
  observacaos: string | null
  latitude: number | null
  longitude: number | null
  precisaoMeters: number | null
  addressText: string | null
  referenciaPoint: string | null
  localizacaoSource: OrigemLocalizacao
  status: OcorrenciaStatus
  prioridade: NivelPrioridade
  prioridadeReasons: { code: string; label: string }[]
  prioridadeSetManually: boolean
  manualPrioridadeReason: string | null
  inVulneravelArea: boolean | null
  resolvedAt: string | null
  resolvedConfirmedBy: string | null
  resolutionObservacao: string | null
  historico: HistoricoView[]
  encaminhamentos: EncaminhamentoView[]
  observacaosInternal: ObservacaoView[]
  fotos: FotoView[]
}

export interface HistoricoView {
  fromStatus: OcorrenciaStatus | null
  toStatus: OcorrenciaStatus
  changedBy: string | null
  observacao: string | null
  changedAt: string
}

export interface EncaminhamentoView {
  id: number
  destination: string
  channel: string
  referredAt: string
  protocolNumber: string | null
  requestText: string
  referredBy: string | null
  createdAt: string
}

export interface ObservacaoView {
  id: number
  authorId: string
  body: string
  createdAt: string
}

export interface FotoView {
  id: string
  url: string | null
  createdAt: string
}

// ── Admin: requests ────────────────────────────────────
export interface StatusChangeRequest {
  status: OcorrenciaStatus
  observacao?: string | null
}

export interface PrioridadeChangeRequest {
  prioridade: NivelPrioridade
  reason?: string | null
}

export interface VulneravelAreaRequest {
  inVulneravelArea?: boolean | null
}

export interface LocalizacaoConfirmRequest {
  latitude: number
  longitude: number
  precisaoMeters?: number | null
}

export interface ObservacaoCreateRequest {
  body: string
}

export interface EncaminhamentoCriarRequest {
  destination: string
  channel: string
  referredAt?: string
  protocolNumber?: string
  requestText?: string
}

// ── Indicadores ────────────────────────────────────────
export interface Indicadores {
  totalOcorrencias: number
  received: number
  inAnalysis: number
  pendingAnalysis: number
  forwardedOrAwaiting: number
  forwarded: number
  awaitingService: number
  resolved: number
  unresolved: number
  highPrioridadePending: number
  totalEncaminhamentos: number
  encaminhamentosWithProtocol: number
  ocorrenciasWithEncaminhamento: number
}

// ── Erros (RFC 9457) ───────────────────────────────────
export interface ErroCampo {
  field: string
  message: string
}

export interface ProblemDetail {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
  errors?: ErroCampo[]
  retryAfterSeconds?: number
  correlationId?: string
}

import type {
  AcessoCaminhao,
  OrigemLocalizacao,
  Prioridade,
  Situacao,
  SituacaoDrenagem,
  TipoResiduo,
  VolumeResiduo,
} from './valores'

/** Motivo da prioridade, com o rótulo vindo da API. */
export interface MotivoPrioridade {
  codigo: string
  rotulo: string
}

/** Foto de uma ocorrência. A `url` é assinada e expira em 10 minutos. */
export interface FotoOcorrencia {
  id: string
  url: string | null
  criadoEm: string
}

/** Evento do histórico de situações (ordem cronológica). */
export interface ItemHistorico {
  situacaoAnterior: Situacao | null
  situacaoNova: Situacao
  observacao: string | null
  em: string
}

/** Encaminhamento feito pela equipe a um serviço municipal. */
export interface Encaminhamento {
  id: number
  destino: string
  canal: string
  encaminhadoEm: string
  protocoloOrgao: string | null
  textoSolicitacao: string
  criadoEm: string
}

/** Nota interna da equipe (nunca aparece em CSV ou texto de encaminhamento). */
export interface NotaInterna {
  id: number
  corpo: string
  criadoEm: string
}

/** Ocorrência completa (detalhe administrativo). */
export interface Ocorrencia {
  id: string
  numero: number
  criadoEm: string
  atualizadoEm: string | null
  tipoResiduo: TipoResiduo
  volume: VolumeResiduo
  acesso: AcessoCaminhao
  drenagem: SituacaoDrenagem
  observacoesMorador: string | null
  latitude: number | null
  longitude: number | null
  precisaoMetros: number | null
  endereco: string | null
  pontoReferencia: string | null
  origemLocalizacao: OrigemLocalizacao
  situacao: Situacao
  prioridade: Prioridade
  motivosPrioridade: MotivoPrioridade[]
  prioridadeDefinidaManualmente: boolean
  motivoPrioridadeManual: string | null
  areaVulneravel: boolean | null
  resolvidoEm: string | null
  observacaoResolucao: string | null
  historico: ItemHistorico[]
  encaminhamentos: Encaminhamento[]
  notasInternas: NotaInterna[]
  fotos: FotoOcorrencia[]
}

/** Item da lista administrativa. */
export interface OcorrenciaResumo {
  id: string
  numero: number
  criadoEm: string
  tipoResiduo: TipoResiduo
  volume: VolumeResiduo
  acesso: AcessoCaminhao
  drenagem: SituacaoDrenagem
  situacao: Situacao
  prioridade: Prioridade
  prioridadeDefinidaManualmente: boolean
  endereco: string | null
  pontoReferencia: string | null
  temCoordenadas: boolean
  totalFotos: number
}

/** Registro criado pelo morador (modelo interno do formulário público). */
export interface NovaOcorrencia {
  tipoResiduo: TipoResiduo
  volume: VolumeResiduo
  acesso: AcessoCaminhao
  drenagem: SituacaoDrenagem
  observacoes: string | null
  latitude: number | null
  longitude: number | null
  precisaoMetros: number | null
  endereco: string | null
  pontoReferencia: string | null
}

/** Resposta do envio público. */
export interface ResultadoRegistro {
  numero: number
  criadoEm: string
  resumoLocalizacao: string
  situacao: Situacao
  fotos: {
    recebidas: number
    salvas: number
    falhas: number
  }
  mensagem: string
}

/** Filtros internos da lista (a query string é montada na camada api/). */
export interface FiltroOcorrencia {
  situacao?: Situacao
  tipo?: TipoResiduo
  prioridade?: Prioridade
  comCoordenadas?: boolean
  de?: string
  ate?: string
  busca?: string
  pagina?: number
  tamanho?: number
}

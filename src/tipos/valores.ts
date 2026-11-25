/*
 * Valores dos enums do contrato da API (espelhados aqui como dados de domínio).
 * As listas const dão completeness em tempo de compilação para as tabelas de
 * rótulos (util/rotulos.ts) e para os testes.
 */

export const situacoes = [
  'RECEBIDA',
  'EM_ANALISE',
  'ENCAMINHADA',
  'AGUARDANDO_ATENDIMENTO',
  'RESOLVIDA',
  'NAO_SOLUCIONADA',
] as const
export type Situacao = (typeof situacoes)[number]

export const tiposResiduo = [
  'LIXO_COMUM',
  'ENTULHO',
  'VOLUMOSO',
  'DRENAGEM_OBSTRUIDA',
  'OUTRO',
] as const
export type TipoResiduo = (typeof tiposResiduo)[number]

export const niveisPrioridade = ['BAIXA', 'MEDIA', 'ALTA'] as const
export type Prioridade = (typeof niveisPrioridade)[number]

export const volumesResiduo = ['PEQUENO', 'MEDIO', 'GRANDE'] as const
export type VolumeResiduo = (typeof volumesResiduo)[number]

export const acessosCaminhao = ['NORMAL', 'DIFICIL', 'IMPOSSIVEL_CAMINHAO'] as const
export type AcessoCaminhao = (typeof acessosCaminhao)[number]

export const situacoesDrenagem = ['SIM', 'NAO', 'NAO_SEI'] as const
export type SituacaoDrenagem = (typeof situacoesDrenagem)[number]

export const origensLocalizacao = ['GPS', 'MANUAL', 'CONFIRMADA_PELA_EQUIPE'] as const
export type OrigemLocalizacao = (typeof origensLocalizacao)[number]

export const motivosPrioridade = [
  'DRENAGEM_COM_RISCO',
  'DRENAGEM_INCERTA',
  'POSSIVEL_OBSTRUCAO',
  'VOLUME_GRANDE',
  'VOLUME_MEDIO',
  'ACESSO_DIFICIL',
  'ACESSO_IMPOSSIVEL_CAMINHAO',
  'AREA_VULNERAVEL_VERIFICADA',
] as const
export type CodigoMotivoPrioridade = (typeof motivosPrioridade)[number]

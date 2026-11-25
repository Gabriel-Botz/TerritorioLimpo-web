/*
 * Tabela central de rótulos dos enums do contrato (API-FRONT §8).
 * Nenhum switch de rótulo espalhado pelo código: tudo vem daqui.
 */

import {
  acessosCaminhao,
  motivosPrioridade,
  niveisPrioridade,
  origensLocalizacao,
  situacoes,
  situacoesDrenagem,
  tiposResiduo,
  volumesResiduo,
  type AcessoCaminhao,
  type CodigoMotivoPrioridade,
  type OrigemLocalizacao,
  type Prioridade,
  type Situacao,
  type SituacaoDrenagem,
  type TipoResiduo,
  type VolumeResiduo,
} from '../tipos'

export const rotulosSituacao: Record<Situacao, string> = {
  RECEBIDA: 'Recebida',
  EM_ANALISE: 'Em análise',
  ENCAMINHADA: 'Encaminhada ao serviço responsável',
  AGUARDANDO_ATENDIMENTO: 'Aguardando atendimento',
  RESOLVIDA: 'Resolvida',
  NAO_SOLUCIONADA: 'Não solucionada ou encaminhamento necessário',
}

export const rotulosTipoResiduo: Record<TipoResiduo, string> = {
  LIXO_COMUM: 'Lixo comum acumulado',
  ENTULHO: 'Entulho ou restos de obra',
  VOLUMOSO: 'Móveis ou objetos volumosos descartados',
  DRENAGEM_OBSTRUIDA: 'Possível obstrução de bueiro ou drenagem',
  OUTRO: 'Outro',
}

export const rotulosPrioridade: Record<Prioridade, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
}

export const rotulosVolume: Record<VolumeResiduo, string> = {
  PEQUENO: 'Pequeno',
  MEDIO: 'Médio',
  GRANDE: 'Grande',
}

export const rotulosAcesso: Record<AcessoCaminhao, string> = {
  NORMAL: 'Acesso normal',
  DIFICIL: 'Acesso difícil',
  IMPOSSIVEL_CAMINHAO: 'Aparentemente impossível para caminhão',
}

export const rotulosDrenagem: Record<SituacaoDrenagem, string> = {
  SIM: 'Sim',
  NAO: 'Não',
  NAO_SEI: 'Não sei',
}

export const rotulosOrigemLocalizacao: Record<OrigemLocalizacao, string> = {
  GPS: 'GPS do aparelho',
  MANUAL: 'Informada manualmente',
  CONFIRMADA_PELA_EQUIPE: 'Confirmada pela equipe',
}

export const rotulosMotivoPrioridade: Record<CodigoMotivoPrioridade, string> = {
  DRENAGEM_COM_RISCO: 'Bueiro obstruído ou água acumulada',
  DRENAGEM_INCERTA: 'Situação de drenagem não confirmada',
  POSSIVEL_OBSTRUCAO: 'Tipo relacionado a obstrução de drenagem',
  VOLUME_GRANDE: 'Volume grande de resíduos',
  VOLUME_MEDIO: 'Volume médio de resíduos',
  ACESSO_DIFICIL: 'Acesso difícil para coleta',
  ACESSO_IMPOSSIVEL_CAMINHAO: 'Acesso aparentemente impossível para caminhão',
  AREA_VULNERAVEL_VERIFICADA: 'Área vulnerável verificada pela equipe',
}

/** Agrupamento dos estados no cartão "Em andamento" do painel. */
export const situacoesEmAndamento: Situacao[] = ['ENCAMINHADA', 'AGUARDANDO_ATENDIMENTO']

/** Consultas usadas pelos testes de completude. */
export const tabelasDeRotulos = {
  situacao: rotulosSituacao,
  tipoResiduo: rotulosTipoResiduo,
  prioridade: rotulosPrioridade,
  volume: rotulosVolume,
  acesso: rotulosAcesso,
  drenagem: rotulosDrenagem,
  origemLocalizacao: rotulosOrigemLocalizacao,
  motivoPrioridade: rotulosMotivoPrioridade,
} as const

export const listasDeValores = {
  situacao: situacoes,
  tipoResiduo: tiposResiduo,
  prioridade: niveisPrioridade,
  volume: volumesResiduo,
  acesso: acessosCaminhao,
  drenagem: situacoesDrenagem,
  origemLocalizacao: origensLocalizacao,
  motivoPrioridade: motivosPrioridade,
} as const

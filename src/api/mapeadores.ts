/*
 * Conversores DTO ⇄ modelos internos (em português).
 * Único ponto, além de dto.ts e caminhos.ts, que conhece os nomes do contrato.
 */

import type * as Dto from './dto'
import type {
  Encaminhamento,
  FiltroOcorrencia,
  FotoOcorrencia,
  Indicadores,
  ItemHistorico,
  NovaOcorrencia,
  NotaInterna,
  Ocorrencia,
  OcorrenciaResumo,
  Pagina,
  ResultadoRegistro,
} from '../tipos'

export function paraResultadoRegistro(dto: Dto.OcorrenciaCreatedResponse): ResultadoRegistro {
  return {
    numero: dto.number,
    criadoEm: dto.createdAt,
    resumoLocalizacao: dto.localizacaoSummary,
    situacao: dto.status,
    fotos: {
      recebidas: dto.fotos.received,
      salvas: dto.fotos.saved,
      falhas: dto.fotos.failed,
    },
    mensagem: dto.message,
  }
}

export function paraResumoOcorrencia(dto: Dto.AdminOcorrenciaListItem): OcorrenciaResumo {
  return {
    id: dto.id,
    numero: dto.number,
    criadoEm: dto.createdAt,
    tipoResiduo: dto.type,
    volume: dto.estimatedVolume,
    acesso: dto.collectionAcesso,
    drenagem: dto.drenagemRisk,
    situacao: dto.status,
    prioridade: dto.prioridade,
    prioridadeDefinidaManualmente: dto.prioridadeSetManually,
    endereco: dto.addressText,
    pontoReferencia: dto.referenciaPoint,
    temCoordenadas: dto.hasCoordinates,
    totalFotos: dto.fotoCount,
  }
}

export function paraItemHistorico(dto: Dto.HistoricoView): ItemHistorico {
  // changedBy (UUID) é descartado: quem alterou aparece sempre como "Equipe".
  return {
    situacaoAnterior: dto.fromStatus,
    situacaoNova: dto.toStatus,
    observacao: dto.observacao,
    em: dto.changedAt,
  }
}

export function paraEncaminhamento(dto: Dto.EncaminhamentoView): Encaminhamento {
  return {
    id: dto.id,
    destino: dto.destination,
    canal: dto.channel,
    encaminhadoEm: dto.referredAt,
    protocoloOrgao: dto.protocolNumber,
    textoSolicitacao: dto.requestText,
    criadoEm: dto.createdAt,
  }
}

export function paraNotaInterna(dto: Dto.ObservacaoView): NotaInterna {
  // authorId (UUID) é descartado: a autoria aparece como "Equipe".
  return {
    id: dto.id,
    corpo: dto.body,
    criadoEm: dto.createdAt,
  }
}

export function paraFoto(dto: Dto.FotoView): FotoOcorrencia {
  return {
    id: dto.id,
    url: dto.url,
    criadoEm: dto.createdAt,
  }
}

export function paraOcorrencia(dto: Dto.AdminOcorrenciaDetail): Ocorrencia {
  return {
    id: dto.id,
    numero: dto.number,
    criadoEm: dto.createdAt,
    atualizadoEm: dto.updatedAt,
    tipoResiduo: dto.type,
    volume: dto.estimatedVolume,
    acesso: dto.collectionAcesso,
    drenagem: dto.drenagemRisk,
    observacoesMorador: dto.observacaos,
    latitude: dto.latitude,
    longitude: dto.longitude,
    precisaoMetros: dto.precisaoMeters,
    endereco: dto.addressText,
    pontoReferencia: dto.referenciaPoint,
    origemLocalizacao: dto.localizacaoSource,
    situacao: dto.status,
    prioridade: dto.prioridade,
    motivosPrioridade: dto.prioridadeReasons.map((motivo) => ({
      codigo: motivo.code,
      rotulo: motivo.label,
    })),
    prioridadeDefinidaManualmente: dto.prioridadeSetManually,
    motivoPrioridadeManual: dto.manualPrioridadeReason,
    areaVulneravel: dto.inVulneravelArea,
    resolvidoEm: dto.resolvedAt,
    observacaoResolucao: dto.resolutionObservacao,
    historico: dto.historico.map(paraItemHistorico),
    encaminhamentos: dto.encaminhamentos.map(paraEncaminhamento),
    notasInternas: dto.observacaosInternal.map(paraNotaInterna),
    fotos: dto.fotos.map(paraFoto),
  }
}

export function paraPagina<TDto, TInt>(
  dto: Dto.Pagina<TDto>,
  converter: (item: TDto) => TInt,
): Pagina<TInt> {
  return {
    itens: dto.content.map(converter),
    pagina: dto.page,
    tamanho: dto.size,
    totalItens: dto.totalElements,
    totalPaginas: dto.totalPages,
  }
}

export function paraIndicadores(dto: Dto.Indicadores): Indicadores {
  return {
    totalRegistros: dto.totalOcorrencias,
    recebidas: dto.received,
    emAnalise: dto.inAnalysis,
    pendentesAnalise: dto.pendingAnalysis,
    emAndamento: dto.forwardedOrAwaiting,
    encaminhadas: dto.forwarded,
    aguardandoAtendimento: dto.awaitingService,
    resolvidas: dto.resolved,
    naoSolucionadas: dto.unresolved,
    prioridadeAltaPendente: dto.highPrioridadePending,
    totalEncaminhamentos: dto.totalEncaminhamentos,
    encaminhamentosComProtocolo: dto.encaminhamentosWithProtocol,
    ocorrenciasComEncaminhamento: dto.ocorrenciasWithEncaminhamento,
  }
}

export function paraRequestRegistro(interno: NovaOcorrencia): Dto.PublicOcorrenciaRequest {
  return {
    type: interno.tipoResiduo,
    estimatedVolume: interno.volume,
    collectionAcesso: interno.acesso,
    drenagemRisk: interno.drenagem,
    observacaos: interno.observacoes ?? null,
    latitude: interno.latitude,
    longitude: interno.longitude,
    precisaoMeters: interno.precisaoMetros,
    addressText: interno.endereco ?? null,
    referenciaPoint: interno.pontoReferencia ?? null,
  }
}

export function paraRequestFiltro(filtro: FiltroOcorrencia): Dto.FiltrosOcorrencia {
  return {
    status: filtro.situacao,
    type: filtro.tipo,
    prioridade: filtro.prioridade,
    hasCoordinates: filtro.comCoordenadas,
    from: filtro.de,
    to: filtro.ate,
    q: filtro.busca,
    page: filtro.pagina,
    size: filtro.tamanho,
  }
}

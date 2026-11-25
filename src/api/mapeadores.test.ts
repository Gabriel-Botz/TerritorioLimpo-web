import { describe, expect, it } from 'vitest'
import type * as Dto from './dto'
import {
  paraEncaminhamento,
  paraIndicadores,
  paraItemHistorico,
  paraNotaInterna,
  paraOcorrencia,
  paraPagina,
  paraRequestFiltro,
  paraRequestRegistro,
  paraResumoOcorrencia,
  paraResultadoRegistro,
} from './mapeadores'

describe('paraResultadoRegistro', () => {
  it('converte a resposta pública para o modelo interno', () => {
    const dto: Dto.OcorrenciaCreatedResponse = {
      number: 42,
      createdAt: '2026-11-24T13:05:00Z',
      localizacaoSummary: 'Rua X, Centro',
      status: 'RECEBIDA',
      fotos: { received: 3, saved: 2, failed: 1 },
      message: 'Registro recebido com sucesso.',
    }
    expect(paraResultadoRegistro(dto)).toEqual({
      numero: 42,
      criadoEm: '2026-11-24T13:05:00Z',
      resumoLocalizacao: 'Rua X, Centro',
      situacao: 'RECEBIDA',
      fotos: { recebidas: 3, salvas: 2, falhas: 1 },
      mensagem: 'Registro recebido com sucesso.',
    })
  })
})

describe('paraResumoOcorrencia', () => {
  it('renomeia os campos do item da lista', () => {
    const dto: Dto.AdminOcorrenciaListItem = {
      id: 'abc',
      number: 7,
      createdAt: '2026-11-24T13:05:00Z',
      type: 'ENTULHO',
      estimatedVolume: 'GRANDE',
      collectionAcesso: 'DIFICIL',
      drenagemRisk: 'NAO_SEI',
      status: 'EM_ANALISE',
      prioridade: 'ALTA',
      prioridadeSetManually: true,
      addressText: 'Rua Y',
      referenciaPoint: 'Próximo à praça',
      hasCoordinates: true,
      fotoCount: 2,
    }
    const interno = paraResumoOcorrencia(dto)
    expect(interno).toEqual({
      id: 'abc',
      numero: 7,
      criadoEm: '2026-11-24T13:05:00Z',
      tipoResiduo: 'ENTULHO',
      volume: 'GRANDE',
      acesso: 'DIFICIL',
      drenagem: 'NAO_SEI',
      situacao: 'EM_ANALISE',
      prioridade: 'ALTA',
      prioridadeDefinidaManualmente: true,
      endereco: 'Rua Y',
      pontoReferencia: 'Próximo à praça',
      temCoordenadas: true,
      totalFotos: 2,
    })
  })
})

describe('conversores de subentidades', () => {
  it('historico preserva observação e descarta changedBy', () => {
    const dto: Dto.HistoricoView = {
      fromStatus: null,
      toStatus: 'RECEBIDA',
      changedBy: 'uuid-qualquer',
      observacao: null,
      changedAt: '2026-11-24T13:05:00Z',
    }
    expect(paraItemHistorico(dto)).toEqual({
      situacaoAnterior: null,
      situacaoNova: 'RECEBIDA',
      observacao: null,
      em: '2026-11-24T13:05:00Z',
    })
  })

  it('encaminhamento renomeia campos', () => {
    const dto: Dto.EncaminhamentoView = {
      id: 1,
      destination: 'SMUL',
      channel: 'e-mail',
      referredAt: '2026-11-24T14:00:00Z',
      protocolNumber: 'SMUL-99',
      requestText: 'Solicitação de coleta',
      referredBy: 'uuid',
      createdAt: '2026-11-24T14:00:00Z',
    }
    expect(paraEncaminhamento(dto)).toEqual({
      id: 1,
      destino: 'SMUL',
      canal: 'e-mail',
      encaminhadoEm: '2026-11-24T14:00:00Z',
      protocoloOrgao: 'SMUL-99',
      textoSolicitacao: 'Solicitação de coleta',
      criadoEm: '2026-11-24T14:00:00Z',
    })
  })

  it('nota interna usa "corpo"', () => {
    const dto: Dto.ObservacaoView = {
      id: 5,
      authorId: 'uuid',
      body: 'Verificado no local.',
      createdAt: '2026-11-24T15:00:00Z',
    }
    expect(paraNotaInterna(dto)).toEqual({
      id: 5,
      corpo: 'Verificado no local.',
      criadoEm: '2026-11-24T15:00:00Z',
    })
  })
})

describe('paraOcorrencia', () => {
  it('converte o detalhe completo', () => {
    const dto: Dto.AdminOcorrenciaDetail = {
      id: 'abc',
      number: 42,
      createdAt: '2026-11-24T13:05:00Z',
      updatedAt: null,
      type: 'LIXO_COMUM',
      estimatedVolume: 'MEDIO',
      collectionAcesso: 'NORMAL',
      drenagemRisk: 'SIM',
      observacaos: 'tem lixo na calçada',
      latitude: -22.5,
      longitude: -43.1,
      precisaoMeters: 10,
      addressText: 'Rua X',
      referenciaPoint: null,
      localizacaoSource: 'GPS',
      status: 'EM_ANALISE',
      prioridade: 'MEDIA',
      prioridadeReasons: [{ code: 'VOLUME_MEDIO', label: 'Volume médio de resíduos' }],
      prioridadeSetManually: false,
      manualPrioridadeReason: null,
      inVulneravelArea: null,
      resolvedAt: null,
      resolvedConfirmedBy: null,
      resolutionObservacao: null,
      historico: [],
      encaminhamentos: [],
      observacaosInternal: [],
      fotos: [{ id: 'f1', url: 'https://assinada/1', createdAt: '2026-11-24T13:06:00Z' }],
    }
    const interno = paraOcorrencia(dto)
    expect(interno.observacoesMorador).toBe('tem lixo na calçada')
    expect(interno.origemLocalizacao).toBe('GPS')
    expect(interno.motivosPrioridade).toEqual([
      { codigo: 'VOLUME_MEDIO', rotulo: 'Volume médio de resíduos' },
    ])
    expect(interno.fotos[0]).toEqual({
      id: 'f1',
      url: 'https://assinada/1',
      criadoEm: '2026-11-24T13:06:00Z',
    })
    expect(interno.historico).toEqual([])
  })
})

describe('paraPagina', () => {
  it('converte a página da API para o formato interno', () => {
    const dto: Dto.Pagina<number> = {
      content: [1, 2],
      page: 3,
      size: 2,
      totalElements: 10,
      totalPages: 5,
    }
    expect(paraPagina(dto, (n) => n * 10)).toEqual({
      itens: [10, 20],
      pagina: 3,
      tamanho: 2,
      totalItens: 10,
      totalPaginas: 5,
    })
  })
})

describe('paraIndicadores', () => {
  it('renomeia todos os contadores', () => {
    const dto: Dto.Indicadores = {
      totalOcorrencias: 100,
      received: 10,
      inAnalysis: 20,
      pendingAnalysis: 5,
      forwardedOrAwaiting: 30,
      forwarded: 15,
      awaitingService: 15,
      resolved: 25,
      unresolved: 15,
      highPrioridadePending: 4,
      totalEncaminhamentos: 12,
      encaminhamentosWithProtocol: 8,
      ocorrenciasWithEncaminhamento: 10,
    }
    expect(paraIndicadores(dto)).toEqual({
      totalRegistros: 100,
      recebidas: 10,
      emAnalise: 20,
      pendentesAnalise: 5,
      emAndamento: 30,
      encaminhadas: 15,
      aguardandoAtendimento: 15,
      resolvidas: 25,
      naoSolucionadas: 15,
      prioridadeAltaPendente: 4,
      totalEncaminhamentos: 12,
      encaminhamentosComProtocolo: 8,
      ocorrenciasComEncaminhamento: 10,
    })
  })
})

describe('conversores de envio', () => {
  it('paraRequestRegistro usa os nomes do contrato', () => {
    const interno = {
      tipoResiduo: 'ENTULHO' as const,
      volume: 'GRANDE' as const,
      acesso: 'IMPOSSIVEL_CAMINHAO' as const,
      drenagem: 'NAO' as const,
      observacoes: 'perto da escola',
      latitude: null,
      longitude: null,
      precisaoMetros: null,
      endereco: null,
      pontoReferencia: 'portão azul',
    }
    expect(paraRequestRegistro(interno)).toEqual({
      type: 'ENTULHO',
      estimatedVolume: 'GRANDE',
      collectionAcesso: 'IMPOSSIVEL_CAMINHAO',
      drenagemRisk: 'NAO',
      observacaos: 'perto da escola',
      latitude: null,
      longitude: null,
      precisaoMeters: null,
      addressText: null,
      referenciaPoint: 'portão azul',
    })
  })

  it('paraRequestRegistro converte observações vazias em null', () => {
    const interno = {
      tipoResiduo: 'OUTRO' as const,
      volume: 'PEQUENO' as const,
      acesso: 'NORMAL' as const,
      drenagem: 'SIM' as const,
      observacoes: null,
      latitude: null,
      longitude: null,
      precisaoMetros: null,
      endereco: null,
      pontoReferencia: null,
    }
    expect(paraRequestRegistro(interno).observacaos).toBeNull()
  })

  it('paraRequestFiltro usa os nomes da query string', () => {
    expect(
      paraRequestFiltro({
        situacao: 'EM_ANALISE',
        tipo: 'ENTULHO',
        prioridade: 'ALTA',
        comCoordenadas: true,
        de: '2026-11-01',
        ate: '2026-11-30',
        busca: 'escola',
        pagina: 2,
        tamanho: 20,
      }),
    ).toEqual({
      status: 'EM_ANALISE',
      type: 'ENTULHO',
      prioridade: 'ALTA',
      hasCoordinates: true,
      from: '2026-11-01',
      to: '2026-11-30',
      q: 'escola',
      page: 2,
      size: 20,
    })
  })
})

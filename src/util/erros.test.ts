import { describe, expect, it } from 'vitest'
import { errosDaApiParaTela } from './erros'

/*
 * Correspondência campos da API → campos da tela (API-FRONT §6.4),
 * tolerante ao prefixo antes do último ponto.
 */

describe('errosDaApiParaTela', () => {
  it('ignora o prefixo antes do último ponto (ex.: data.type)', () => {
    expect(errosDaApiParaTela([{ campo: 'data.type', mensagem: 'Tipo inválido' }])).toEqual([
      { id: 'registro-tipo', mensagem: 'Tipo inválido' },
    ])
  })

  it('mapeia os campos mínimos do §6.4', () => {
    const erros = errosDaApiParaTela([
      { campo: 'estimatedVolume', mensagem: 'v' },
      { campo: 'collectionAcesso', mensagem: 'a' },
      { campo: 'drenagemRisk', mensagem: 'd' },
      { campo: 'observacaos', mensagem: 'o' },
      { campo: 'coordinatesPairValid', mensagem: 'c' },
      { campo: 'addressText', mensagem: 'e' },
      { campo: 'referenciaPoint', mensagem: 'r' },
      { campo: 'fotos', mensagem: 'f' },
      { campo: 'Idempotency-Key', mensagem: 'i' },
    ])
    // latitude/longitude/addressText/referenciaPoint caem no mesmo bloco.
    expect(erros.map((erro) => erro.id)).toEqual([
      'registro-volume',
      'registro-acesso',
      'registro-drenagem',
      'registro-observacoes',
      'registro-localizacao',
      'registro-fotos',
      'registro-geral',
    ])
  })

  it('não repete o mesmo id no resumo', () => {
    const erros = errosDaApiParaTela([
      { campo: 'latitude', mensagem: 'latitude inválida' },
      { campo: 'longitude', mensagem: 'longitude inválida' },
    ])
    expect(erros).toHaveLength(1)
    expect(erros[0]).toEqual({ id: 'registro-localizacao', mensagem: 'latitude inválida' })
  })

  it('campo desconhecido vira erro geral', () => {
    expect(errosDaApiParaTela([{ campo: 'algoInesperado', mensagem: 'm' }])[0].id).toBe(
      'registro-geral',
    )
  })
})

import { describe, expect, it } from 'vitest'
import { rascunhoInicial, type RascunhoRegistro } from '../tipos'
import { coordenadaValida, LIMITES, localizacaoPresente, validarRascunho } from './validacao'

/*
 * Validação do formulário público (API-FRONT §7.2): obrigatórios,
 * localização presente, pares de coordenadas e limites de texto/fotos.
 */

function rascunhoValido(): RascunhoRegistro {
  return {
    ...rascunhoInicial,
    tipoResiduo: 'ENTULHO',
    volume: 'MEDIO',
    acesso: 'NORMAL',
    drenagem: 'NAO_SEI',
    endereco: 'Rua das Flores, 12',
  }
}

describe('validarRascunho', () => {
  it('exige os quatro grupos obrigatórios e a localização', () => {
    const erros = validarRascunho(rascunhoInicial)
    expect(erros.map((erro) => erro.id)).toEqual([
      'registro-tipo',
      'registro-volume',
      'registro-acesso',
      'registro-drenagem',
      'registro-localizacao',
    ])
  })

  it('não aponta erros em um rascunho completo', () => {
    expect(validarRascunho(rascunhoValido())).toEqual([])
  })

  it('aceita localização apenas por coordenadas ou apenas por texto', () => {
    const porCoords = { ...rascunhoValido(), endereco: '', latitude: -22.5, longitude: -43.18 }
    expect(validarRascunho(porCoords)).toEqual([])

    const porTexto = { ...rascunhoValido(), latitude: null, longitude: null }
    expect(validarRascunho(porTexto)).toEqual([])
  })

  it('marca coordenadas incompletas ou fora dos limites', () => {
    const soLatitude = { ...rascunhoValido(), latitude: -22.5, longitude: null }
    const erros = validarRascunho(soLatitude)
    expect(erros).toHaveLength(1)
    expect(erros[0].id).toBe('registro-localizacao')
    expect(erros[0].mensagem).toContain('incompletas')

    const foraDeFaixa = { ...rascunhoValido(), latitude: 91, longitude: 0 }
    expect(validarRascunho(foraDeFaixa)[0].id).toBe('registro-localizacao')
  })

  it('respeita os limites de texto', () => {
    const longo = {
      ...rascunhoValido(),
      endereco: 'x'.repeat(LIMITES.endereco + 1),
      pontoReferencia: 'y'.repeat(LIMITES.referencia + 1),
      observacoes: 'z'.repeat(LIMITES.observacoes + 1),
    }
    const ids = validarRascunho(longo).map((erro) => erro.id)
    expect(ids).toContain('registro-endereco')
    expect(ids).toContain('registro-referencia')
    expect(ids).toContain('registro-observacoes')
  })

  it('marca o bloco de fotos acima do limite', () => {
    const fotos = Array.from({ length: LIMITES.fotos + 1 }, (_, indice) => ({
      id: `foto-${indice}`,
      arquivo: new File(['x'], `foto${indice}.jpg`, { type: 'image/jpeg' }),
      preview: '',
    }))
    const erros = validarRascunho({ ...rascunhoValido(), fotos })
    expect(erros.some((erro) => erro.id === 'registro-fotos')).toBe(true)
  })
})

describe('coordenadaValida e localizacaoPresente', () => {
  it('valida a faixa das coordenadas', () => {
    expect(coordenadaValida(0, 0)).toBe(true)
    expect(coordenadaValida(-90, 180)).toBe(true)
    expect(coordenadaValida(91, 0)).toBe(false)
    expect(coordenadaValida(0, 181)).toBe(false)
    expect(coordenadaValida(null, 0)).toBe(false)
    expect(coordenadaValida(Number.NaN, 0)).toBe(false)
  })

  it('considera presente qualquer forma de localização', () => {
    expect(localizacaoPresente(rascunhoInicial)).toBe(false)
    expect(localizacaoPresente({ ...rascunhoInicial, endereco: 'Rua A' })).toBe(true)
    expect(localizacaoPresente({ ...rascunhoInicial, pontoReferencia: 'Próximo à praça' })).toBe(
      true,
    )
    expect(
      localizacaoPresente({ ...rascunhoInicial, latitude: -22.5, longitude: -43.18 }),
    ).toBe(true)
  })
})

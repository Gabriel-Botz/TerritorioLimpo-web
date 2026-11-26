import { describe, expect, it } from 'vitest'
import { rascunhoInicial, type RascunhoRegistro } from '../tipos'
import { calcularAssinatura, escolherChave } from './idempotencia'

/*
 * Idempotência do envio público (API-FRONT §6.6): uma chave por conteúdo;
 * reenvio idêntico reutiliza; qualquer alteração gera chave nova.
 */

function base(): RascunhoRegistro {
  return {
    ...rascunhoInicial,
    tipoResiduo: 'LIXO_COMUM',
    volume: 'PEQUENO',
    acesso: 'NORMAL',
    drenagem: 'NAO',
    endereco: 'Rua A, 1',
  }
}

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('escolherChave', () => {
  it('gera uma chave UUID na primeira tentativa', () => {
    const memoria = escolherChave(null, base())
    expect(memoria.chave).toMatch(uuid)
    expect(memoria.assinatura).toBe(calcularAssinatura(base()))
  })

  it('reutiliza a chave no reenvio do mesmo conteúdo', () => {
    const primeira = escolherChave(null, base())
    const segunda = escolherChave(primeira, base())
    expect(segunda.chave).toBe(primeira.chave)
  })

  it('gera chave nova quando qualquer campo muda', () => {
    const primeira = escolherChave(null, base())
    const alterado = escolherChave(primeira, { ...base(), endereco: 'Rua B, 2' })
    expect(alterado.chave).not.toBe(primeira.chave)
  })

  it('gera chave nova quando as fotos mudam', () => {
    const comFoto: RascunhoRegistro = {
      ...base(),
      fotos: [
        {
          id: 'f1',
          arquivo: new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
          preview: '',
        },
      ],
    }
    const primeira = escolherChave(null, comFoto)
    const trocada = escolherChave(primeira, {
      ...comFoto,
      fotos: [
        {
          id: 'f2',
          arquivo: new File(['y'], 'b.jpg', { type: 'image/jpeg' }),
          preview: '',
        },
      ],
    })
    expect(trocada.chave).not.toBe(primeira.chave)
  })
})

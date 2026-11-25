import { describe, expect, it } from 'vitest'
import { listasDeValores, tabelasDeRotulos } from './rotulos'

/*
 * Completude: cada tabela de rótulos deve ter exatamente os valores do enum,
 * sem sobras e sem faltas (a API pode enviar qualquer valor do enum).
 */

describe('tabelas de rótulos', () => {
  it.each(Object.entries(listasDeValores))('%s: tabela cobre todos os valores', (chave, lista) => {
    const tabela = tabelasDeRotulos[chave as keyof typeof tabelasDeRotulos] as Record<string, string>
    expect(Object.keys(tabela).sort()).toEqual([...lista].sort())
  })

  it.each(Object.entries(tabelasDeRotulos))('%s: rótulos não vazios e únicos', (_chave, tabela) => {
    const rotulos = Object.values(tabela)
    expect(rotulos.every((rotulo) => rotulo.trim().length > 0)).toBe(true)
    expect(new Set(rotulos).size).toBe(rotulos.length)
  })
})

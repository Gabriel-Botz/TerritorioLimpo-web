import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { razaoContraste } from '../util/contraste'

/*
 * Pares obrigatórios do tokens.css:
 * - texto normal ≥ 4,5:1 (AA);
 * - componentes de interface (borda de campo, anel de foco) ≥ 3:1.
 */

// No jsdom import.meta.url não é file://; usa a raiz do projeto (cwd do vitest).
const css = readFileSync(resolve(process.cwd(), 'src/estilos/tokens.css'), 'utf8')

function token(nome: string): string {
  const achou = new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})(?![0-9a-fA-F])`).exec(css)
  if (!achou) throw new Error(`Token --${nome} não encontrado em tokens.css`)
  return achou[1]
}

const paresTexto: [string, string][] = [
  ['cor-texto', 'cor-branco'],
  ['cor-texto', 'cor-fundo-claro'],
  ['cor-texto-suave', 'cor-branco'],
  ['cor-texto-suave', 'cor-fundo-claro'],
  ['cor-marinho', 'cor-branco'],
  ['cor-branco', 'cor-marinho'],
  ['cor-erro', 'cor-branco'],
  ['cor-erro', 'cor-erro-fundo'],
  ['cor-situacao-recebida-texto', 'cor-situacao-recebida-fundo'],
  ['cor-situacao-analise-texto', 'cor-situacao-analise-fundo'],
  ['cor-situacao-encaminhada-texto', 'cor-situacao-encaminhada-fundo'],
  ['cor-situacao-resolvida-texto', 'cor-situacao-resolvida-fundo'],
  ['cor-situacao-nao-solucionada-texto', 'cor-situacao-nao-solucionada-fundo'],
  ['cor-prioridade-baixa-texto', 'cor-prioridade-baixa-fundo'],
  ['cor-prioridade-media-texto', 'cor-prioridade-media-fundo'],
  ['cor-prioridade-alta-texto', 'cor-prioridade-alta-fundo'],
  // Fundo claro do alerta/erro com texto escuro por cima
  ['cor-situacao-nao-solucionada-texto', 'cor-erro-fundo'],
  ['cor-marinho', 'cor-fundo-claro'],
]

const paresComponente: [string, string][] = [
  ['cor-borda-campo', 'cor-branco'], // borda de input
  ['cor-marinho', 'cor-branco'], // anel de foco
  ['cor-erro', 'cor-branco'], // borda de campo inválido
]

describe('contraste dos tokens (WCAG 2.2 AA)', () => {
  it.each(paresTexto)('%s sobre %s ≥ 4,5:1', (frente, fundo) => {
    const razao = razaoContraste(token(frente), token(fundo))
    expect(razao).toBeGreaterThanOrEqual(4.5)
  })

  it.each(paresComponente)('%s sobre %s ≥ 3:1', (frente, fundo) => {
    const razao = razaoContraste(token(frente), token(fundo))
    expect(razao).toBeGreaterThanOrEqual(3)
  })
})

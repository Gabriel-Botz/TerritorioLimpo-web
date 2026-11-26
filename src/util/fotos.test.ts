import { afterEach, describe, expect, it, vi } from 'vitest'
import { comprimirFoto, recusarFoto } from './fotos'

/*
 * Regras de aceite e compressão das fotos (API-FRONT §7.2): tipo, tamanho,
 * quantidade e redução para lado ≤ 1600 px em JPEG ~0,82.
 */

function arquivo(nome: string, tipo: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], nome, { type: tipo })
}

describe('recusarFoto', () => {
  it('aceita JPEG/PNG dentro do limite', () => {
    expect(recusarFoto(arquivo('a.jpg', 'image/jpeg', 1024), 0)).toBeNull()
    expect(recusarFoto(arquivo('b.png', 'image/png', 1024), 2)).toBeNull()
  })

  it('recusa outros tipos com mensagem clara', () => {
    expect(recusarFoto(arquivo('g.gif', 'image/gif', 1024), 0)).toContain(
      'não é uma foto JPEG ou PNG',
    )
  })

  it('recusa arquivo acima de 5 MB', () => {
    const grande = arquivo('g.jpg', 'image/jpeg', 6 * 1024 * 1024)
    expect(recusarFoto(grande, 0)).toContain('mais de 5 MB')
  })

  it('recusa a quarta foto', () => {
    expect(recusarFoto(arquivo('d.jpg', 'image/jpeg', 1024), 3)).toContain(
      'Só é possível enviar 3 fotos',
    )
  })
})

describe('comprimirFoto', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('devolve o original quando o navegador não decodifica (jsdom/antigos)', async () => {
    const original = arquivo('foto.png', 'image/png', 2048)
    // jsdom não possui createImageBitmap: o original é o fallback do contrato.
    await expect(comprimirFoto(original)).resolves.toBe(original)
  })

  it('reduz o lado maior para 1600 px e salva em JPEG', async () => {
    const fechado = vi.fn()
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 2000, height: 1000, close: fechado })),
    )
    const desenhar = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: desenhar,
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(new Blob(['x'], { type: 'image/jpeg' }))
    })

    const resultado = await comprimirFoto(arquivo('foto.png', 'image/png', 4096))

    expect(resultado.type).toBe('image/jpeg')
    expect(resultado.name).toBe('foto.jpg')
    expect(desenhar).toHaveBeenCalledWith(expect.anything(), 0, 0, 1600, 800)
    expect(fechado).toHaveBeenCalled()
  })

  it('devolve o original se a imagem não decodificar', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('sem decodificação')
      }),
    )
    const original = arquivo('foto.jpg', 'image/jpeg', 2048)
    await expect(comprimirFoto(original)).resolves.toBe(original)
  })

  it('devolve o original se o canvas não tiver contexto 2D', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 800, height: 600, close: vi.fn() })),
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const original = arquivo('foto.jpg', 'image/jpeg', 2048)
    await expect(comprimirFoto(original)).resolves.toBe(original)
  })
})

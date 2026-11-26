/*
 * Regras e pré-processamento das fotos do registro público (API-FRONT §7.2):
 * tipo JPEG/PNG, até 5 MB, no máximo 3; compressão no navegador com
 * lado maior ≤ 1600 px em JPEG ~0,82, respeitando a orientação EXIF.
 */

import { LIMITES } from './validacao'

export const ACEITADOS = 'image/jpeg,image/png'

/** Mensagem clara se a foto não puder ser aceita; `null` se puder. */
export function recusarFoto(arquivo: File, jaEscolhidas: number): string | null {
  if (arquivo.type !== 'image/jpeg' && arquivo.type !== 'image/png') {
    return `"${arquivo.name}" não é uma foto JPEG ou PNG. Escolha outra imagem.`
  }
  if (arquivo.size > LIMITES.fotoMb * 1024 * 1024) {
    return `"${arquivo.name}" tem mais de ${LIMITES.fotoMb} MB. Escolha uma imagem menor.`
  }
  if (jaEscolhidas >= LIMITES.fotos) {
    return `Só é possível enviar ${LIMITES.fotos} fotos. Remova uma para escolher outra.`
  }
  return null
}

const LADO_MAXIMO = 1600
const QUALIDADE_JPEG = 0.82

/**
 * Comprime a foto para envio. Se não for possível decodificar
 * (navegador sem `createImageBitmap` ou falha de decodificação),
 * devolve o original — aceito enquanto for JPEG/PNG válido.
 */
export async function comprimirFoto(arquivo: File): Promise<File> {
  if (typeof createImageBitmap !== 'function') return arquivo

  let bitmap: ImageBitmap
  try {
    bitmap = await decodificar(arquivo)
  } catch {
    return arquivo
  }

  try {
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height))
    const largura = Math.max(1, Math.round(bitmap.width * escala))
    const altura = Math.max(1, Math.round(bitmap.height * escala))

    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = altura
    const contexto = canvas.getContext('2d')
    if (!contexto) return arquivo
    contexto.drawImage(bitmap, 0, 0, largura, altura)

    const blob = await new Promise<Blob | null>((resolver) =>
      canvas.toBlob(resolver, 'image/jpeg', QUALIDADE_JPEG),
    )
    if (!blob) return arquivo

    return new File([blob], nomeJpeg(arquivo.name), { type: 'image/jpeg' })
  } catch {
    return arquivo
  } finally {
    bitmap.close()
  }
}

/** Tenta decodificar respeitando a orientação EXIF; sem a opção, tenta do jeito padrão. */
async function decodificar(arquivo: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  } catch {
    return await createImageBitmap(arquivo)
  }
}

function nomeJpeg(nomeOriginal: string): string {
  const base = nomeOriginal.replace(/\.[^.]+$/, '')
  return `${base || 'foto'}.jpg`
}

/** Cálculo de contraste de cores conforme WCAG 2.2 (razão de luminância). */

export interface CorRgb {
  r: number
  g: number
  b: number
}

/** Converte `#RGB` ou `#RRGGBB` em RGB; devolve `null` se inválida. */
export function paraRgb(hex: string): CorRgb | null {
  const valor = hex.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(valor)) {
    const [r, g, b] = valor.split('').map((c) => parseInt(c + c, 16))
    return { r, g, b }
  }
  if (/^[0-9a-fA-F]{6}$/.test(valor)) {
    return {
      r: parseInt(valor.slice(0, 2), 16),
      g: parseInt(valor.slice(2, 4), 16),
      b: parseInt(valor.slice(4, 6), 16),
    }
  }
  return null
}

function canalRelativo(valor: number): number {
  const c = valor / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Luminância relativa (0 a 1). */
export function luminancia(cor: CorRgb): number {
  return (
    0.2126 * canalRelativo(cor.r) + 0.7152 * canalRelativo(cor.g) + 0.0722 * canalRelativo(cor.b)
  )
}

/** Razão de contraste entre duas cores em hexadecimal (1 a 21). */
export function razaoContraste(hexA: string, hexB: string): number {
  const a = paraRgb(hexA)
  const b = paraRgb(hexB)
  if (!a || !b) throw new Error(`Cor inválida: ${!a ? hexA : hexB}`)
  const la = luminancia(a)
  const lb = luminancia(b)
  const maior = Math.max(la, lb)
  const menor = Math.min(la, lb)
  return (maior + 0.05) / (menor + 0.05)
}

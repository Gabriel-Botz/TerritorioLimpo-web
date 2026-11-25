import { describe, expect, it } from 'vitest'
import { formatarProtocolo } from './protocolo'

describe('formatarProtocolo', () => {
  it('formata 42 como TL-000042', () => {
    expect(formatarProtocolo(42)).toBe('TL-000042')
  })

  it('preenche com zeros à esquerda', () => {
    expect(formatarProtocolo(7)).toBe('TL-000007')
    expect(formatarProtocolo(123456)).toBe('TL-123456')
  })
})

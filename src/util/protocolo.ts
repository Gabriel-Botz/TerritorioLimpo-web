/** Formata o número sequencial do registro: 42 → "TL-000042". */
export function formatarProtocolo(numero: number): string {
  return `TL-${String(numero).padStart(6, '0')}`
}

/** Formatação de datas e números no padrão do Brasil (fuso de São Paulo). */

const fuso = 'America/Sao_Paulo'

const formatadorDataHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: fuso,
  dateStyle: 'short',
  timeStyle: 'short',
})

const formatadorData = new Intl.DateTimeFormat('pt-BR', {
  timeZone: fuso,
  dateStyle: 'short',
})

/** Data e hora no formato 24/11/2026 13:05. */
export function formatarDataHora(iso: string): string {
  return formatadorDataHora.format(new Date(iso))
}

/** Data no formato 24/11/2026. */
export function formatarData(iso: string): string {
  return formatadorData.format(new Date(iso))
}

/** Número no formato brasileiro: 137 → "137". */
export function formatarNumero(valor: number): string {
  return valor.toLocaleString('pt-BR')
}

/** Coordenada com 6 casas decimais (precisão do banco). */
export function formatarCoordenada(valor: number): string {
  return valor.toFixed(6)
}

/** Converte segundos de espera (429) em minutos, no mínimo 1. */
export function minutosDeEspera(segundos: number): number {
  return Math.max(1, Math.ceil(segundos / 60))
}

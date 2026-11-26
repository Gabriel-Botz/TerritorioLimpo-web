/*
 * Acesso à localização do dispositivo (API-FRONT §7.2).
 * A permissão é pedida só quando o morador aciona o botão; a UI explica
 * antes para que serve e anuncia os estados em aria-live.
 */

export type EstadoGps = 'inicial' | 'buscando' | 'obtida' | 'negada' | 'indisponivel'

export interface CoordenadasGps {
  latitude: number
  longitude: number
  precisaoMetros: number | null
}

/** Falha do GPS com o estado que a UI deve anunciar. */
export class ErroGps extends Error {
  estado: Exclude<EstadoGps, 'inicial' | 'buscando' | 'obtida'>

  constructor(estado: Exclude<EstadoGps, 'inicial' | 'buscando' | 'obtida'>) {
    super(estado)
    this.estado = estado
    this.name = 'ErroGps'
  }
}

/** Solicita a posição atual. Lança `ErroGps` (negada ou indisponivel). */
export function obterCoordenadas(): Promise<CoordenadasGps> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new ErroGps('indisponivel'))
  }

  return new Promise((resolver, rejeitar) => {
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        resolver({
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
          precisaoMetros:
            typeof posicao.coords.accuracy === 'number' && Number.isFinite(posicao.coords.accuracy)
              ? posicao.coords.accuracy
              : null,
        })
      },
      (falha) => {
        rejeitar(new ErroGps(falha.code === falha.PERMISSION_DENIED ? 'negada' : 'indisponivel'))
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
  })
}

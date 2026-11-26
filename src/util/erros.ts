/*
 * Correspondência entre os campos de erro da API e os campos da tela
 * (API-FRONT §6.4), de forma tolerante: ignora o prefixo antes do
 * último ponto (ex.: `data.type` → `type`).
 */

import type { ErroCampoApi } from '../api/http'
import type { ErroTela } from '../componentes/ResumoErros'

/** id da tela (DOM) por nome de campo do contrato, em minúsculas. */
const mapaCampos: Record<string, string> = {
  type: 'registro-tipo',
  estimatedvolume: 'registro-tipo',
  collectionacesso: 'registro-acesso',
  drenagemrisk: 'registro-drenagem',
  observacaos: 'registro-observacoes',
  latitude: 'registro-localizacao',
  longitude: 'registro-localizacao',
  coordinatespairvalid: 'registro-localizacao',
  localizacaopresent: 'registro-localizacao',
  adressetext: 'registro-endereco',
  referenciapoint: 'registro-referencia',
  fotos: 'registro-fotos',
  'idempotency-key': 'registro-geral',
  body: 'registro-geral',
}

/** Converte os erros de campo da API em erros da tela (sem ids repetidos). */
export function errosDaApiParaTela(erros: ErroCampoApi[]): ErroTela[] {
  const vistos = new Set<string>()
  const tela: ErroTela[] = []

  for (const erro of erros) {
    const nome = (erro.campo.split('.').pop() ?? erro.campo).toLowerCase()
    const id = mapaCampos[nome] ?? 'registro-geral'
    if (vistos.has(id)) continue
    vistos.add(id)
    tela.push({ id, mensagem: erro.mensagem })
  }

  return tela
}

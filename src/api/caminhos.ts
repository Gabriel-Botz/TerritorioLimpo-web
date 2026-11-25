/*
 * Todos os caminhos de endpoint em um só lugar.
 * Se a API padronizar rotas, muda-se apenas este arquivo.
 */

const raiz = '/api/v1'

export const caminhos = {
  publico: {
    registrarOcorrencia: `${raiz}/public/ocorrencias`,
  },
  saude: '/actuator/health',
  admin: {
    listaOcorrencias: `${raiz}/admin/ocorrencias`,
    detalheOcorrencia: (id: string) => `${raiz}/admin/ocorrencias/${id}`,
    fotos: (id: string) => `${raiz}/admin/ocorrencias/${id}/fotos`,
    foto: (id: string, fotoId: string) => `${raiz}/admin/ocorrencias/${id}/fotos/${fotoId}`,
    situacao: (id: string) => `${raiz}/admin/ocorrencias/${id}/status`,
    prioridade: (id: string) => `${raiz}/admin/ocorrencias/${id}/prioridade`,
    areaVulneravel: (id: string) => `${raiz}/admin/ocorrencias/${id}/vulneravel-area`,
    localizacao: (id: string) => `${raiz}/admin/ocorrencias/${id}/localizacao`,
    notaInterna: (id: string) => `${raiz}/admin/ocorrencias/${id}/observacaos`,
    textoEncaminhamento: (id: string) => `${raiz}/admin/ocorrencias/${id}/encaminhamento-text`,
    encaminhamentos: (id: string) => `${raiz}/admin/ocorrencias/${id}/encaminhamentos`,
    exportarCsv: `${raiz}/admin/ocorrencias/export.csv`,
    indicadores: `${raiz}/admin/indicadores`,
  },
} as const

/** Página de resultados (formato interno; o DTO tem `content`, `totalElements`…). */
export interface Pagina<T> {
  itens: T[]
  pagina: number
  tamanho: number
  totalItens: number
  totalPaginas: number
}

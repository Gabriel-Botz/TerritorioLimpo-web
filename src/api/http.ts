/*
 * Cliente HTTP central.
 * - Prefixa VITE_API_URL.
 * - Injeta Authorization nas rotas /admin.
 * - Converte Problem Details (RFC 9457) em ErroApi, uma única vez.
 * - 401 (admin): renova a sessão uma única vez e repete; se falhar, encerra
 *   a sessão e aciona a ação registrada (ir para /admin/login com aviso).
 * - 403: apenas lança o erro (nunca redireciona para o login).
 * - Nunca registre tokens, e-mails ou textos digitados em console.
 */

import type { ProblemDetail } from './dto'
import { clienteSupabase } from '../autenticacao/supabase'

export interface ErroCampoApi {
  campo: string
  mensagem: string
}

interface OpcoesErro {
  status: number
  tipo: string
  titulo: string
  detalhe: string
  erros?: ErroCampoApi[]
  esperarSegundos?: number | null
  idCorrelacao?: string | null
}

/** Erro tipado da API (Problem Details convertido) ou falha de rede. */
export class ErroApi extends Error {
  status: number
  tipo: string
  titulo: string
  detalhe: string
  erros: ErroCampoApi[]
  esperarSegundos: number | null
  idCorrelacao: string | null

  constructor(opcoes: OpcoesErro) {
    super(opcoes.detalhe)
    this.name = 'ErroApi'
    this.status = opcoes.status
    this.tipo = opcoes.tipo
    this.titulo = opcoes.titulo
    this.detalhe = opcoes.detalhe
    this.erros = opcoes.erros ?? []
    this.esperarSegundos = opcoes.esperarSegundos ?? null
    this.idCorrelacao = opcoes.idCorrelacao ?? null
  }
}

type MetodoHttp = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface OpcoesRequisicao {
  metodo?: MetodoHttp
  /** Corpo JSON (serializado como application/json). */
  corpo?: unknown
  /** Corpo multipart/form-data (o navegador monta o boundary). */
  formulario?: FormData
  /** Cabeçalhos extras (ex.: Idempotency-Key, X-Turnstile-Token). */
  cabecalhos?: Record<string, string>
}

const baseApi = import.meta.env.VITE_API_URL ?? ''

let acaoSessaoExpirada: (() => void) | null = null

/** Registra a ação ao expirar a sessão (ex.: navegar para /admin/login). */
export function definirAcaoSessaoExpirada(acao: (() => void) | null): void {
  acaoSessaoExpirada = acao
}

function ehRotaAdmin(caminho: string): boolean {
  return caminho.includes('/admin')
}

async function obterToken(): Promise<string | null> {
  if (!clienteSupabase) return null
  const { data } = await clienteSupabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function tentarRenovarSessao(): Promise<boolean> {
  if (!clienteSupabase) return false
  try {
    const { data, error } = await clienteSupabase.auth.refreshSession()
    return !error && Boolean(data.session)
  } catch {
    return false
  }
}

async function encerrarSessaoLocal(): Promise<void> {
  try {
    await clienteSupabase?.auth.signOut()
  } catch {
    // Sem conexão: a sessão local será ignorada na próxima leitura.
  }
}

/**
 * Extrai o sufixo identificador do `type` (RFC 9457):
 * ".../problem/validation-error" → "validation-error";
 * "about:blank#rate-limit" → "rate-limit".
 */
export function extrairTipoProblem(type: string | undefined): string {
  if (!type) return ''
  const semHash = type.split('#').pop() ?? ''
  const ultimaParte = semHash.split(/[/:]/).filter(Boolean).pop() ?? ''
  return ultimaParte
}

function resolverEspera(body: unknown, header: string | null): number | null {
  const doBody =
    typeof body === 'number' && Number.isFinite(body) && body >= 0 ? Math.floor(body) : null
  if (doBody !== null) return doBody
  if (header && /^\d+$/.test(header.trim())) return Number(header.trim())
  return null
}

async function converterErro(resposta: Response): Promise<ErroApi> {
  let corpo: Partial<ProblemDetail> | null
  try {
    corpo = (await resposta.json()) as Partial<ProblemDetail>
  } catch {
    corpo = null
  }
  const erros: ErroCampoApi[] = Array.isArray(corpo?.errors)
    ? corpo.errors.map((e) => ({ campo: e.field, mensagem: e.message }))
    : []
  return new ErroApi({
    status: resposta.status,
    tipo: extrairTipoProblem(corpo?.type),
    titulo: corpo?.title ?? 'Erro',
    detalhe: corpo?.detail ?? `Não foi possível concluir a requisição (${resposta.status}).`,
    erros,
    esperarSegundos: resolverEspera(corpo?.retryAfterSeconds, resposta.headers.get('Retry-After')),
    idCorrelacao: corpo?.correlationId ?? null,
  })
}

async function executarFetch(
  caminho: string,
  opcoes: OpcoesRequisicao,
  jaTentouRenovar: boolean,
): Promise<Response> {
  const metodo = opcoes.metodo ?? 'GET'
  const admin = ehRotaAdmin(caminho)
  const cabecalhos: Record<string, string> = { ...opcoes.cabecalhos }

  if (admin) {
    const token = await obterToken()
    if (token) cabecalhos.Authorization = `Bearer ${token}`
  }
  if (opcoes.corpo !== undefined) cabecalhos['Content-Type'] = 'application/json'

  let resposta: Response
  try {
    resposta = await fetch(baseApi + caminho, {
      method: metodo,
      headers: cabecalhos,
      body: opcoes.formulario ?? (opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined),
    })
  } catch {
    throw new ErroApi({
      status: 0,
      tipo: 'rede',
      titulo: 'Sem conexão',
      detalhe: 'Sem conexão com o servidor. Verifique sua internet.',
    })
  }

  if (resposta.status === 401 && admin && !jaTentouRenovar) {
    if (await tentarRenovarSessao()) {
      return executarFetch(caminho, opcoes, true)
    }
    await encerrarSessaoLocal()
    acaoSessaoExpirada?.()
    throw new ErroApi({
      status: 401,
      tipo: 'seguranca',
      titulo: 'Sessão expirada',
      detalhe: 'Sua sessão expirou. Entre novamente.',
    })
  }

  if (!resposta.ok) throw await converterErro(resposta)
  return resposta
}

/** Requisição JSON (sucesso 200/201/204). */
export async function requisitar<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const resposta = await executarFetch(caminho, opcoes, false)
  const texto = await resposta.text()
  if (!texto) return undefined as T
  try {
    return JSON.parse(texto) as T
  } catch {
    throw new ErroApi({
      status: resposta.status,
      tipo: 'resposta',
      titulo: 'Resposta inválida',
      detalhe: 'Não foi possível ler a resposta do servidor.',
    })
  }
}

/** Requisição de texto puro (ex.: texto de encaminhamento). */
export async function requisitarTexto(caminho: string): Promise<string> {
  const resposta = await executarFetch(caminho, { metodo: 'GET' }, false)
  return resposta.text()
}

/** Download autenticado (ex.: CSV), com o nome vindo do Content-Disposition. */
export async function requisitarArquivo(
  caminho: string,
): Promise<{ conteudo: Blob; nomeArquivo: string | null }> {
  const resposta = await executarFetch(caminho, { metodo: 'GET' }, false)
  const conteudo = await resposta.blob()
  const disposicao = resposta.headers.get('Content-Disposition') ?? ''
  const nomeArquivo = /filename="([^"]+)"/.exec(disposicao)?.[1] ?? null
  return { conteudo, nomeArquivo }
}

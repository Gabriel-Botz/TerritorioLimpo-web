import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

/*
 * Testes do cliente HTTP central: Problem Details, 429/Retry-After, falha de
 * rede, injeção do token admin, renovação de sessão em 401 e 403 sem redirect.
 */

const authMock = vi.hoisted(() => ({
  token: null as string | null,
  renovar: vi.fn(),
  sair: vi.fn(),
}))

vi.mock('../autenticacao/supabase', () => ({
  supabaseConfigurado: true,
  clienteSupabase: {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: authMock.token ? { access_token: authMock.token } : null },
      })),
      refreshSession: authMock.renovar,
      signOut: authMock.sair,
    },
  },
}))

import { ErroApi, definirAcaoSessaoExpirada, requisitar } from './http'

const servidor = setupServer()

beforeAll(() => {
  servidor.listen()
})

afterAll(() => {
  servidor.close()
})

beforeEach(() => {
  authMock.token = null
  authMock.renovar.mockReset()
  authMock.sair.mockReset()
  definirAcaoSessaoExpirada(null)
})

afterEach(() => {
  servidor.resetHandlers()
})

describe('requisitar — sucesso', () => {
  it('retorna o JSON parseado', async () => {
    servidor.use(
      http.post('*/api/v1/public/ocorrencias', () =>
        HttpResponse.json({ number: 42, message: 'ok' }, { status: 201 }),
      ),
    )
    const resultado = await requisitar<{ number: number }>('/api/v1/public/ocorrencias', {
      metodo: 'POST',
      corpo: { type: 'ENTULHO' },
    })
    expect(resultado.number).toBe(42)
  })

  it('retorna undefined em resposta vazia (204)', async () => {
    servidor.use(http.delete('*/api/v1/admin/ocorrencias/x', () => new HttpResponse(null, { status: 204 })))
    const resultado = await requisitar('/api/v1/admin/ocorrencias/x', { metodo: 'DELETE' })
    expect(resultado).toBeUndefined()
  })
})

describe('requisitar — erros', () => {
  it('converte Problem Details com erros de campo', async () => {
    servidor.use(
      http.post('*/api/v1/public/ocorrencias', () =>
        HttpResponse.json(
          {
            type: 'https://territoriolimpo.test/problem/validation-error',
            title: 'Dados inválidos',
            status: 400,
            detail: 'Revise os campos.',
            errors: [{ field: 'estimatedVolume', message: 'Informe o volume' }],
            correlationId: 'corr-1',
          },
          { status: 400 },
        ),
      ),
    )
    const erro = await requisitar('/api/v1/public/ocorrencias', { metodo: 'POST', corpo: {} }).catch(
      (e: unknown) => e,
    )
    expect(erro).toBeInstanceOf(ErroApi)
    const api = erro as ErroApi
    expect(api.status).toBe(400)
    expect(api.tipo).toBe('validation-error')
    expect(api.titulo).toBe('Dados inválidos')
    expect(api.erros).toEqual([{ campo: 'estimatedVolume', mensagem: 'Informe o volume' }])
    expect(api.idCorrelacao).toBe('corr-1')
  })

  it('lê retryAfterSeconds do body no 429', async () => {
    servidor.use(
      http.post('*/api/v1/public/ocorrencias', () =>
        HttpResponse.json(
          {
            type: 'about:blank#rate-limit',
            title: 'Muitas tentativas',
            status: 429,
            detail: 'Aguarde.',
            retryAfterSeconds: 90,
          },
          { status: 429 },
        ),
      ),
    )
    const erro = (await requisitar('/api/v1/public/ocorrencias', { metodo: 'POST', corpo: {} }).catch(
      (e: unknown) => e,
    )) as ErroApi
    expect(erro.status).toBe(429)
    expect(erro.esperarSegundos).toBe(90)
  })

  it('usa o header Retry-After quando o body não informa', async () => {
    servidor.use(
      http.post('*/api/v1/public/ocorrencias', () =>
        HttpResponse.json(
          { type: 'about:blank#rate-limit', title: 'Aguarde', status: 429, detail: 'Aguarde.' },
          { status: 429, headers: { 'Retry-After': '45' } },
        ),
      ),
    )
    const erro = (await requisitar('/api/v1/public/ocorrencias', { metodo: 'POST', corpo: {} }).catch(
      (e: unknown) => e,
    )) as ErroApi
    expect(erro.esperarSegundos).toBe(45)
  })

  it('converte falha de rede em ErroApi com status 0', async () => {
    servidor.use(http.get('*/api/v1/admin/indicadores', () => HttpResponse.error()))
    const erro = (await requisitar('/api/v1/admin/indicadores').catch((e: unknown) => e)) as ErroApi
    expect(erro).toBeInstanceOf(ErroApi)
    expect(erro.status).toBe(0)
    expect(erro.tipo).toBe('rede')
  })
})

describe('requisitar — token admin', () => {
  it('injeta Authorization nas rotas /admin', async () => {
    authMock.token = 'token-abc'
    const captura: { autorizacao: string | null } = { autorizacao: null }
    servidor.use(
      http.get('*/api/v1/admin/indicadores', ({ request }) => {
        captura.autorizacao = request.headers.get('Authorization')
        return HttpResponse.json({})
      }),
    )
    await requisitar('/api/v1/admin/indicadores')
    expect(captura.autorizacao).toBe('Bearer token-abc')
  })

  it('não injeta Authorization em rotas públicas', async () => {
    authMock.token = 'token-abc'
    const captura: { autorizacao: string | null } = { autorizacao: 'inicial' }
    servidor.use(
      http.get('*/api/v1/public/algo', ({ request }) => {
        captura.autorizacao = request.headers.get('Authorization')
        return HttpResponse.json({})
      }),
    )
    await requisitar('/api/v1/public/algo')
    expect(captura.autorizacao).toBeNull()
  })
})

describe('requisitar — 401 na rota admin', () => {
  it('renova a sessão uma vez e repete a requisição', async () => {
    authMock.token = 'antigo'
    authMock.renovar.mockImplementation(async () => {
      authMock.token = 'novo'
      return { data: { session: { access_token: 'novo' } }, error: null }
    })
    let tentativas = 0
    servidor.use(
      http.get('*/api/v1/admin/indicadores', ({ request }) => {
        tentativas += 1
        if (request.headers.get('Authorization') === 'Bearer antigo') {
          return HttpResponse.json({ detail: 'expirado' }, { status: 401 })
        }
        return HttpResponse.json({ totalOcorrencias: 1 })
      }),
    )
    const resultado = await requisitar<{ totalOcorrencias: number }>('/api/v1/admin/indicadores')
    expect(resultado.totalOcorrencias).toBe(1)
    expect(tentativas).toBe(2)
    expect(authMock.renovar).toHaveBeenCalledTimes(1)
    expect(authMock.sair).not.toHaveBeenCalled()
  })

  it('encerra a sessão e aciona a ação registrada quando a renovação falha', async () => {
    authMock.token = 'antigo'
    authMock.renovar.mockResolvedValue({ data: { session: null }, error: { message: 'falhou' } })
    const acao = vi.fn()
    definirAcaoSessaoExpirada(acao)
    servidor.use(
      http.get('*/api/v1/admin/indicadores', () => HttpResponse.json({ detail: 'expirado' }, { status: 401 })),
    )
    const erro = (await requisitar('/api/v1/admin/indicadores').catch((e: unknown) => e)) as ErroApi
    expect(erro.status).toBe(401)
    expect(authMock.sair).toHaveBeenCalledTimes(1)
    expect(acao).toHaveBeenCalledTimes(1)
  })
})

describe('requisitar — 403', () => {
  it('lança o erro sem redirecionar nem encerrar a sessão', async () => {
    authMock.token = 'token-abc'
    const acao = vi.fn()
    definirAcaoSessaoExpirada(acao)
    servidor.use(
      http.get('*/api/v1/admin/indicadores', () =>
        HttpResponse.json(
          {
            type: 'about:blank#forbidden',
            title: 'Proibido',
            status: 403,
            detail: 'Sem permissão.',
          },
          { status: 403 },
        ),
      ),
    )
    const erro = (await requisitar('/api/v1/admin/indicadores').catch((e: unknown) => e)) as ErroApi
    expect(erro.status).toBe(403)
    expect(erro.tipo).toBe('forbidden')
    expect(acao).not.toHaveBeenCalled()
    expect(authMock.sair).not.toHaveBeenCalled()
  })
})

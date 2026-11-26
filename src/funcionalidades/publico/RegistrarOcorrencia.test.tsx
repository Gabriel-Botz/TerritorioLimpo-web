import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { http, HttpResponse, type DefaultBodyType } from 'msw'
import { setupServer } from 'msw/node'
import { afterEach, beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { LayoutPublico } from './LayoutPublico'
import { RegistroEnviado } from './RegistroEnviado'
import { RegistrarOcorrencia } from './RegistrarOcorrencia'

/*
 * Fase 2 — Registro público (§12.4): validações, preservação dos dados,
 * idempotência, Turnstile, 429, tela de revisão e acessibilidade.
 */

const turnstileMock = vi.hoisted(() => ({
  onSuccess: null as ((token: string) => void) | null,
  reset: vi.fn(),
}))

vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: (props: { ref?: { current: unknown }; onSuccess?: (token: string) => void }) => {
    turnstileMock.onSuccess = props.onSuccess ?? null
    if (props.ref) props.ref.current = { reset: turnstileMock.reset }
    return null
  },
}))

const servidor = setupServer()

interface Captura {
  idempotencia: string | null
  turnstile: string | null
}

let capturas: Captura[] = []
let comportamento: () => HttpResponse<DefaultBodyType>

const respostaSucesso = {
  number: 42,
  createdAt: '2026-01-15T13:05:00.000Z',
  localizacaoSummary: 'Rua das Flores, 12',
  status: 'RECEBIDA',
  fotos: { received: 0, saved: 0, failed: 0 },
  message: 'Registro recebido com sucesso.',
}

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function falha(
  status: number,
  corpo: Record<string, unknown>,
): HttpResponse<DefaultBodyType> {
  return HttpResponse.json(corpo, { status })
}

beforeAll(() => {
  servidor.listen()
})

afterAll(() => {
  servidor.close()
})

beforeEach(() => {
  document.documentElement.lang = 'pt-BR'
  capturas = []
  turnstileMock.onSuccess = null
  turnstileMock.reset.mockClear()
  comportamento = () => HttpResponse.json(respostaSucesso, { status: 201 })
  servidor.use(
    http.post('*/api/v1/public/ocorrencias', async ({ request }) => {
      capturas.push({
        idempotencia: request.headers.get('Idempotency-Key'),
        turnstile: request.headers.get('X-Turnstile-Token'),
      })
      return comportamento()
    }),
  )
})

afterEach(() => {
  servidor.resetHandlers()
  vi.unstubAllEnvs()
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: undefined,
  })
})

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/registrar']}>
      <Routes>
        <Route element={<LayoutPublico />}>
          <Route path="/registrar" element={<RegistrarOcorrencia />} />
          <Route path="/registro-enviado" element={<RegistroEnviado />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

type Usuario = ReturnType<typeof userEvent.setup>

async function preencher(usuario: Usuario) {
  await usuario.click(screen.getByRole('radio', { name: 'Entulho ou restos de obra' }))
  await usuario.click(screen.getByRole('radio', { name: 'Médio' }))
  await usuario.click(screen.getByRole('radio', { name: 'Acesso normal' }))
  await usuario.click(screen.getByRole('radio', { name: 'Não sei' }))
  await usuario.type(
    screen.getByRole('textbox', { name: /Rua e número/ }),
    'Rua das Flores, 12',
  )
  await usuario.type(
    screen.getByRole('textbox', { name: /Observações/ }),
    'Entulho na calçada',
  )
}

async function irParaRevisao(usuario: Usuario) {
  await preencher(usuario)
  await usuario.click(screen.getByRole('button', { name: 'Revisar registro' }))
}

describe('Registrar — validação no cliente', () => {
  it('renderiza sem violações de acessibilidade (axe)', async () => {
    const { container } = renderizar()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('mostra o resumo de erros com foco ao revisar o formulário vazio', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await usuario.click(screen.getByRole('button', { name: 'Revisar registro' }))

    const resumo = screen.getByRole('alert')
    expect(resumo).toHaveFocus()
    for (const mensagem of [
      'Informe o tipo de resíduo.',
      'Informe o volume estimado.',
      'Informe como é o acesso para coleta.',
      'Informe se há risco de drenagem.',
      'Informe ao menos uma forma de localização: use o GPS, informe a rua e o número ou descreva um ponto de referência.',
    ]) {
      expect(screen.getAllByText(mensagem).length).toBeGreaterThan(0)
    }
    expect(screen.queryByRole('heading', { level: 2, name: 'Revise antes de enviar' })).toBeNull()
  })

  it('exige ao menos uma forma de localização mesmo com os grupos preenchidos', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await usuario.click(screen.getByRole('radio', { name: 'Entulho ou restos de obra' }))
    await usuario.click(screen.getByRole('radio', { name: 'Médio' }))
    await usuario.click(screen.getByRole('radio', { name: 'Acesso normal' }))
    await usuario.click(screen.getByRole('radio', { name: 'Não sei' }))
    await usuario.click(screen.getByRole('button', { name: 'Revisar registro' }))

    expect(
      (await screen.findAllByText(/Informe ao menos uma forma de localização/)).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { level: 2, name: 'Revise antes de enviar' })).toBeNull()
  })

  it('aceita no máximo 3 fotos e recusa a quarta com mensagem clara', async () => {
    const { container } = renderizar()
    const input = container.querySelector('#registro-fotos-input') as HTMLInputElement

    for (let indice = 0; indice < 3; indice++) {
      const foto = new File(['x'], `foto${indice}.jpg`, { type: 'image/jpeg' })
      fireEvent.change(input, { target: { files: [foto] } })
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: /Remover foto/ })).toHaveLength(
          indice + 1,
        ),
      )
    }

    fireEvent.change(input, {
      target: { files: [new File(['y'], 'quarta.jpg', { type: 'image/jpeg' })] },
    })
    expect(await screen.findByText(/Só é possível enviar 3 fotos/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Remover foto/ })).toHaveLength(3)
  })

  it('recusa tipo e tamanho de foto com mensagem clara', async () => {
    const { container } = renderizar()
    const input = container.querySelector('#registro-fotos-input') as HTMLInputElement

    fireEvent.change(input, {
      target: { files: [new File(['x'], 'anim.gif', { type: 'image/gif' })] },
    })
    expect(await screen.findByText(/não é uma foto JPEG ou PNG/)).toBeInTheDocument()

    fireEvent.change(input, {
      target: {
        files: [new File([new Uint8Array(6 * 1024 * 1024)], 'grande.jpg', { type: 'image/jpeg' })],
      },
    })
    expect(await screen.findByText(/mais de 5 MB/)).toBeInTheDocument()
  })

  it('anuncia a localização obtida pelo GPS e permite removê-la', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (sucesso: (posicao: unknown) => void) =>
          sucesso({
            coords: { latitude: -22.5, longitude: -43.18, accuracy: 12 },
          }),
      },
    })
    const usuario = userEvent.setup()
    renderizar()

    await usuario.click(screen.getByRole('button', { name: 'Usar minha localização (GPS)' }))
    expect(
      await screen.findByText(/Localização obtida, com precisão aproximada de 12 metros/),
    ).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Remover localização' }))
    expect(screen.queryByText(/Localização obtida/)).not.toBeInTheDocument()
  })

  it('orienta quando o GPS não está disponível', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await usuario.click(screen.getByRole('button', { name: 'Usar minha localização (GPS)' }))
    expect(await screen.findByText(/Não foi possível usar o GPS agora/)).toBeInTheDocument()
    expect(screen.getByText(/Sem problema: escreva o endereço/)).toBeInTheDocument()
  })
})

describe('Registrar — revisão', () => {
  it('apresenta todos os dados em lista de definição antes do envio', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await irParaRevisao(usuario)

    expect(
      screen.getByRole('heading', { level: 2, name: /Revise antes de enviar/ }),
    ).toBeInTheDocument()
    expect(screen.getByText('Entulho ou restos de obra')).toBeInTheDocument()
    expect(screen.getByText('Médio')).toBeInTheDocument()
    expect(screen.getByText('Acesso normal')).toBeInTheDocument()
    expect(screen.getByText('Não sei')).toBeInTheDocument()
    expect(screen.getByText(/Rua das Flores, 12/)).toBeInTheDocument()
    expect(screen.getByText('Entulho na calçada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Corrigir' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar registro' })).toBeInTheDocument()
  })

  it('Corrigir volta ao formulário com tudo preenchido', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await irParaRevisao(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Corrigir' }))

    expect(screen.getByRole('radio', { name: 'Entulho ou restos de obra' })).toBeChecked()
    expect(screen.getByRole('textbox', { name: /Rua e número/ })).toHaveValue(
      'Rua das Flores, 12',
    )
  })

  it('renderiza a revisão sem violações de acessibilidade (axe)', async () => {
    const usuario = userEvent.setup()
    const { container } = renderizar()
    await irParaRevisao(usuario)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Registrar — envio', () => {
  it('envia o registro e vai para a confirmação', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await irParaRevisao(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Enviar registro' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Registro enviado' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Nº do registro TL-000042')).toBeInTheDocument()
    expect(capturas).toHaveLength(1)
    expect(capturas[0].idempotencia).toMatch(uuid)
    expect(capturas[0].turnstile).toBeNull()
  })

  it('preserva o que foi digitado quando o envio falha', async () => {
    const usuario = userEvent.setup()
    comportamento = () => falha(500, { title: 'Erro', detail: 'Falha no servidor.' })
    renderizar()
    await irParaRevisao(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Enviar registro' }))

    expect(
      await screen.findByText('Não foi possível concluir. Tente novamente.'),
    ).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Corrigir' }))
    expect(screen.getByRole('radio', { name: 'Entulho ou restos de obra' })).toBeChecked()
    expect(screen.getByRole('textbox', { name: /Rua e número/ })).toHaveValue(
      'Rua das Flores, 12',
    )
    expect(screen.getByRole('textbox', { name: /Observações/ })).toHaveValue(
      'Entulho na calçada',
    )
  })

  it('reutiliza a chave de idempotência em reenvio idêntico e gera nova após alteração', async () => {
    const usuario = userEvent.setup()
    let falhar = true
    comportamento = () =>
      falhar
        ? falha(500, { title: 'Erro', detail: 'Falha no servidor.' })
        : HttpResponse.json(respostaSucesso, { status: 201 })
    renderizar()

    await irParaRevisao(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Enviar registro' }))
    await screen.findByText('Não foi possível concluir. Tente novamente.')
    expect(capturas).toHaveLength(1)

    // Mesmo conteúdo: mesma chave.
    await usuario.click(screen.getByRole('button', { name: 'Enviar registro' }))
    await waitFor(() => expect(capturas).toHaveLength(2))
    expect(capturas[0].idempotencia).toMatch(uuid)
    expect(capturas[1].idempotencia).toBe(capturas[0].idempotencia)

    // Conteúdo alterado: chave nova.
    falhar = false
    await usuario.click(screen.getByRole('button', { name: 'Corrigir' }))
    await usuario.type(screen.getByRole('textbox', { name: /Rua e número/ }), ' 2')
    await usuario.click(screen.getByRole('button', { name: 'Revisar registro' }))
    await usuario.click(screen.getByRole('button', { name: 'Enviar registro' }))
    await waitFor(() => expect(capturas).toHaveLength(3))
    expect(capturas[2].idempotencia).not.toBe(capturas[0].idempotencia)
  })

  it('envia o token do Turnstile e reinicia o widget após falha', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'chave-publica-exemplo')
    const usuario = userEvent.setup()
    comportamento = () => falha(500, { title: 'Erro', detail: 'Falha no servidor.' })
    renderizar()

    expect(turnstileMock.onSuccess).not.toBeNull()
    act(() => turnstileMock.onSuccess?.('token-unico'))

    await irParaRevisao(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Enviar registro' }))
    await screen.findByText('Não foi possível concluir. Tente novamente.')

    expect(capturas[0].turnstile).toBe('token-unico')
    expect(turnstileMock.reset).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Enviar registro' })).toBeDisabled()
    expect(
      screen.getByText('Complete a confirmação acima para continuar.'),
    ).toBeInTheDocument()
  })

  it('bloqueia o envio em 429 e informa os minutos de espera', async () => {
    const usuario = userEvent.setup()
    comportamento = () =>
      falha(429, {
        type: 'about:blank#rate-limit',
        title: 'Muitas requisições',
        detail: 'Aguarde um pouco.',
        retryAfterSeconds: 120,
      })
    renderizar()
    await irParaRevisao(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Enviar registro' }))

    expect(
      await screen.findByText(
        'Você fez muitos envios em pouco tempo. Tente novamente em cerca de 2 minutos.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar registro' })).toBeDisabled()
  })

  it('volta ao formulário com os erros de campo da API (400)', async () => {
    const usuario = userEvent.setup()
    comportamento = () =>
      falha(400, {
        type: 'about:blank#validation-error',
        title: 'Dados inválidos',
        detail: 'Confira os campos.',
        errors: [
          { field: 'data.type', message: 'Tipo de resíduo inválido' },
          { field: 'data.estimatedVolume', message: 'Volume inválido' },
          { field: 'data.addressText', message: 'Endereço fora do formato esperado' },
        ],
      })
    const { container } = renderizar()
    await irParaRevisao(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Enviar registro' }))

    expect(await screen.findAllByText('Tipo de resíduo inválido')).not.toHaveLength(0)
    expect(screen.getAllByText('Volume inválido').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Registrar ponto de descarte' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Entulho ou restos de obra' })).toBeChecked()
    expect(screen.getByRole('textbox', { name: /Rua e número/ })).toHaveValue(
      'Rua das Flores, 12',
    )

    // addressText marca o bloco Localização (§6.4).
    const secaoLocalizacao = container.querySelector('#registro-localizacao')
    expect(secaoLocalizacao?.getAttribute('aria-describedby')).toContain(
      'registro-localizacao-erro',
    )
    expect(
      (await screen.findAllByText('Endereço fora do formato esperado')).length,
    ).toBeGreaterThan(0)
  })

  it('renderiza o formulário com erros sem violações de acessibilidade (axe)', async () => {
    const usuario = userEvent.setup()
    const { container } = renderizar()
    await usuario.click(screen.getByRole('button', { name: 'Revisar registro' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})

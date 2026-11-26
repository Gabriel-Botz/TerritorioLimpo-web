import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import type { ResultadoRegistro } from '../../tipos'
import { LayoutPublico } from './LayoutPublico'
import { RegistroEnviado } from './RegistroEnviado'

/*
 * Fase 2 — Registro enviado (§7.3): protocolo, data/hora de São Paulo,
 * local, aviso de fotos com falha, orientação e estado sem dados.
 */

const resultado: ResultadoRegistro = {
  numero: 42,
  criadoEm: '2026-01-15T13:05:00.000Z',
  resumoLocalizacao: 'Rua das Flores, 12',
  situacao: 'RECEBIDA',
  fotos: { recebidas: 2, salvas: 1, falhas: 1 },
  mensagem: 'Registro recebido com sucesso.',
}

function renderizar(estado: ResultadoRegistro | null) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/registro-enviado', state: estado }]}
    >
      <Routes>
        <Route element={<LayoutPublico />}>
          <Route path="/registro-enviado" element={<RegistroEnviado />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  document.documentElement.lang = 'pt-BR'
})

describe('Registro enviado', () => {
  it('mostra protocolo, data de São Paulo, local e mensagem da API', () => {
    renderizar(resultado)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Registro enviado' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Nº do registro TL-000042')).toBeInTheDocument()
    // 13:05 UTC = 10:05 no fuso America/Sao_Paulo.
    expect(screen.getByText('15/01/2026, 10:05')).toBeInTheDocument()
    expect(screen.getByText('Rua das Flores, 12')).toBeInTheDocument()
    expect(screen.getByText('Registro recebido com sucesso.')).toBeInTheDocument()
    expect(screen.getByText('Anote o número do registro.')).toBeInTheDocument()
  })

  it('avisa quando uma foto não pôde ser salva', () => {
    renderizar(resultado)
    expect(
      screen.getByText(
        'Uma foto não pôde ser salva, mas o registro foi recebido.',
      ),
    ).toBeInTheDocument()
  })

  it('avisa quando várias fotos não puderam ser salvas', () => {
    renderizar({ ...resultado, fotos: { recebidas: 3, salvas: 1, falhas: 2 } })
    expect(
      screen.getByText('2 fotos não puderam ser salvas, mas o registro foi recebido.'),
    ).toBeInTheDocument()
  })

  it('oferece "Fazer outro registro" e "Voltar ao início"', () => {
    renderizar(resultado)
    const outro = screen.getByRole('link', { name: 'Fazer outro registro' })
    const inicio = screen.getByRole('link', { name: 'Voltar ao início' })
    expect(outro).toHaveAttribute('href', '/registrar')
    expect(inicio).toHaveAttribute('href', '/')
  })

  it('sem estado, mostra mensagem amigável com link para o início', () => {
    renderizar(null)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Registro não encontrado' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Não encontramos os dados de um registro/)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Voltar ao início' }).length).toBeGreaterThan(0)
  })

  it('renderiza sem violações de acessibilidade (axe)', async () => {
    const { container } = renderizar(resultado)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renderiza o estado sem dados sem violações de acessibilidade (axe)', async () => {
    const { container } = renderizar(null)
    expect(await axe(container)).toHaveNoViolations()
  })
})

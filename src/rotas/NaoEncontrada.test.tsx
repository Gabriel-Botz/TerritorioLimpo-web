import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { NaoEncontrada } from './NaoEncontrada'

/*
 * Fase 1 — rota "*": axe sem violações, um h1 e link de volta para o início.
 */

function renderizarNaoEncontrada() {
  return render(
    <MemoryRouter>
      <NaoEncontrada />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  document.documentElement.lang = 'pt-BR'
})

describe('Não encontrada', () => {
  it('renderiza sem violações de acessibilidade (axe)', async () => {
    const { container } = renderizarNaoEncontrada()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('possui um h1 e link para o início', () => {
    renderizarNaoEncontrada()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Página não encontrada')
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/')
  })
})

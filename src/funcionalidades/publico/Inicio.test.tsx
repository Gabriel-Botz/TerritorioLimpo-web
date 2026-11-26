import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { LayoutPublico } from './LayoutPublico'
import { Inicio } from './Inicio'

/*
 * Fase 1 — Início: axe sem violações, CTA para /registrar, âncoras do
 * cabeçalho com alvo existente e menu mobile acessível (aria-expanded + Esc).
 */

function renderizarInicio() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<LayoutPublico />}>
          <Route path="/" element={<Inicio />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  // jsdom não carrega o index.html; o idioma é definido aqui para o axe.
  document.documentElement.lang = 'pt-BR'
})

describe('Início', () => {
  it('renderiza sem violações de acessibilidade (axe)', async () => {
    const { container } = renderizarInicio()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('possui um único h1 com a frase do mockup', () => {
    renderizarInicio()
    const titulos = screen.getAllByRole('heading', { level: 1 })
    expect(titulos).toHaveLength(1)
    expect(titulos[0]).toHaveTextContent('Juntos por um território mais limpo e seguro')
  })

  it('apresenta os quatro cartões e os três passos', () => {
    renderizarInicio()
    for (const titulo of [
      'Registre um ponto',
      'Envie uma foto',
      'Compartilhe a localização',
      'A equipe acompanha',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: titulo })).toBeInTheDocument()
    }
    expect(screen.getByRole('heading', { level: 2, name: 'Como funciona?' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(7) // 4 cartões + 3 passos
  })

  it('exibe os dois avisos institucionais', () => {
    renderizarInicio()
    expect(
      screen.getByText(/não substitui os canais oficiais de emergência/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/não envia solicitações automaticamente a órgãos públicos/),
    ).toBeInTheDocument()
  })

  it('CTA principal leva para /registrar', () => {
    renderizarInicio()
    const cta = screen.getByRole('link', { name: 'Registrar ponto de descarte' })
    expect(cta).toHaveAttribute('href', '/registrar')
  })

  it('âncoras "Sobre" e "Como funciona" apontam para seções existentes', () => {
    const { container } = renderizarInicio()
    const sobre = screen.getByRole('link', { name: 'Sobre' })
    const comoFunciona = screen.getByRole('link', { name: 'Como funciona' })
    expect(sobre).toHaveAttribute('href', '#sobre')
    expect(comoFunciona).toHaveAttribute('href', '#como-funciona')
    expect(container.querySelector('#sobre')).not.toBeNull()
    expect(container.querySelector('#como-funciona')).not.toBeNull()
  })

  it('menu mobile: aria-expanded acompanha a abertura e Esc fecha devolvendo o foco', async () => {
    const usuario = userEvent.setup()
    renderizarInicio()
    const botaoMenu = screen.getByRole('button', { name: 'Menu' })
    const menu = screen.getByRole('navigation', { name: 'Navegação principal' })

    expect(botaoMenu).toHaveAttribute('aria-expanded', 'false')
    expect(botaoMenu).toHaveAttribute('aria-controls', menu.id)

    await usuario.click(botaoMenu)
    expect(botaoMenu).toHaveAttribute('aria-expanded', 'true')

    await usuario.keyboard('{Escape}')
    expect(botaoMenu).toHaveAttribute('aria-expanded', 'false')
    expect(botaoMenu).toHaveFocus()
  })

  it('link "Ir para o conteúdo" é o primeiro elemento e aponta para o main', () => {
    const { container } = renderizarInicio()
    const pular = screen.getByRole('link', { name: 'Ir para o conteúdo' })
    expect(pular).toHaveAttribute('href', '#conteudo')
    expect(container.querySelector('main')).toHaveAttribute('id', 'conteudo')
    expect(container.firstElementChild).toBe(pular)
  })
})

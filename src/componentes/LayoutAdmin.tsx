import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { LayoutDashboard, List, LogOut, Menu, Plus, X } from 'lucide-react'
import { useSessao } from '../autenticacao/useSessao'
import logoProjeto from '../assets/logo-projeto.png'
import { Botao } from './Botao'
import './LayoutAdmin.css'

const itensMenu = [
  { para: '/admin', rotulo: 'Painel', icone: LayoutDashboard, fim: true },
  { para: '/admin/ocorrencias', rotulo: 'Ocorrências', icone: List, fim: false },
  { para: '/registrar', rotulo: 'Novo registro', icone: Plus, fim: false },
] as const

/** Layout do painel da equipe: menu lateral (marinho), cabeçalho com
 *  "Equipe" e Sair, área principal branca. No celular o menu vira botão. */
export function LayoutAdmin() {
  const [menuAberto, setMenuAberto] = useState(false)
  const botaoMenu = useRef<HTMLButtonElement>(null)
  const { sair } = useSessao()
  const navegar = useNavigate()

  useEffect(() => {
    if (!menuAberto) return
    function aoTeclarEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setMenuAberto(false)
        botaoMenu.current?.focus()
      }
    }
    document.addEventListener('keydown', aoTeclarEsc)
    return () => document.removeEventListener('keydown', aoTeclarEsc)
  }, [menuAberto])

  async function aoSair() {
    await sair()
    navegar('/admin/login', { replace: true })
  }

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Ir para o conteúdo
      </a>
      <div className="layout-admin">
        <nav
          id="menu-admin"
          className={`menu-admin${menuAberto ? ' menu-admin--aberto' : ''}`}
          aria-label="Menu da equipe"
        >
          <span className="menu-admin__marca">
            <img src={logoProjeto} width={44} height={26} alt="" />
            <span>
              <strong>Território Limpo</strong>
              <small>Equipe</small>
            </span>
          </span>

          {itensMenu.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              end={item.fim}
              className={({ isActive }) =>
                `menu-admin__item${isActive ? ' menu-admin__item--ativo' : ''}`
              }
              onClick={() => setMenuAberto(false)}
            >
              <item.icone size={20} aria-hidden="true" />
              {item.rotulo}
            </NavLink>
          ))}

          <Botao variante="claro" className="menu-admin__sair" onClick={aoSair}>
            <LogOut size={20} aria-hidden="true" />
            Sair
          </Botao>
        </nav>

        <div className="layout-admin__coluna">
          <header className="topo-admin">
            <button
              ref={botaoMenu}
              type="button"
              className="topo-admin__menu-botao"
              aria-expanded={menuAberto}
              aria-controls="menu-admin"
              onClick={() => setMenuAberto((aberto) => !aberto)}
            >
              {menuAberto ? (
                <X size={20} aria-hidden="true" />
              ) : (
                <Menu size={20} aria-hidden="true" />
              )}
              Menu
            </button>
            <span className="topo-admin__identidade">Equipe</span>
            <Botao variante="contorno" className="topo-admin__sair" onClick={aoSair}>
              <LogOut size={20} aria-hidden="true" />
              Sair
            </Botao>
          </header>

          <main id="conteudo" className="layout-admin__conteudo">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}

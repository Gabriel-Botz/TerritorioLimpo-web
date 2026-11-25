import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Menu, X } from 'lucide-react'
import logoProjeto from '../assets/logo-projeto.png'
import { instituicao } from '../util/instituicao'
import { LinkBotao } from './LinkBotao'
import './CabecalhoSite.css'

/** Cabeçalho público: logotipo, navegação (âncoras da home) e CTA.
 *  No celular os itens ficam no botão "Menu" acessível. */
export function CabecalhoSite() {
  const [menuAberto, setMenuAberto] = useState(false)
  const botaoMenu = useRef<HTMLButtonElement>(null)

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

  function fecharMenu() {
    setMenuAberto(false)
  }

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="cabecalho">
        <div className="cabecalho__conteudo folha">
          <Link to="/" className="cabecalho__marca" onClick={fecharMenu}>
            <img
              src={logoProjeto}
              width={56}
              height={33}
              alt=""
              className="cabecalho__logo"
            />
            <span className="cabecalho__titulos">
              <strong>{instituicao.nomeProjeto}</strong>
              <small>{instituicao.nomeUnidade}</small>
            </span>
          </Link>

          <button
            ref={botaoMenu}
            type="button"
            className="cabecalho__menu-botao"
            aria-expanded={menuAberto}
            aria-controls="menu-do-cabecalho"
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            {menuAberto ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
            Menu
          </button>

          <nav
            id="menu-do-cabecalho"
            className={`cabecalho__menu${menuAberto ? ' cabecalho__menu--aberto' : ''}`}
            aria-label="Navegação principal"
          >
            <Link to="/" onClick={fecharMenu}>
              Início
            </Link>
            <a href="#sobre" onClick={fecharMenu}>
              Sobre
            </a>
            <a href="#como-funciona" onClick={fecharMenu}>
              Como funciona
            </a>
            <LinkBotao variante="claro" to="/registrar" className="cabecalho__acao">
              Registrar ponto
            </LinkBotao>
          </nav>
        </div>
      </header>
    </>
  )
}

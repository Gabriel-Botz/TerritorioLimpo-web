import { Outlet } from 'react-router'
import { CabecalhoSite } from '../../componentes/CabecalhoSite'
import { RodapeSite } from '../../componentes/RodapeSite'

/** Moldura das páginas públicas: cabeçalho, conteúdo e rodapé. */
export function LayoutPublico() {
  return (
    <>
      <CabecalhoSite />
      <main id="conteudo" className="folha" style={{ paddingBlock: '2rem' }}>
        <Outlet />
      </main>
      <RodapeSite />
    </>
  )
}

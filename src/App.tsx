import { ProvedorSessao } from './autenticacao/ContextoSessao'
import { AplicativoRotas } from './rotas/AplicativoRotas'

export default function App() {
  return (
    <ProvedorSessao>
      <AplicativoRotas />
    </ProvedorSessao>
  )
}

import { Navigate, Route, Routes } from 'react-router'
import { RotaProtegida } from '../autenticacao/RotaProtegida'
import { LayoutAdmin } from '../componentes/LayoutAdmin'
import { DetalheOcorrencia } from '../funcionalidades/admin/DetalheOcorrencia'
import { ListaOcorrencias } from '../funcionalidades/admin/ListaOcorrencias'
import { LoginEquipe } from '../funcionalidades/admin/LoginEquipe'
import { PainelEquipe } from '../funcionalidades/admin/PainelEquipe'
import { Inicio } from '../funcionalidades/publico/Inicio'
import { LayoutPublico } from '../funcionalidades/publico/LayoutPublico'
import { RegistrarOcorrencia } from '../funcionalidades/publico/RegistrarOcorrencia'
import { RegistroEnviado } from '../funcionalidades/publico/RegistroEnviado'
import { GerenciadorTituloFoco } from './GerenciadorTituloFoco'
import { NaoEncontrada } from './NaoEncontrada'

/** Árvore de rotas do aplicativo. */
export function AplicativoRotas() {
  return (
    <>
      <GerenciadorTituloFoco />
      <Routes>
        <Route element={<LayoutPublico />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/registrar" element={<RegistrarOcorrencia />} />
          <Route path="/registro-enviado" element={<RegistroEnviado />} />
          <Route path="/admin/login" element={<LoginEquipe />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RotaProtegida>
              <LayoutAdmin />
            </RotaProtegida>
          }
        >
          <Route index element={<PainelEquipe />} />
          <Route path="ocorrencias" element={<ListaOcorrencias />} />
          <Route path="ocorrencias/:id" element={<DetalheOcorrencia />} />
        </Route>

        <Route path="/inicio" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </>
  )
}

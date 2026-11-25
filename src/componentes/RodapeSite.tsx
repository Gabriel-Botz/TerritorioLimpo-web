import { Link } from 'react-router'
import logoUnifase from '../assets/logo-unifase.png'
import { instituicao } from '../util/instituicao'
import './RodapeSite.css'

/** Rodapé institucional: unidade, slogan, faixa clara de realização e
 *  link discreto para o painel da equipe. */
export function RodapeSite() {
  return (
    <footer className="rodape">
      <div className="rodape__principal folha">
        <div>
          <p className="rodape__unidade">
            {instituicao.nomeUnidade} · {instituicao.municipio}
          </p>
          <p className="rodape__slogan">{instituicao.slogan}</p>
        </div>
        <Link to="/admin/login" className="rodape__painel">
          Painel da equipe
        </Link>
      </div>
      <div className="rodape__realizacao">
        <div className="rodape__realizacao-conteudo folha">
          <span className="rodape__realizacao-rotulo">Realização</span>
          <img
            src={logoUnifase}
            width={220}
            height={55}
            alt="UNIFASE — Centro Universitário Arthur Sá Earp Neto"
          />
        </div>
      </div>
    </footer>
  )
}

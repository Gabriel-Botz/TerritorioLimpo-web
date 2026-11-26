import { Camera, CircleCheck, ListChecks, MapPin, TriangleAlert } from 'lucide-react'
import heroWebp from '../../assets/hero-territorio.webp'
import heroJpg from '../../assets/hero-territorio.jpg'
import { Cartao } from '../../componentes/Cartao'
import { LinkBotao } from '../../componentes/LinkBotao'
import { instituicao } from '../../util/instituicao'
import './Inicio.css'

const cartoes = [
  {
    icone: MapPin,
    titulo: 'Registre um ponto',
    texto: 'Informe onde há descarte irregular de lixo ou entulho no território.',
  },
  {
    icone: Camera,
    titulo: 'Envie uma foto',
    texto: 'Uma imagem ajuda a equipe a reconhecer o local e o tipo de material.',
  },
  {
    icone: CircleCheck,
    titulo: 'Compartilhe a localização',
    texto: 'A coordenada registrada guia a equipe até o ponto indicado.',
  },
  {
    icone: ListChecks,
    titulo: 'A equipe acompanha',
    texto: instituicao.fraseEquipeAcompanha,
  },
] as const

const passos = [
  {
    numero: 1,
    titulo: 'Registre o ponto',
    texto: 'Descreva a situação e indique onde o descarte está acontecendo.',
  },
  {
    numero: 2,
    titulo: 'Envie foto e localização',
    texto: 'Anexe uma imagem e compartilhe a coordenada do local.',
  },
  {
    numero: 3,
    titulo: 'A equipe analisa e acompanha',
    texto: 'O registro passa a ser acompanhado pela equipe de saúde da unidade.',
  },
] as const

/** Home pública: apresentação, cartões de como ajudar, passos e avisos. */
export function Inicio() {
  return (
    <article className="inicio">
      <section className="inicio__destaque" aria-labelledby="titulo-inicio">
        <div className="inicio__destaque-texto">
          <h1 id="titulo-inicio">Juntos por um território mais limpo e seguro</h1>
          <p className="inicio__descricao">
            A {instituicao.nomeProjeto} é a plataforma da {instituicao.nomeUnidade} para registrar
            pontos de descarte irregular de lixo e entulho no território. O morador indica o local,
            envia uma foto e compartilha a coordenada; a equipe recebe o registro e acompanha cada
            caso.
          </p>
          <LinkBotao to="/registrar">Registrar ponto de descarte</LinkBotao>
        </div>
        <picture className="inicio__imagem">
          <source srcSet={heroWebp} type="image/webp" />
          <img src={heroJpg} width={1280} height={801} alt="Casas entre morros verdes" />
        </picture>
      </section>

      <section className="inicio__secao" aria-label="Como ajudar">
        <ul className="inicio__cartoes">
          {cartoes.map((cartao) => (
            <li key={cartao.titulo}>
              <Cartao className="inicio__cartao">
                <cartao.icone size={28} aria-hidden="true" className="inicio__cartao-icone" />
                <h2>{cartao.titulo}</h2>
                <p>{cartao.texto}</p>
              </Cartao>
            </li>
          ))}
        </ul>
      </section>

      <section id="sobre" className="inicio__secao" aria-labelledby="titulo-sobre">
        <h2 id="titulo-sobre">Sobre a {instituicao.nomeProjeto}</h2>
        <p>
          A {instituicao.nomeProjeto} aproxima moradores e equipe de saúde da{' '}
          {instituicao.nomeUnidade} no cuidado com o território. Qualquer pessoa pode registrar um
          ponto de descarte irregular. {instituicao.slogan} {instituicao.frasePrivacidade}
        </p>
      </section>

      <section id="como-funciona" className="inicio__secao" aria-labelledby="titulo-como-funciona">
        <h2 id="titulo-como-funciona">Como funciona?</h2>
        <ol className="inicio__passos">
          {passos.map((passo) => (
            <li key={passo.numero} className="inicio__passo">
              <span className="inicio__passo-numero" aria-hidden="true">
                {passo.numero}
              </span>
              <div>
                <h3>{passo.titulo}</h3>
                <p>{passo.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="inicio__avisos" aria-label="Avisos importantes">
        <div className="inicio__aviso">
          <TriangleAlert size={20} aria-hidden="true" />
          <p>{instituicao.avisoEmergencia}</p>
        </div>
        <div className="inicio__aviso">
          <TriangleAlert size={20} aria-hidden="true" />
          <p>{instituicao.avisoEncaminhamento}</p>
        </div>
      </section>
    </article>
  )
}

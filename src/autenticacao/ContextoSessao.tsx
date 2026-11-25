import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { definirAcaoSessaoExpirada } from '../api/http'
import { Contexto, type ValorContextoSessao } from './contexto'
import { clienteSupabase, supabaseConfigurado } from './supabase'

export function ProvedorSessao({ children }: { children: ReactNode }) {
  // Sem Supabase configurado o login não carrega: começa pronto (false).
  const [sessao, setSessao] = useState<ValorContextoSessao['sessao']>(null)
  const [carregando, setCarregando] = useState(supabaseConfigurado)
  const navegar = useNavigate()

  useEffect(() => {
    definirAcaoSessaoExpirada(() => {
      navegar('/admin/login', {
        replace: true,
        state: { aviso: 'Sua sessão expirou. Entre novamente.' },
      })
    })
    return () => definirAcaoSessaoExpirada(null)
  }, [navegar])

  useEffect(() => {
    if (!clienteSupabase) return

    let ativo = true

    clienteSupabase.auth.getSession().then(({ data }) => {
      if (ativo) {
        setSessao(data.session)
        setCarregando(false)
      }
    })

    const {
      data: { subscription },
    } = clienteSupabase.auth.onAuthStateChange((_evento, novaSessao) => {
      if (ativo) setSessao(novaSessao)
    })

    return () => {
      ativo = false
      subscription.unsubscribe()
    }
  }, [])

  /** Devolve a mensagem de erro ou `null` em caso de sucesso. */
  async function entrar(email: string, senha: string): Promise<string | null> {
    if (!clienteSupabase) {
      return 'Login não configurado neste ambiente. Procure a coordenação da equipe.'
    }
    const { error } = await clienteSupabase.auth.signInWithPassword({ email, password: senha })
    if (!error) return null
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return 'E-mail ou senha incorretos.'
    }
    return 'Não foi possível entrar agora. Verifique sua internet e tente de novo.'
  }

  async function sair(): Promise<void> {
    await clienteSupabase?.auth.signOut()
  }

  const valor: ValorContextoSessao = {
    carregando,
    sessao,
    autenticado: sessao !== null,
    configurado: supabaseConfigurado,
    entrar,
    sair,
  }

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

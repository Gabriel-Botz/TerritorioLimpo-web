/*
 * Cliente Supabase — usado SOMENTE para autenticação (login da equipe).
 * As variáveis são chaves públicas; nenhum segredo vive no front.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chaveAnonima = import.meta.env.VITE_SUPABASE_ANON_KEY

/** false quando o login ainda não foi configurado (ex.: ambiente sem .env.local). */
export const supabaseConfigurado = Boolean(url && chaveAnonima)

export const clienteSupabase: SupabaseClient | null =
  url && chaveAnonima ? createClient(url, chaveAnonima) : null

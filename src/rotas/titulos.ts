/**
 * Título do documento por rota (React Router, caminho ou padrão com `:id`).
 * O sufixo comum é aplicado em GerenciadorTituloFoco.
 */

export const titulosRotas: Record<string, string> = {
  '/': 'Início',
  '/registrar': 'Registrar ponto de descarte',
  '/registro-enviado': 'Registro enviado',
  '/admin/login': 'Entrar na equipe',
  '/admin': 'Painel da equipe',
  '/admin/ocorrencias': 'Ocorrências',
  '/admin/ocorrencias/:id': 'Ocorrência',
}

export const sufixoTitulo = ' · Território Limpo'

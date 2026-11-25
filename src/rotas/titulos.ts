/**
 * Título do documento por rota (React Router, caminho ou padrão com `:id`).
 * O sufixo comum é aplicado em GerenciadorTituloFoco.
 */

export const titulosRotas: Record<string, string> = {
  '/': 'Início',
  '/registrar': 'Registrar ponto',
  '/registro-enviado': 'Registro recebido',
  '/admin/login': 'Entrar na equipe',
  '/admin': 'Painel da equipe',
  '/admin/ocorrencias': 'Ocorrências',
  '/admin/ocorrencias/:id': 'Ocorrência',
}

export const sufixoTitulo = ' · Território Limpo'

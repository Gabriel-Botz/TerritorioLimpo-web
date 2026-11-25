# API-FRONT — Guia completo para implementar o frontend do Território Limpo

Documento de referência com **toda a estrutura da API e todas as informações necessárias** para começar a implementar o frontend.

- **Projetos:** `TerritorioLimpo-api` (backend) e `TerritorioLimpo-web` (frontend) na raiz de `projects/`
- **Data de referência:** novembro/2026 — gerado a partir do código-fonte da API
- **Companion:** `TerritorioLimpo-api-descritivo.md` (arquitetura e fluxos internos da API). Este documento é o **contrato HTTP + arquitetura do front**.

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Estado atual dos dois projetos](#2-estado-atual-dos-dois-projetos)
3. [Ambiente e execução](#3-ambiente-e-execução)
4. [Fundação do frontend](#4-fundação-do-frontend)
5. [Autenticação](#5-autenticação)
6. [Cliente HTTP e tratamento de erros](#6-cliente-http-e-tratamento-de-erros)
7. [Referência de endpoints](#7-referência-de-endpoints)
8. [Enums e labels pt-BR](#8-enums-e-labels-pt-br)
9. [Regras de negócio que o frontend deve implementar](#9-regras-de-negócio-que-o-frontend-deve-implementar)
10. [Tipos TypeScript](#10-tipos-typescript)
11. [Arquitetura proposta do frontend](#11-arquitetura-proposta-do-frontend)
12. [Armadilhas conhecidas](#12-armadilhas-conhecidas)
13. [Divergências encontradas na documentação existente](#13-divergências-encontradas-na-documentação-existente)
14. [Checklist de implementação](#14-checklist-de-implementação)

---

## 1. Visão geral

Sistema para registrar e acompanhar pontos de descarte irregular de resíduos em Petrópolis/RJ. A API tem **dois mundos claramente separados**:

| Mundo | Quem | Como acessa |
| --- | --- | --- |
| **Público** | Morador, sem conta, sem dados pessoais | `POST /api/v1/public/ocorrencias` (multipart, até 3 fotos) |
| **Administrativo** | Equipe autenticada | Todas as rotas `/api/v1/admin/**`, exigem JWT Supabase com papel `ADMIN` |

### Stack

| Camada | Tecnologia |
| --- | --- |
| **API** | Java 21, Spring Boot 4.1.2, Spring Security + OAuth2 Resource Server (JWT), Spring Data JPA + PostgreSQL 17, Flyway, Bucket4j (rate limit), Cloudflare Turnstile (CAPTCHA), Supabase Storage |
| **Front (atual)** | React 19.3, TypeScript 6, Vite 8, React Router 8, `@supabase/supabase-js` 2, `@marsidev/react-turnstile` 1.6 |

### Conceitos de domínio

- **Ocorrência** — registro de um ponto de descarte irregular. Tem número sequencial (`number`), UUID interno (`id`), situação, prioridade, localização e fotos.
- **Situação (status)** — fluxo de vida da ocorrência (recebida → em análise → encaminhada → …).
- **Prioridade** — nível `BAIXA`/`MEDIA`/`ALTA` calculado automaticamente por pontos, ou definido manualmente pela equipe.
- **Encaminhamento** — registro de que a equipe enviou a ocorrência a um serviço municipal (destino, canal, protocolo, texto).
- **Observação interna** — nota da equipe. **Nunca** aparece no CSV nem no texto de encaminhamento.
- **Histórico** — trilha de todas as transições de situação.

---

## 2. Estado atual dos dois projetos

### 2.1 `TerritorioLimpo-api`

Backend completo e testado (76 testes locais, `./mvnw verify`). Estrutura:

```text
src/main/java/territorio_limpo_api/
├── TerritorioLimpoApiApplication.java
├── abuse/          # rate limit, Turnstile, resolução de IP
├── common/         # exceções, tratador global, normalização, PaginaResponse, Clock
├── config/         # propriedades tipadas, SecurityFilterChain/CORS, verificação de produção
├── encaminhamento/ # encaminhamentos + gerador do texto de solicitação
├── export/         # exportação CSV (streaming, lotes de 500)
├── foto/           # processamento (reencode/EXIF) e metadados de fotos
├── historico/      # histórico de transição de situação
├── indicadores/    # leitura da view v_indicadores (JdbcTemplate)
├── observacao/     # notas internas da equipe
├── ocorrencia/     # domínio + controllers/serviços público e admin (+ dto/)
├── prioridade/     # cálculo transparente de prioridade
└── storage/        # cliente REST do Supabase Storage
```

Arquitetura em camadas: **Controller** (HTTP/validação) → **Service** (regras, transação) → **Repository** (Spring Data/Specifications) → **PostgreSQL**. DTOs são `record` Java, sem Lombok.

### 2.2 `TerritorioLimpo-web`

**Ainda é o scaffold inicial do Vite.** `src/App.tsx` contém o template de exemplo (contador + logos) — nada de lógica de negócio foi escrito.

Dependências já instaladas (`package.json`):

```json
"dependencies": {
  "@marsidev/react-turnstile": "^1.6.3",
  "@supabase/supabase-js": "^2.119.2",
  "react": "^19.3.1",
  "react-dom": "^19.3.1",
  "react-router": "^8.5.2"
}
```

**Não instalado** (decidir se entra): biblioteca de data-fetch (React Query/TanStack), biblioteca de forms (react-hook-form), `zod` (existe só como dependência transitiva), biblioteca de UI/CSS, biblioteca de mapa.

Scripts: `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`.

---

## 3. Ambiente e execução

### 3.1 Subir a API

```powershell
# 1. Banco local (PostgreSQL 17 em localhost:5432, db/user/senha territorio_limpo/postgres/postgres)
cd TerritorioLimpo-api
docker compose up -d

# 2. API no perfil dev (Swagger habilitado)
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"

# 3. Verificar
curl http://localhost:8080/actuator/health   # → {"status":"UP"}
```

- Porta padrão: **8080** (`PORT`).
- Flyway aplica as migrations automaticamente no startup.
- Swagger UI: `http://localhost:8080/swagger-ui.html` — **somente no perfil `dev`**.
- Sem as variáveis do Supabase, o registro público continua funcionando; as fotos falham de forma controlada (`fotos.failed > 0` na resposta).

### 3.2 Subir o front

```powershell
cd TerritorioLimpo-web
npm run dev
```

O Vite roda em `http://localhost:5173` por padrão — que é **exatamente** a origem CORS default da API (`http://localhost:5173`). Se a porta mudar, ajuste `CORS_ALLOWED_ORIGINS` na API.

### 3.3 Variáveis de ambiente do front

Criar `TerritorioLimpo-web/.env.local` (não versionado):

```bash
# URL base da API
VITE_API_URL=http://localhost:8080

# Supabase Auth (painel admin)
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon

# Cloudflare Turnstile (opcional; só se estiver ativo na API)
VITE_TURNSTILE_SITE_KEY=
```

> **Importante:** as variáveis do Supabase e do Turnstile no front são as chaves **públicas** (anon key / site key). A `SUPABASE_SERVICE_KEY` e o `TURNSTILE_SECRET` ficam **apenas** no servidor da API.

### 3.4 CORS — o que a API aceita

| Item | Valor |
| --- | --- |
| Origens | `app.cors.allowed-origins` (env `CORS_ALLOWED_ORIGINS`; default dev: `http://localhost:5173`) — lista explícita, **sem wildcard** |
| Métodos | `GET, POST, PATCH, DELETE, OPTIONS` |
| Headers permitidos | `Authorization, Content-Type, Idempotency-Key, X-Turnstile-Token` |
| Headers expostos | `Retry-After`, `Content-Disposition` |
| `Max-Age` | 3600 s |

Consequências práticas para o front:

- **Não** é possível usar headers customizados além dos quatro listados (ex.: `X-Custom` será bloqueado no preflight).
- Para ler `Retry-After` (429) e `Content-Disposition` (CSV) via `fetch`, os headers **já estão expostos** — nenhum ajuste extra necessário.
- Em produção a origem é obrigatória e **não pode conter `*`**.

### 3.5 Configuração do Supabase (uma vez)

1. **Bucket privado** de fotos: `SUPABASE_BUCKET` (default `ocorrencia-photos`). Desmarcado como público, sem policies. A API usa a service key e devolve URLs assinadas de 10 min.
2. **Usuário admin** em *Authentication → Users*, com em *Raw App Meta Data*:
   ```json
   { "app_role": "ADMIN" }
   ```
3. **JWT**: copie a URL do JWKS (`SUPABASE_JWKS_URI`) **ou** o segredo HS256 (`SUPABASE_JWT_SECRET`) + o emissor (`SUPABASE_JWT_ISSUER`) para as variáveis da API. JWKS é a forma recomendada.

---

## 4. Fundação do frontend

### 4.1 Estrutura de pastas proposta

```text
TerritorioLimpo-web/
├── .env.local
├── index.html
├── vite.config.ts
└── src/
    ├── main.tsx                  # mount + providers (Router, Auth, Turnstile)
    ├── App.tsx                   # rotas
    ├── styles/                   # tokens, globais, utilitários
    ├── types/
    │   ├── api.ts                # DTOs espelhados da API (§10)
    │   └── problem.ts            # ProblemDetail / erros
    ├── lib/
    │   ├── http.ts               # cliente fetch central (§6)
    │   ├── supabase.ts           # cliente Supabase
    │   └── format.ts             # datas (America/Sao_Paulo), números, labels
    ├── api/                      # uma função por endpoint, tipada
    │   ├── ocorrenciasPublicas.ts
    │   ├── ocorrenciasAdmin.ts
    │   ├── fotos.ts
    │   ├── encaminhamentos.ts
    │   ├── indicadores.ts
    │   └── export.ts
    ├── features/
    │   ├── publico/              # formulário de registro
    │   └── admin/
    │       ├── auth/             # login, guarda de rota, sessão
    │       ├── lista/            # listagem + filtros + paginação
    │       ├── detalhe/          # detalhe com abas
    │       ├── indicadores/      # painel de indicadores
    │       └── export/           # download do CSV
    ├── components/               # componentes genéricos (Button, Field, Badge…)
    └── routes/                   # roteadores e layouts
```

### 4.2 Camada `src/api`

Uma função por endpoint, todas usando o `http.ts`, todas tipadas com os modelos do §10. **Nenhum componente faz `fetch` direto.**

```ts
// src/api/ocorrenciasAdmin.ts
import { http } from '../lib/http'
import type { AdminOcorrenciaDetail, AdminOcorrenciaListItem, Pagina, FiltrosOcorrencia } from '../types/api'

export async function listarOcorrencias(filtros: FiltrosOcorrencia): Promise<Pagina<AdminOcorrenciaListItem>> {
  const query = new URLSearchParams()
  if (filtros.status) query.set('status', filtros.status)
  if (filtros.type) query.set('type', filtros.type)
  if (filtros.prioridade) query.set('prioridade', filtros.prioridade)
  if (filtros.hasCoordinates !== undefined) query.set('hasCoordinates', String(filtros.hasCoordinates))
  if (filtros.from) query.set('from', filtros.from)   // yyyy-MM-dd
  if (filtros.to) query.set('to', filtros.to)         // yyyy-MM-dd
  if (filtros.q) query.set('q', filtros.q)
  query.set('page', String(filtros.page ?? 0))
  query.set('size', String(filtros.size ?? 20))
  return http.get<Pagina<AdminOcorrenciaListItem>>(`/api/v1/admin/ocorrencias?${query}`)
}
```

### 4.3 Roteamento

```text
/                        → Formulário público (sem autenticação)
/admin/login             → Login Supabase
/admin                   → Layout protegido (exige sessão + app_role=ADMIN)
  ├── (index)            → Indicadores (painel)
  ├── ocorrencias        → Lista com filtros + paginação
  ├── ocorrencias/:id    → Detalhe (histórico, encaminhamentos, notas, fotos)
  └── ocorrencias/export → Download CSV (pode ser botão na lista)
```

Guarda de rota: ler a sessão do Supabase (`supabase.auth.getSession()`), validar presença do token, e **tratar 403 como "usuário sem papel ADMIN"** (mensagem clara + logout), porque a API emite 403 para token válido sem `app_metadata.app_role = "ADMIN"`.

---

## 5. Autenticação

### 5.1 Fluxo

```text
Front (Supabase Auth)  →  email/senha  →  JWT (access token)
                                              │
                        Authorization: Bearer <JWT>
                                              │
                              API (resource server)
                                              │
                    lê JWT.app_metadata.app_role  ===  "ADMIN" ?
                              │                    │
                             sim                  não → ROLE_ADMIN    → autoridade vazia
                              │                                        │
                        hasRole("ADMIN") → 200                  401 / 403
```

1. O painel autentica no **Supabase Auth** (`supabase.auth.signInWithPassword`).
2. O front envia `Authorization: Bearer <access_token>` em **todas** as chamadas `/api/v1/admin/**`.
3. A API decodifica o JWT (JWKS ou HS256) e lê `app_metadata[admin_roleClaim]` (default `app_role`).
4. Se o valor for `ADMIN` (default) → autoridade `ROLE_ADMIN`. Caso contrário → lista **vazia**.
5. O `sub` do JWT identifica o operador em todas as ações auditáveis (histórico, notas, encaminhamentos, remoção de fotos).

### 5.2 Estados de erro que o front precisa distinguir

| HTTP | Quando | Ação do front |
| --- | --- | --- |
| **401** | Token ausente, expirado ou inválido | Refresh do token Supabase; se falhar → redirect `/admin/login` |
| **403** | Token válido, mas **sem** `app_role=ADMIN` | Mostrar "usuário sem permissão de administrador" + logout. **Não** mandar para login (a senha está certa) |
| **401** no login | Credenciais erradas | Mensagem de erro no formulário |

Resposta de segurança (RFC 9457):

```json
{
  "type": "urn:territorio-limpo:error:security",
  "title": "Não autenticado",
  "status": 401,
  "detail": "É necessário estar autenticado para acessar este recurso."
}
```

Para 403: `"title": "Acesso negado"`, `"detail": "Seu usuário não tem permissão para acessar este recurso."`

### 5.3 Configuração no Supabase

Usuário criado em **Authentication → Users** com *Raw App Meta Data*:

```json
{ "app_role": "ADMIN" }
```

Claims esperadas no JWT: `sub`, `app_metadata`, `iss` (se `SUPABASE_JWT_ISSUER` configurado).

---

## 6. Cliente HTTP e tratamento de erros

### 6.1 Cliente central (`src/lib/http.ts`)

Responsabilidades:

1. Prefixar `VITE_API_URL`.
2. Injetar `Authorization` (token Supabase) quando for rota admin.
3. Parsear **Problem Details** em um erro tipado.
4. Mapear status para ações (401 → refresh/logout, 403 → sem papel, 429 → espera).
5. Tratar `Content-Disposition` no export e `Retry-After` no rate limit.

```ts
// src/lib/http.ts (esqueleto)
export class ApiError extends Error {
  constructor(
    public status: number,
    public type: string,        // urn:territorio-limpo:error:*
    public title: string,
    public detail: string,
    public errors?: { field: string; message: string }[],
    public retryAfterSeconds?: number,
    public correlationId?: string,
    public instance?: string,
  ) { super(detail) }
}

async function parseError(res: Response): Promise<never> {
  let body: any = null
  try { body = await res.json() } catch { /* corpo vazio */ }
  throw new ApiError(
    res.status,
    body?.type ?? 'about:blank',
    body?.title ?? 'Erro',
    body?.detail ?? `Falha na requisição (${res.status})`,
    body?.errors,
    body?.retryAfterSeconds,
    body?.correlationId,
    body?.instance,
  )
}
```

### 6.2 Formato de erro — RFC 9457 (Problem Details)

Toda resposta de erro da API é `application/problem+json`, em pt-BR:

```json
{
  "type": "urn:territorio-limpo:error:validation",
  "title": "Dados inválidos",
  "status": 400,
  "detail": "Verifique os campos informados e tente novamente.",
  "errors": [
    { "field": "latitude", "message": "Informe as duas coordenadas ou nenhuma." }
  ]
}
```

> **Nota:** o README da API mostra um campo `instance` no exemplo, mas **o código não emite `instance`** (ver §13). Não dependa dele.

**Todos os `type` conhecidos:**

| `type` (sufixo após `urn:territorio-limpo:error:`) | HTTP | Tem `errors[]` | Extra |
| --- | --- | --- | --- |
| `validation` | 400 | **sim** | — |
| `api` | conforme (400/404/409/422/503…) | se houver | — |
| `malformed-body` | 400 | não | — |
| `missing-part` | 400 | **sim** (campo = nome da parte) | — |
| `missing-parameter` | 400 | **sim** | — |
| `invalid-parameter` | 400 | **sim** | — |
| `file-too-large` | 413 | não | — |
| `data-conflict` | 409 | não | — |
| `not-found` | 404 | não | — |
| `rate-limit` | 429 | não | `retryAfterSeconds` + header `Retry-After` |
| `internal-error` | 500 | não | `correlationId` |
| `security` | 401 / 403 | não | emitido fora do `@RestControllerAdvice` |

**Shape do `errors[]`:**

```ts
interface ErroCampo { field: string; message: string }
```

**Mapeamento status → situação no front:**

| Status | Significado | UI sugerida |
| --- | --- | --- |
| 400 | Dados inválidos / regra de validação | Marcar campos com `errors[]` |
| 401 | Não autenticado | Refresh → login |
| 403 | Sem papel ADMIN | Aviso de permissão + logout |
| 404 | Recurso não existe | Página "não encontrada" |
| 409 | Conflito (ex.: mesma situação) | Toast de aviso, não é erro de preenchimento |
| 413 | Foto > 5 MB | Erro no uploader |
| 422 | Regra de negócio não atendida | Toast com `detail` (mensagem já vem em pt-BR) |
| 429 | Rate limit | Toast com `detail` + espera informada em `retryAfterSeconds` |
| 500 | Erro inesperado | Toast genérico + `correlationId` para suporte |
| 503 | Storage/Turnstile indisponível | Toast de indisponibilidade |

### 6.3 Exemplos de payloads de erro reais

**Validação de formulário público (400):**

```json
{
  "type": "urn:territorio-limpo:error:validation",
  "title": "Dados inválidos",
  "status": 400,
  "detail": "Verifique os campos informados e tente novamente.",
  "errors": [
    { "field": "localizacaoPresent", "message": "Informe o endereço, um ponto de referência ou use sua localização." }
  ]
}
```

**Idempotency-Key inválida (400):**

```json
{
  "type": "urn:territorio-limpo:error:api",
  "title": "Dados inválidos",
  "status": 400,
  "detail": "O identificador de reenvio é inválido.",
  "errors": [
    { "field": "Idempotency-Key", "message": "Informe um UUID válido." }
  ]
}
```

**Foto inválida (400)** — campo sempre `fotos`:

```json
{
  "type": "urn:territorio-limpo:error:api",
  "title": "Dados inválidos",
  "status": 400,
  "detail": "Envie apenas fotos em JPEG ou PNG.",
  "errors": [{ "field": "fotos", "message": "Envie apenas fotos em JPEG ou PNG." }]
}
```

**Rate limit (429)** + header `Retry-After: 1832`:

```json
{
  "type": "urn:territorio-limpo:error:rate-limit",
  "title": "Muitos envios",
  "status": 429,
  "detail": "Você fez muitos envios em pouco tempo. Aguarde alguns minutos e tente novamente.",
  "retryAfterSeconds": 1832
}
```

**Turnstile ausente (400):**

```json
{
  "type": "urn:territorio-limpo:error:api",
  "title": "Dados inválidos",
  "status": 400,
  "detail": "Confirme que você não é um robô e tente novamente."
}
```

**Conflito de situação (409):**

```json
{
  "type": "urn:territorio-limpo:error:api",
  "title": "Conflito",
  "status": 409,
  "detail": "A ocorrência já está nesta situação."
}
```

**Regra de negócio (422):**

```json
{
  "type": "urn:territorio-limpo:error:api",
  "title": "Regra de negócio não atendida",
  "status": 422,
  "detail": "Informe a confirmação de que o local foi atendido para marcar como resolvida."
}
```

**Erro inesperado (500):**

```json
{
  "type": "urn:territorio-limpo:error:internal-error",
  "title": "Erro inesperado",
  "status": 500,
  "detail": "Não foi possível concluir a operação. Tente novamente mais tarde.",
  "correlationId": "3f2a…-uuid"
}
```

---

## 7. Referência de endpoints

> **A tabela abaixo usa os caminhos REAIS do código.** O `README.md` da API lista rotas em inglês (`/occurrences`, `/photos`, `/notes`…) que **não existem** — ver §13.

### 7.1 Mapa geral

| # | Método | Caminho | Auth | Descrição |
| --- | --- | --- | --- | --- |
| 1 | `POST` | `/api/v1/public/ocorrencias` | público | Registra ocorrência (multipart) |
| 2 | `GET` | `/actuator/health` | público | Saúde da aplicação |
| 3 | `GET` | `/api/v1/admin/ocorrencias` | ADMIN | Lista paginada com filtros |
| 4 | `GET` | `/api/v1/admin/ocorrencias/{id}` | ADMIN | Detalhe completo |
| 5 | `GET` | `/api/v1/admin/ocorrencias/{id}/fotos` | ADMIN | Fotos com URLs assinadas |
| 6 | `DELETE` | `/api/v1/admin/ocorrencias/{id}/fotos/{fotoId}` | ADMIN | Remove uma foto |
| 7 | `PATCH` | `/api/v1/admin/ocorrencias/{id}/status` | ADMIN | Muda situação |
| 8 | `PATCH` | `/api/v1/admin/ocorrencias/{id}/prioridade` | ADMIN | Prioridade manual |
| 9 | `PATCH` | `/api/v1/admin/ocorrencias/{id}/vulneravel-area` | ADMIN | Marca/desmarca área vulnerável |
| 10 | `PATCH` | `/api/v1/admin/ocorrencias/{id}/localizacao` | ADMIN | Confirma/corrige coordenadas |
| 11 | `POST` | `/api/v1/admin/ocorrencias/{id}/observacaos` | ADMIN | Nota interna |
| 12 | `GET` | `/api/v1/admin/ocorrencias/{id}/encaminhamento-text` | ADMIN | Texto de solicitação (não grava) |
| 13 | `POST` | `/api/v1/admin/ocorrencias/{id}/encaminhamentos` | ADMIN | Registra encaminhamento |
| 14 | `GET` | `/api/v1/admin/ocorrencias/export.csv` | ADMIN | Exporta CSV (mesmos filtros) |
| 15 | `GET` | `/api/v1/admin/indicadores` | ADMIN | Indicadores agregados |
| 16 | `GET` | `/v3/api-docs/**`, `/swagger-ui/**` | público (só `dev`) | OpenAPI/Swagger |

> Qualquer rota fora dessas e dos prefixos liberados recebe **403** por `denyAll`.

---

### 7.2 `POST /api/v1/public/ocorrencias`

Registra uma ocorrência. **Não exige autenticação.**

- **Content-Type:** `multipart/form-data`
- **Parte `data`** (obrigatória): JSON — **deve ter `Content-Type: application/json`** no cabeçalho da parte.
- **Parte `fotos`** (opcional): 0 a 3 `MultipartFile`.
- **Headers:**
  - `Idempotency-Key` — UUID opcional. Reenvio com a mesma chave devolve `200` com o registro original (não duplica).
  - `X-Turnstile-Token` — **obrigatório** quando `TURNSTILE_ENABLED=true` (padrão em prod).

**Request — campos de `data`:**

| Campo | Tipo | Obrigatório | Restrições |
| --- | --- | --- | --- |
| `type` | enum `OcorrenciaType` | **sim** | ver §8 |
| `estimatedVolume` | enum `VolumeEstimado` | **sim** | ver §8 |
| `collectionAcesso` | enum `AcessoColeta` | **sim** | ver §8 |
| `drenagemRisk` | enum `RiscoDrenagem` | **sim** | ver §8 |
| `observacaos` | string | não | ≤ 1000 chars |
| `latitude` | number | não | −90…90; **par obrigatório com `longitude`** |
| `longitude` | number | não | −180…180; **par obrigatório com `latitude`** |
| `precisaoMeters` | number | não | ≥ 0 |
| `addressText` | string | não | ≤ 300 chars |
| `referenciaPoint` | string | não | ≤ 300 chars |

**Regras `@AssertTrue` (viram `errors[]` no 400):**

1. `coordinatesPairValid` — latitude e longitude juntas ou nenhuntas.
2. `localizacaoPresent` — **ao menos uma** forma de localização: coordenadas, `addressText` **ou** `referenciaPoint`.

Exemplo de request:

```http
POST /api/v1/public/ocorrencias
Idempotency-Key: 6f1c9a2e-4c4d-4a11-9a6e-0b7f3d2a1c88
Content-Type: multipart/form-data; boundary=----x

------x
Content-Disposition: form-data; name="data"
Content-Type: application/json

{
  "type": "ENTULHO",
  "estimatedVolume": "MEDIO",
  "collectionAcesso": "DIFICIL",
  "drenagemRisk": "NAO_SEI",
  "observacaos": "Acumulado há duas semanas",
  "latitude": -22.505,
  "longitude": -43.178,
  "precisaoMeters": 12.5,
  "addressText": "Rua das Flores, 100",
  "referenciaPoint": "perto da escola"
}
------x
Content-Disposition: form-data; name="fotos"; filename="foto1.jpg"
Content-Type: image/jpeg

<bytes>
------x--
```

**Response — `201 Created` (novo) ou `200 OK` (replay de idempotência):**

```json
{
  "number": 42,
  "createdAt": "2026-11-24T13:05:00.123456Z",
  "localizacaoSummary": "Rua das Flores, 100 (perto da escola)",
  "status": "RECEBIDA",
  "fotos": { "received": 1, "saved": 1, "failed": 0 },
  "message": "Seu registro foi recebido e será analisado conforme a disponibilidade da equipe."
}
```

| Campo | Observação |
| --- | --- |
| `number` | Número sequencial do registro (é o que se mostra ao morador) |
| `createdAt` | ISO-8601 UTC |
| `localizacaoSummary` | `address (referencia)`, ou só um dos dois, ou `"Localização registrada por GPS"` |
| `status` | Sempre `RECEBIDA` na criação |
| `fotos.received` | Fotos recebidas no envio |
| `fotos.saved` | Fotos salvas no bucket |
| `fotos.failed` | `received − saved` |
| `message` | Muda conforme fotos falhas; **nunca** afirma que um órgão recebeu/atendeu |

> **A resposta NÃO contém `id` (UUID)** — apenas `number`. O front público não precisa de UUID.

**Mensagens de `message`:**

- `failed = 0` → `"Seu registro foi recebido e será analisado conforme a disponibilidade da equipe."`
- `failed = 1` → `"Seu registro foi recebido. Não foi possível salvar 1 foto, mas a ocorrência será analisada conforme a disponibilidade da equipe."`
- `failed > 1` → `"Seu registro foi recebido. Não foi possível salvar N fotos, mas a ocorrência será analisada conforme a disponibilidade da equipe."`

**Erros possíveis:**

| Status | Causa |
| --- | --- |
| 400 `validation` | Campo inválido, par de coordenadas incompleto, sem nenhuma localização |
| 400 `api` | `Idempotency-Key` não é UUID; mais de 3 fotos; foto inválida (vazia, > 5 MB, não JPEG/PNG); caracteres de controle no texto |
| 400 `api` | Turnstile ativo e token ausente/inválido |
| 413 `file-too-large` | Arquivo acima de 5 MB / request acima de 16 MB |
| 429 `rate-limit` | 5 envios/h por IP ou 100/h globais — **antes** de qualquer processamento |
| 503 `api` | Turnstile ativo mas segredo não configurado (fail-closed) ou falha de rede no CAPTCHA |

**Ordem das verificações:** rate limit → Turnstile → parse da `Idempotency-Key` → validação → fotos → gravação → upload.

---

### 7.3 `GET /actuator/health`

Público, sem detalhes. Resposta: `{"status":"UP"}`. Usado como healthcheck do Docker.

---

### 7.4 `GET /api/v1/admin/ocorrencias`

Lista paginada com filtros. **Auth:** `Bearer <JWT>` + papel `ADMIN`.

**Query parameters:**

| Parâmetro | Tipo | Obrigatório | Default | Restrições |
| --- | --- | --- | --- | --- |
| `status` | enum `OcorrenciaStatus` | não | — | ver §8 |
| `type` | enum `OcorrenciaType` | não | — | ver §8 |
| **`prioridade`** | enum `NivelPrioridade` | não | — | **o nome é `prioridade`, não `priority`** |
| `hasCoordinates` | boolean | não | — | `true`/`false` |
| `from` | date `yyyy-MM-dd` | não | — | interpretada em `America/Sao_Paulo` |
| `to` | date `yyyy-MM-dd` | não | — | **inclusivo** (+1 dia por baixo) |
| `q` | string | não | — | ≤ 100 chars; busca case-insensitive em endereço, ponto de referência e observações do morador |
| `page` | int | não | `0` | ≥ 0 |
| `size` | int | não | `20` | 1–100 |

Ordenação fixa: `criadoEm` **DESC**.

**Response `200`:**

```json
{
  "content": [
    {
      "id": "3f2a9c1e-0000-4000-8000-000000000001",
      "number": 42,
      "createdAt": "2026-11-24T13:05:00.123456Z",
      "type": "ENTULHO",
      "estimatedVolume": "MEDIO",
      "collectionAcesso": "DIFICIL",
      "drenagemRisk": "NAO_SEI",
      "status": "RECEBIDA",
      "prioridade": "MEDIA",
      "prioridadeSetManually": false,
      "addressText": "Rua das Flores, 100",
      "referenciaPoint": "perto da escola",
      "hasCoordinates": true,
      "fotoCount": 1
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 137,
  "totalPages": 7
}
```

**Erros:** 400 (`validation`/`invalid-parameter` — valor de enum inválido, `q` > 100, `size` fora de 1–100, `page` < 0), 401, 403.

---

### 7.5 `GET /api/v1/admin/ocorrencias/{id}`

Detalhe completo. `{id}` é o **UUID** (não o `number`).

**Response `200`:**

```json
{
  "id": "3f2a9c1e-0000-4000-8000-000000000001",
  "number": 42,
  "createdAt": "2026-11-24T13:05:00.123456Z",
  "updatedAt": "2026-11-25T09:10:00.000000Z",
  "type": "ENTULHO",
  "estimatedVolume": "MEDIO",
  "collectionAcesso": "DIFICIL",
  "drenagemRisk": "NAO_SEI",
  "observacaos": "Acumulado há duas semanas",
  "latitude": -22.505000,
  "longitude": -43.178000,
  "precisaoMeters": 12.50,
  "addressText": "Rua das Flores, 100",
  "referenciaPoint": "perto da escola",
  "localizacaoSource": "GPS",
  "status": "EM_ANALISE",
  "prioridade": "MEDIA",
  "prioridadeReasons": [
    { "code": "DRENAGEM_INCERTA", "label": "Situação de drenagem não confirmada" },
    { "code": "VOLUME_MEDIO", "label": "Volume médio de resíduos" },
    { "code": "ACESSO_DIFICIL", "label": "Acesso difícil para coleta" }
  ],
  "prioridadeSetManually": false,
  "manualPrioridadeReason": null,
  "inVulneravelArea": null,
  "resolvedAt": null,
  "resolvedConfirmedBy": null,
  "resolutionObservacao": null,
  "historico": [
    {
      "fromStatus": null,
      "toStatus": "RECEBIDA",
      "changedBy": null,
      "observacao": null,
      "changedAt": "2026-11-24T13:05:00.123456Z"
    }
  ],
  "encaminhamentos": [
    {
      "id": 7,
      "destination": "Saneamento Básico",
      "channel": "E-mail",
      "referredAt": "2026-11-25T10:00:00.000000Z",
      "protocolNumber": "2026-123",
      "requestText": "SOLICITAÇÃO DE COLETA — Território Limpo\n…",
      "referredBy": "uuid-do-admin",
      "createdAt": "2026-11-25T10:00:00.000000Z"
    }
  ],
  "observacaosInternal": [
    {
      "id": 15,
      "authorId": "uuid-do-admin",
      "body": "Verificado in loco, ponto confirmado.",
      "createdAt": "2026-11-25T09:10:00.000000Z"
    }
  ],
  "fotos": [
    {
      "id": "8b7d…-uuid",
      "url": "https://SEU-PROJETO.supabase.co/storage/v1/object/sign/…",
      "createdAt": "2026-11-24T13:05:01.000000Z"
    }
  ]
}
```

**Ordenações das listas aninhadas:**

| Lista | Ordenação |
| --- | --- |
| `historico` | ascendente (cronológico) |
| `encaminhamentos` | **descendente** (mais recente primeiro) |
| `observacaosInternal` | ascendente (cronológico) |
| `fotos` | ascendente |

**Notas importantes:**

- `fotos[].url` é uma **URL assinada com validade de 10 minutos**. Se o storage falhar, `url` vem `null` **sem derrubar a resposta**. **Não cacheie** — refaça o fetch do detalhe quando precisar exibir.
- `prioridadeReasons[].code` é o valor do enum; `.label` já vem em pt-BR. Para código desconhecido, a API devolve `label = code`.
- `historico[0].fromStatus` é `null` no primeiro registro (origem do fluxo).
- Campos de resolução (`resolvedAt`, `resolvedConfirmedBy`, `resolutionObservacao`) só preenchem quando `status === "RESOLVIDA"`.
- `inVulneravelArea` é `Boolean` (pode ser `null`).

**Erros:** `404` (`not-found`, detail `"Ocorrência não encontrada."`), 401, 403.

---

### 7.6 `GET /api/v1/admin/ocorrencias/{id}/fotos`

`200` → array de `FotoView`:

```json
[
  { "id": "8b7d…-uuid", "url": "https://…/sign/…", "createdAt": "2026-11-24T13:05:01.000000Z" }
]
```

Mesmas observações de URL assinada/`null` do detalhe. `404` se a ocorrência não existe.

---

### 7.7 `DELETE /api/v1/admin/ocorrencias/{id}/fotos/{fotoId}`

`204 No Content`.

**Comportamento:** lock pessimista da ocorrência → remove **primeiro do storage** → depois do banco → grava evento no histórico (`"Uma foto foi removida pela equipe."`) → atualiza `atualizado_em`.

| Status | Causa |
| --- | --- |
| 204 | Sucesso |
| 404 | Ocorrência ou foto não encontrada (`"Foto não encontrada para esta ocorrência."`) |
| **503** | Storage não configurado (`"O armazenamento de fotos não está configurado. A foto não foi removida."`) ou falha no storage (`"Não foi possível remover a foto do armazenamento. Tente novamente."`) |
| 401 / 403 | Auth |

> Em 503 **a foto permanece** (a remoção é abortada antes do banco). Trate como "tente novamente", não como sucesso.

---

### 7.8 `PATCH /api/v1/admin/ocorrencias/{id}/status`

Muda a situação e grava histórico.

**Request:**

```json
{ "status": "RESOLVIDA", "observacao": "Local atendido pela equipe em 25/11." }
```

| Campo | Tipo | Obrigatório | Restrições |
| --- | --- | --- | --- |
| `status` | enum `OcorrenciaStatus` | **sim** | — |
| `observacao` | string | condicional | ≤ 2000 chars |

**Response `200`:** o `AdminOcorrenciaDetail` completo (mesmo shape do §7.5).

**Regras (importantes para a UI):**

| Cenário | Exige `observacao`? | Status de erro |
| --- | --- | --- |
| Situação de destino **igual** à atual | — | **409** `"A ocorrência já está nesta situação."` |
| Qualquer transição normal | não | 200 |
| Ir para **`RESOLVIDA`** | **SIM** | **422** `"Informe a confirmação de que o local foi atendido para marcar como resolvida."` |
| Reabrindo uma `RESOLVIDA` (para qualquer outra) | **SIM** | **422** `"Informe o motivo para reabrir uma ocorrência já resolvida."` |

→ **UX:** habilitar o campo `observacao` automaticamente quando o destino for `RESOLVIDA` ou quando a situação atual for `RESOLVIDA`. Nos demais casos ele é opcional (mas sempre é gravado no histórico se enviado).

`observacao` também pode falhar com **400** por conter caracteres de controle (`"Remova caracteres inválidos do texto."`, campo `observacao`).

---

### 7.9 `PATCH /api/v1/admin/ocorrencias/{id}/prioridade`

**Request:**

```json
{ "prioridade": "ALTA", "reason": "Retorno da equipe: risco iminente" }
```

| Campo | Tipo | Obrigatório | Restrições |
| --- | --- | --- | --- |
| `prioridade` | enum `NivelPrioridade` | **sim** | — |
| `reason` | string | não | ≤ 500 chars |

**Response `200`:** `AdminOcorrenciaDetail`.

Marca `prioridadeSetManually = true` no banco. **A prioridade manual nunca é sobrescrita** por cálculos automáticos (nem pela troca de área vulnerável).

---

### 7.10 `PATCH /api/v1/admin/ocorrencias/{id}/vulneravel-area`

**Request:**

```json
{ "inVulneravelArea": true }
```

| Campo | Tipo | Obrigatório |
| --- | --- | --- |
| `inVulneravelArea` | boolean | não (aceita `null`) |

**Response `200`:** `AdminOcorrenciaDetail`.

Se a prioridade **não** foi definida manualmente, recalcula a prioridade incluindo o bônus de +2 de área vulnerável.

---

### 7.11 `PATCH /api/v1/admin/ocorrencias/{id}/localizacao`

**Request:**

```json
{ "latitude": -22.505, "longitude": -43.178, "precisaoMeters": 8.2 }
```

| Campo | Tipo | Obrigatório | Restrições |
| --- | --- | --- | --- |
| `latitude` | number | **sim** | −90…90 |
| `longitude` | number | **sim** | −180…180 |
| `precisaoMeters` | number | não | ≥ 0 |

**Response `200`:** `AdminOcorrenciaDetail`.

Marca `localizacaoSource = "CONFIRMADA_PELA_EQUIPE"` (a única origem que exige coordenadas). Coordenadas arredondadas para 6 casas, precisão para 2.

---

### 7.12 `POST /api/v1/admin/ocorrencias/{id}/observacaos`

Adiciona uma **nota interna**.

**Request:**

```json
{ "body": "Verificado in loco, ponto confirmado." }
```

| Campo | Tipo | Obrigatório | Restrições |
| --- | --- | --- | --- |
| `body` | string | **sim** (`@NotBlank`) | ≤ 2000 chars |

**Response `201 Created`:**

```json
{ "id": 15, "authorId": "uuid-do-admin", "body": "Verificado in loco, ponto confirmado.", "createdAt": "2026-11-25T09:10:00.000000Z" }
```

**Erros:** 400 (`validation` campo `body`; ou `api` com campo `body` para caracteres de controle / em branco após normalização), 404, 401, 403.

> **Notas internas nunca aparecem no CSV nem no texto de encaminhamento.**

---

### 7.13 `GET /api/v1/admin/ocorrencias/{id}/encaminhamento-text`

Gera o texto de solicitação **sem gravar** nada.

- **Response `200`**: `text/plain;charset=UTF-8`
- **Uso:** botão "Gerar/copiar texto" no detalhe.

Conteúdo gerado:

```text
SOLICITAÇÃO DE COLETA — Território Limpo
Registro nº 42 — registrado em 24/11/2026 13:05

Tipo de resíduo: Entulho ou restos de obra
Volume estimado: Médio
Acesso para caminhão: Difícil
Bueiro obstruído ou água acumulada: Não sei

Localização:
Endereço: Rua das Flores, 100
Ponto de referência: perto da escola
Coordenadas: -22.505, -43.178 (GPS do aparelho)
Mapa: https://www.google.com/maps?q=-22.505,-43.178

Observações do morador: Acumulado há duas semanas

Este texto foi gerado pelo sistema para apoiar o encaminhamento pela equipe.
O registro não garante atendimento nem prazo.
```

Linhas vazias são omitidas quando o valor não existe. **A API nunca afirma que um órgão recebeu, agendou ou resolveu.**

`404` se a ocorrência não existe.

---

### 7.14 `POST /api/v1/admin/ocorrencias/{id}/encaminhamentos`

Registra um encaminhamento.

**Request:**

```json
{
  "destination": "Saneamento Básico",
  "channel": "E-mail",
  "referredAt": "2026-11-25T10:00:00Z",
  "protocolNumber": "2026-123",
  "requestText": "…"
}
```

| Campo | Tipo | Obrigatório | Restrições |
| --- | --- | --- | --- |
| `destination` | string | **sim** | ≤ 200 chars |
| `channel` | string | **sim** | ≤ 100 chars |
| `referredAt` | ISO-8601 datetime | não | default = relógio do servidor |
| `protocolNumber` | string | não | ≤ 100 chars |
| `requestText` | string | não | ≤ 8000 chars; **se omitido, a API gera automaticamente** (texto do §7.13) |

**Response `201 Created`:**

```json
{
  "id": 7,
  "destination": "Saneamento Básico",
  "channel": "E-mail",
  "referredAt": "2026-11-25T10:00:00.000000Z",
  "protocolNumber": "2026-123",
  "requestText": "SOLICITAÇÃO DE COLETA — …",
  "referredBy": "uuid-do-admin",
  "createdAt": "2026-11-25T10:00:00.000000Z"
}
```

**Erros:** 400 (`validation` ou `api` com campo `destination`/`channel`/`requestText`), 404, 401, 403.

> **Registrar encaminhamento NÃO muda a situação automaticamente.** A mudança de status é sempre explícita (§7.8).

---

### 7.15 `GET /api/v1/admin/ocorrencias/export.csv`

Exporta CSV com **os mesmos filtros da listagem** (sem paginação).

**Query parameters:** `status`, `type`, `prioridade`, `hasCoordinates`, `from`, `to`, `q` — idênticos ao §7.4, **exceto** `page`/`size` (não existem).

**Response `200`:**

| Header | Valor |
| --- | --- |
| `Content-Type` | `text/csv;charset=UTF-8` |
| `Content-Disposition` | `attachment; filename="ocorrencias-2026-11-24.csv"` (data em `America/Sao_Paulo`) |

**Formato:** UTF-8 **com BOM** (`EF BB BF`), separador **`;`**, quebras **CRLF**, datas `dd/MM/yyyy HH:mm` em São Paulo. Compatível com Excel pt-BR.

**Colunas (19, nesta ordem):**

```text
Número | Data/hora do registro | Tipo | Volume | Acesso para caminhão | Risco de drenagem |
Situação | Prioridade | Motivos da prioridade | Origem da localização | Latitude | Longitude |
Endereço | Ponto de referência | Observações do morador | Nº de fotos | Nº de encaminhamentos |
Último protocolo | Data de resolução
```

**Como baixar com `Authorization` (obrigatório usar `fetch`, não `<a href>`):**

```ts
const res = await fetch(`${API_URL}/api/v1/admin/ocorrencias/export.csv?${query}`, {
  headers: { Authorization: `Bearer ${token}` },
})
if (!res.ok) throw await parseError(res)
const blob = await res.blob()
const filename = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') ?? '')?.[1]
// criar URL.createObjectURL(blob) e disparar download com `filename`
```

> Notas internas **nunca** são exportadas. Streaming em lotes de 500 — a resposta pode demorar com muitos registros; mostre estado de carregamento.

---

### 7.16 `GET /api/v1/admin/indicadores`

**Response `200`:**

```json
{
  "totalOcorrencias": 137,
  "received": 12,
  "inAnalysis": 30,
  "pendingAnalysis": 42,
  "forwardedOrAwaiting": 38,
  "forwarded": 20,
  "awaitingService": 18,
  "resolved": 41,
  "unresolved": 16,
  "highPrioridadePending": 9,
  "totalEncaminhamentos": 24,
  "encaminhamentosWithProtocol": 15,
  "ocorrenciasWithEncaminhamento": 21
}
```

> **Os campos do JSON de indicadores estão em INGLÊS** (a view do banco já foi traduzida, mas a resposta da API não — ver fase de padronização). Não traduzir as chaves.

| Campo | Significado |
| --- | --- |
| `totalOcorrencias` | Total de ocorrências |
| `received` | Recebidas |
| `inAnalysis` | Em análise |
| `pendingAnalysis` | Pendentes de análise |
| `forwardedOrAwaiting` | Encaminhadas ou aguardando |
| `forwarded` | Encaminhadas |
| `awaitingService` | Aguardando atendimento |
| `resolved` | Resolvidas |
| `unresolved` | Não solucionadas |
| `highPrioridadePending` | Prioridade alta pendente |
| `totalEncaminhamentos` | Total de encaminhamentos |
| `encaminhamentosWithProtocol` | Encaminhamentos com protocolo |
| `ocorrenciasWithEncaminhamento` | Ocorrências com ao menos 1 encaminhamento |

---

## 8. Enums e labels pt-BR

Use o **valor** (chave JSON) no request/query e o **label** na exibição. A API não devolve os labels nos DTOs (exceto `prioridadeReasons[].label`) — **o front deve ter a tabela**.

### `OcorrenciaStatus` — situação

| Valor | Label |
| --- | --- |
| `RECEBIDA` | Recebida |
| `EM_ANALISE` | Em análise |
| `ENCAMINHADA` | Encaminhada ao serviço responsável |
| `AGUARDANDO_ATENDIMENTO` | Aguardando atendimento |
| `RESOLVIDA` | Resolvida |
| `NAO_SOLUCIONADA` | Não solucionada ou encaminhamento necessário |

### `OcorrenciaType` — tipo de resíduo

| Valor | Label |
| --- | --- |
| `LIXO_COMUM` | Lixo comum acumulado |
| `ENTULHO` | Entulho ou restos de obra |
| `VOLUMOSO` | Móveis ou objetos volumosos descartados |
| `DRENAGEM_OBSTRUIDA` | Possível obstrução de bueiro ou drenagem |
| `OUTRO` | Outro |

### `NivelPrioridade` — prioridade

| Valor | Label |
| --- | --- |
| `BAIXA` | Baixa |
| `MEDIA` | Média |
| `ALTA` | Alta |

### `VolumeEstimado` — volume

| Valor | Label |
| --- | --- |
| `PEQUENO` | Pequeno |
| `MEDIO` | Médio |
| `GRANDE` | Grande |

### `AcessoColeta` — acesso para caminhão

| Valor | Label |
| --- | --- |
| `NORMAL` | Acesso normal |
| `DIFICIL` | Acesso difícil |
| `IMPOSSIVEL_CAMINHAO` | Aparentemente impossível para caminhão |

### `RiscoDrenagem` — risco de drenagem

| Valor | Label |
| --- | --- |
| `SIM` | Sim |
| `NAO` | Não |
| `NAO_SEI` | Não sei |

### `OrigemLocalizacao` — origem da localização

| Valor | Label |
| --- | --- |
| `GPS` | GPS do aparelho |
| `MANUAL` | Informada manualmente |
| `CONFIRMADA_PELA_EQUIPE` | Confirmada pela equipe |

### `PrioridadeReason` — motivos da prioridade

| Valor (`code`) | Label |
| --- | --- |
| `DRENAGEM_COM_RISCO` | Bueiro obstruído ou água acumulada |
| `DRENAGEM_INCERTA` | Situação de drenagem não confirmada |
| `POSSIVEL_OBSTRUCAO` | Tipo relacionado a obstrução de drenagem |
| `VOLUME_GRANDE` | Volume grande de resíduos |
| `VOLUME_MEDIO` | Volume médio de resíduos |
| `ACESSO_DIFICIL` | Acesso difícil para coleta |
| `ACESSO_IMPOSSIVEL_CAMINHAO` | Acesso aparentemente impossível para caminhão |
| `AREA_VULNERAVEL_VERIFICADA` | Área vulnerável verificada pela equipe |

> ⚠️ **`MEDIA` não tem acento** (é `MEDIA`, não `MÉDIA`) — é assim que está no banco e no JSON. O acento está só no label.

---

## 9. Regras de negócio que o frontend deve implementar

### 9.1 Transições de situação

```text
                    ┌──────────────────────────────────┐
                    │                                  ▼
RECEBIDA ─► EM_ANALISE ─► ENCAMINHADA ─► AGUARDANDO_ATENDIMENTO ─► RESOLVIDA
                    │                                  ▲              │
                    └──────────► NAO_SOLUCIONADA ◄─────┴──────────────┘
                                                  (reabrir exige justificativa)
```

A API **não** impõe um grafo de transições — qualquer mudança é aceita, exceto:

- **mesma situação → 409**
- **para `RESOLVIDA` → exige `observacao` (422 se ausente)**
- **saindo de `RESOLVIDA` → exige `observacao` (422 se ausente)**

Sugestão de UI: exibir as situações como um stepper/badge e habilitar o campo de observação condicionalmente (§7.8).

### 9.2 Cálculo de prioridade (determinístico)

| Fator | Pontos |
| --- | --- |
| Risco de drenagem `SIM` | +3 |
| Risco de drenagem `NAO_SEI` | +1 |
| Tipo `DRENAGEM_OBSTRUIDA` | +2 |
| Volume `GRANDE` | +2 |
| Volume `MEDIO` | +1 |
| Acesso `IMPOSSIVEL_CAMINHAO` | +2 |
| Acesso `DIFICIL` | +1 |
| Área vulnerável verificada | +2 |

**Limiares:** `≥ 5 → ALTA` · `3–4 → MÉDIA` · `< 3 → BAIXA`

- A prioridade é **apoio à avaliação humana** — não representa risco geológico.
- `prioridadeSetManually = true` → a prioridade **não** é recalculada automaticamente.
- Motivos ficam como códigos no banco (`text[]`) e viram `prioridadeReasons[].label` só na resposta.

### 9.3 Fotos

| Regra | Valor |
| --- | --- |
| Máximo por envio | **3** |
| Tamanho máximo por arquivo | **5 MB** |
| Tamanho máximo do request | **16 MB** |
| Formatos aceitos | **JPEG ou PNG** (validado por **magic bytes**, não pela extensão) |
| Processamento | reorientação EXIF → resize ≤ 1600 px → reencode JPEG q0.82 (remove EXIF/GPS) |
| Armazenamento | bucket privado, caminho `{ocorrenciaId}/{uuid}.jpg` |
| URLs | assinadas, **10 minutos** de validade |

→ O uploader do front deve: limitar a 3 arquivos, checar 5 MB e tipo antes de enviar, e **não persistir** as URLs assinadas (refazer fetch quando expirarem).

### 9.4 Idempotência (formulário público)

- Gere um `UUID` **uma vez por tentativa de envio** e envie em `Idempotency-Key`.
- Se a resposta falhar por rede, reenvie **com a mesma chave** — a API devolve `200` com o registro original em vez de duplicar.
- Se você gerar uma chave nova a cada retry, cria duplicatas.

### 9.5 Rate limit (formulário público)

| Limite | Default |
| --- | --- |
| Por IP | **5 envios/hora** |
| Global | **100 envios/hora** |

- Aplicado **antes** de qualquer processamento (inclusive antes da validação).
- `429` + header `Retry-After` (segundos) + `retryAfterSeconds` no body.
- Desligável via `RATE_LIMIT_ENABLED=false`.
- O IP nunca é persistido nem logado.

→ UI: bloquear o botão de submit e mostrar "Aguarde X minutos" quando receber 429.

### 9.6 Turnstile (CAPTCHA)

- Desligado por default em dev; **ligado em prod**.
- Quando ligado: token **obrigatório** no header `X-Turnstile-Token`.
- Token ausente → 400 `"Confirme que você não é um robô e tente novamente."`
- Segredo não configurado → **503** (fail-closed)
- Falha de rede no callback → 503 (fail-closed)
- O IP do morador **não** é enviado ao CAPTCHA.

→ Use `@marsidev/react-turnstile` com `VITE_TURNSTILE_SITE_KEY` e envie o token no header.

### 9.7 Privacidade / LGPD (implica no design)

- **Não** colete nome, CPF, telefone, e-mail ou IP do morador — a API não os aceita nem os armazena.
- O formulário público deve ser anônimo por construção.
- Notas internas ficam **só** no painel (nunca no CSV, nunca no texto de encaminhamento).
- A API **nunca** afirma que um órgão recebeu/agendou/resolveu — o front também não deve.

---

## 10. Tipos TypeScript

`src/types/api.ts` — espelho exato dos records da API:

```ts
// ── Enums ──────────────────────────────────────────────
export type OcorrenciaStatus =
  | 'RECEBIDA' | 'EM_ANALISE' | 'ENCAMINHADA'
  | 'AGUARDANDO_ATENDIMENTO' | 'RESOLVIDA' | 'NAO_SOLUCIONADA'

export type OcorrenciaType =
  | 'LIXO_COMUM' | 'ENTULHO' | 'VOLUMOSO' | 'DRENAGEM_OBSTRUIDA' | 'OUTRO'

export type NivelPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA'
export type VolumeEstimado = 'PEQUENO' | 'MEDIO' | 'GRANDE'
export type AcessoColeta = 'NORMAL' | 'DIFICIL' | 'IMPOSSIVEL_CAMINHAO'
export type RiscoDrenagem = 'SIM' | 'NAO' | 'NAO_SEI'
export type OrigemLocalizacao = 'GPS' | 'MANUAL' | 'CONFIRMADA_PELA_EQUIPE'

export type PrioridadeReasonCode =
  | 'DRENAGEM_COM_RISCO' | 'DRENAGEM_INCERTA' | 'POSSIVEL_OBSTRUCAO'
  | 'VOLUME_GRANDE' | 'VOLUME_MEDIO' | 'ACESSO_DIFICIL'
  | 'ACESSO_IMPOSSIVEL_CAMINHAO' | 'AREA_VULNERAVEL_VERIFICADA'

// ── Fluxo público ──────────────────────────────────────
export interface PublicOcorrenciaRequest {
  type: OcorrenciaType
  estimatedVolume: VolumeEstimado
  collectionAcesso: AcessoColeta
  drenagemRisk: RiscoDrenagem
  observacaos?: string | null
  latitude?: number | null
  longitude?: number | null
  precisaoMeters?: number | null
  addressText?: string | null
  referenciaPoint?: string | null
}

export interface OcorrenciaCreatedResponse {
  number: number
  createdAt: string
  localizacaoSummary: string
  status: OcorrenciaStatus
  fotos: { received: number; saved: number; failed: number }
  message: string
}

// ── Paginação ──────────────────────────────────────────
export interface Pagina<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// ── Admin: listagem ────────────────────────────────────
export interface AdminOcorrenciaListItem {
  id: string
  number: number
  createdAt: string
  type: OcorrenciaType
  estimatedVolume: VolumeEstimado
  collectionAcesso: AcessoColeta
  drenagemRisk: RiscoDrenagem
  status: OcorrenciaStatus
  prioridade: NivelPrioridade
  prioridadeSetManually: boolean
  addressText: string | null
  referenciaPoint: string | null
  hasCoordinates: boolean
  fotoCount: number
}

export interface FiltrosOcorrencia {
  status?: OcorrenciaStatus
  type?: OcorrenciaType
  prioridade?: NivelPrioridade
  hasCoordinates?: boolean
  from?: string          // yyyy-MM-dd
  to?: string            // yyyy-MM-dd (inclusivo)
  q?: string             // ≤ 100
  page?: number          // ≥ 0, default 0
  size?: number          // 1–100, default 20
}

// ── Admin: detalhe ─────────────────────────────────────
export interface AdminOcorrenciaDetail {
  id: string
  number: number
  createdAt: string
  updatedAt: string | null
  type: OcorrenciaType
  estimatedVolume: VolumeEstimado
  collectionAcesso: AcessoColeta
  drenagemRisk: RiscoDrenagem
  observacaos: string | null
  latitude: number | null
  longitude: number | null
  precisaoMeters: number | null
  addressText: string | null
  referenciaPoint: string | null
  localizacaoSource: OrigemLocalizacao
  status: OcorrenciaStatus
  prioridade: NivelPrioridade
  prioridadeReasons: { code: string; label: string }[]
  prioridadeSetManually: boolean
  manualPrioridadeReason: string | null
  inVulneravelArea: boolean | null
  resolvedAt: string | null
  resolvedConfirmedBy: string | null
  resolutionObservacao: string | null
  historico: HistoricoView[]
  encaminhamentos: EncaminhamentoView[]
  observacaosInternal: ObservacaoView[]
  fotos: FotoView[]
}

export interface HistoricoView {
  fromStatus: OcorrenciaStatus | null
  toStatus: OcorrenciaStatus
  changedBy: string | null
  observacao: string | null
  changedAt: string
}

export interface EncaminhamentoView {
  id: number
  destination: string
  channel: string
  referredAt: string
  protocolNumber: string | null
  requestText: string
  referredBy: string | null
  createdAt: string
}

export interface ObservacaoView {
  id: number
  authorId: string
  body: string
  createdAt: string
}

export interface FotoView {
  id: string
  url: string | null   // assinada, 10 min; pode ser null
  createdAt: string
}

// ── Admin: requests ────────────────────────────────────
export interface StatusChangeRequest {
  status: OcorrenciaStatus
  observacao?: string | null   // ≤ 2000
}

export interface PrioridadeChangeRequest {
  prioridade: NivelPrioridade
  reason?: string | null       // ≤ 500
}

export interface VulneravelAreaRequest {
  inVulneravelArea?: boolean | null
}

export interface LocalizacaoConfirmRequest {
  latitude: number
  longitude: number
  precisaoMeters?: number | null
}

export interface ObservacaoCreateRequest {
  body: string                 // @NotBlank, ≤ 2000
}

export interface EncaminhamentoCriarRequest {
  destination: string          // ≤ 200, obrigatório
  channel: string              // ≤ 100, obrigatório
  referredAt?: string          // ISO; default = agora
  protocolNumber?: string      // ≤ 100
  requestText?: string         // ≤ 8000; default = gerado pela API
}

// ── Indicadores ────────────────────────────────────────
export interface Indicadores {
  totalOcorrencias: number
  received: number
  inAnalysis: number
  pendingAnalysis: number
  forwardedOrAwaiting: number
  forwarded: number
  awaitingService: number
  resolved: number
  unresolved: number
  highPrioridadePending: number
  totalEncaminhamentos: number
  encaminhamentosWithProtocol: number
  ocorrenciasWithEncaminhamento: number
}

// ── Erros (RFC 9457) ───────────────────────────────────
export interface ErroCampo { field: string; message: string }

export interface ProblemDetail {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
  errors?: ErroCampo[]
  retryAfterSeconds?: number
  correlationId?: string
}
```

---

## 11. Arquitetura proposta do frontend

### 11.1 Camadas

```text
Componentes (UI pura)
      │  usa
Features (lógica por área: publico/, admin/)
      │  chama
api/ (uma função por endpoint, tipada)
      │  usa
lib/http.ts (fetch + auth + erros)   lib/supabase.ts (sessão)
      │
API Spring Boot
```

**Regras:**

1. Componentes **nunca** chamam `fetch` diretamente.
2. Componentes **nunca** montam query strings — isso vive em `api/`.
3. O `ProblemDetail` é convertido em `ApiError` uma única vez, em `lib/http.ts`.
4. Labels de enum vêm de uma tabela central (`src/lib/labels.ts`), não de `switch` espalhado.

### 11.2 Estado

Para a primeira versão, **sem biblioteca de estado global** — suficiente:

- **Sessão/auth:** contexto React (`AuthContext`) sobre `supabase.auth`.
- **Dados do servidor:** hooks locais (`useState`/`useEffect`) + uma função `api/`. Se a complexidade crescer (cache, revalidação, deduplicação), migrar para **TanStack Query** — o desenho da camada `api/` já é compatível.
- **Filtros da listagem:** espelhar na URL (`useSearchParams`) — permitem link compartilhável e voltar/avançar do navegador.

### 11.3 Páginas

| Rota | Conteúdo | Endpoints |
| --- | --- | --- |
| `/` | Formulário público de registro | `POST …/public/ocorrencias` |
| `/admin/login` | Login Supabase | Supabase Auth |
| `/admin` (layout protegido) | Navbar + outlet | — |
| `/admin` (index) | Painel de indicadores | `GET …/indicadores` |
| `/admin/ocorrencias` | Lista + filtros + paginação + botão CSV | `GET …/ocorrencias`, `GET …/export.csv` |
| `/admin/ocorrencias/:id` | Detalhe com abas | `GET …/{id}`, PATCHes, POSTs de nota/encaminhamento, `GET …/encaminhamento-text`, `DELETE …/fotos/{fotoId}` |

### 11.4 Formulário público (feature `publico`)

**Campos:** tipo, volume, acesso, risco de drenagem (obrigatórios) · observações · GPS ou endereço/ponto de referência · até 3 fotos.

**Comportamentos:**

1. **Localização:** botão "usar minha localização" (`navigator.geolocation`) preenche `latitude`/`longitude`/`precisaoMeters` e marca a origem como GPS. Alternativa manual: endereço + ponto de referência. **Ao menos uma forma é obrigatória.**
2. **Validação client-side** espelhando a API (§7.2): pares de coordenadas, tamanhos, presença de localização. A validação server-side continua sendo a autoridade.
3. **Fotos:** preview, limite de 3, checagem de 5 MB e tipo antes do envio.
4. **Turnstile:** renderizar o widget (se `VITE_TURNSTILE_SITE_KEY` definido) e enviar `X-Turnstile-Token`.
5. **Idempotency-Key:** gerar UUID ao iniciar o submit; reutilizar em retries.
6. **Sucesso:** exibir `number` + `message`. Se `fotos.failed > 0`, informar que parte das fotos não pôde ser salva — **sem** prometer atendimento.
7. **429:** bloquear e mostrar a espera de `retryAfterSeconds`.

### 11.5 Painel admin (features `admin/`)

**Lista:**
- Filtros: situação, tipo, prioridade, com/sem coordenadas, período (`from`/`to`), busca `q`.
- Paginação (`size` default 20, máx 100), ordenação fixa por data de criação DESC.
- Badges de situação e prioridade usando os labels do §8.
- Botão "Exportar CSV" → `fetch` + blob (§7.15).

**Detalhe (abas):**

| Aba | Conteúdo | Ações |
| --- | --- | --- |
| Resumo | dados, prioridade + motivos, localização, origem | mudar status, prioridade, área vulnerável, confirmar localização |
| Fotos | grid com URLs assinadas | remover foto (com confirmação) |
| Histórico | timeline `historico` | — |
| Encaminhamentos | lista `encaminhamentos` | gerar texto, copiar, registrar novo |
| Notas internas | lista `observacaosInternal` | adicionar nota |

**Regra de UI crítica:** habilitar o campo `observacao` quando o destino for `RESOLVIDA` ou a atual for `RESOLVIDA` (§7.8).

**Após qualquer `PATCH`/`POST`:** a resposta **já é o `AdminOcorrenciaDetail` atualizado** — substitua o estado local sem refetch (exceto `DELETE …/fotos`, que retorna 204, e `POST …/observacaos`, que retorna só a nota).

---

## 12. Armadilhas conhecidas

| # | Armadilha | Detalhe |
| --- | --- | --- |
| 1 | **README da API tem rotas em inglês** | `/occurrences`, `/photos`, `/notes`, `/referrals`, `/indicators` **não existem**. As reais são `/ocorrencias`, `/fotos`, `/observacaos`, `/encaminhamentos`, `/indicadores`. Usar §7. |
| 2 | **Contrato de idioma misto** | Rotas em português, campos JSON em inglês. **Não traduzir** os campos. |
| 3 | **Nomes de campo estranhos** | `observacaos` (plural com "s" no meio), `observacaosInternal`, `collectionAcesso`, `prioridadeSetManually`. São o contrato — não "corrigir". |
| 4 | **`fail-on-unknown-properties: true`** | Enviar **qualquer campo desconhecido** no body JSON gera **400**. Use os tipos do §10 exatamente. |
| 5 | **Filtro é `prioridade`, não `priority`** | O README diz `priority`; o código usa `prioridade`. |
| 6 | **`instance` não existe** | O README mostra `instance` no exemplo de erro, mas o código não emite. |
| 7 | **Indicadores em inglês** | JSON `received`, `inAnalysis`, `highPrioridadePending`… — único ponto do admin em inglês. |
| 8 | **`MEDIA` sem acento** | Valor do enum é `MEDIA`; o acento está só no label. |
| 9 | **URLs assinadas de 10 min** | Não persistir em localStorage/state de longa duração. Refazer fetch. `url: null` é possível sem ser erro. |
| 10 | **CSV exige `fetch`** | `<a href>` não envia `Authorization`. Usar `fetch` + `blob` + `Content-Disposition`. |
| 11 | **Parte `data` precisa de `Content-Type: application/json`** | Sem ele na parte do multipart, o parser pode não resolver para JSON. |
| 12 | **503 em `DELETE …/fotos`** | Significa que a foto **não** foi removida — tratar como falha retryável. |
| 13 | **403 ≠ 401** | 403 = logado mas sem `app_role=ADMIN`. Não mandar para a tela de login. |
| 14 | **`export.csv` é rota literal** | Convive com `/{id}` sem conflito (Spring prioriza o caminho literal), mas o front deve montar a URL exata. |
| 15 | **Porta do Vite** | Se mudar de 5173, ajuste `CORS_ALLOWED_ORIGINS` na API. |
| 16 | **Bucket divergente** | yml usa `ocorrencia-photos`; `.env.example`/README usam `occurrence-photos`. Configurar igual ao bucket real (ver §13). |
| 17 | **Notas internas são sensíveis** | Nunca exibir em contextos públicos, CSV ou texto de encaminhamento. |
| 18 | **Nunca prometer atendimento** | A API evita afirmações de atendimento/prazo; o front deve seguir a mesma linha. |

---

## 13. Divergências encontradas na documentação existente

Verificadas contra o código-fonte:

| # | Documento | Diz | Realidade (código) |
| --- | --- | --- | --- |
| 1 | `TerritorioLimpo-api/README.md` §Endpoints | `/api/v1/public/occurrences`, `/photos`, `/notes`, `/referrals`, `/indicators`, `/priority`, `/vulnerable-area`, `/location`, `/referral-text` | `/api/v1/public/ocorrencias`, `/fotos`, `/observacaos`, `/encaminhamentos`, `/indicadores`, `/prioridade`, `/vulneravel-area`, `/localizacao`, `/encaminhamento-text` |
| 2 | `README.md` §Filtros | `priority` como filtro | O parâmetro é **`prioridade`** |
| 3 | `README.md` §POST público | parte `photos` | A parte se chama **`fotos`** |
| 4 | `README.md` §Erros | exemplo com `instance` | `TratadorGlobalExcecoes` **não** seta `instance` |
| 5 | `README.md` §Supabase | bucket `occurrence-photos` | `application.yml` default: **`ocorrencia-photos`**; `.env.example`: `occurrence-photos` |
| 6 | `README.md` §Supabase | view `v_indicators` | A view é **`v_indicadores`** (migration V3) |
| 7 | `README.md` §Estrutura | pacotes em inglês parcial | Base de código já renomeada para português (Fase 3 em andamento) |

> Os itens 1–4 afetam **diretamente** a implementação do front. Os demais são de configuração/backend.
> Fonte autoritativa do contrato: **o código + os testes de integração**, conforme §7 deste documento.

---

## 14. Checklist de implementação

### Fase 0 — Fundação
- [ ] Criar `TerritorioLimpo-web/.env.local` com `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TURNSTILE_SITE_KEY`
- [ ] Criar `src/types/api.ts` (§10)
- [ ] Criar `src/lib/http.ts` com `ApiError`, injeção de token e parse de Problem Details (§6)
- [ ] Criar `src/lib/labels.ts` com as tabelas do §8
- [ ] Criar `src/lib/supabase.ts` e `AuthContext`
- [ ] Instalar/configurar React Router com o roteamento do §4.3
- [ ] Validar CORS: subir API em `dev` + Vite em 5173 e bater numa rota admin

### Fase 1 — Formulário público
- [ ] Layout e campos (tipo, volume, acesso, risco, observações)
- [ ] Localização: GPS (`geolocation`) + manual (endereço/ponto de referência)
- [ ] Upload de até 3 fotos com preview e validação client-side
- [ ] Turnstile (se `VITE_TURNSTILE_SITE_KEY` definido)
- [ ] `Idempotency-Key` gerada por tentativa
- [ ] Exibição de sucesso com `number` + `message`, tratando `fotos.failed`
- [ ] Tratamento de 400 (`errors[]`), 413, 429 (`retryAfterSeconds`), 503

### Fase 2 — Autenticação admin
- [ ] Tela de login com Supabase Auth
- [ ] `AuthContext` + refresh de token + redirect
- [ ] Guarda de rota `/admin/**`
- [ ] Tratamento distinto de 401 (refresh/login) vs 403 (sem papel ADMIN)
- [ ] Criar usuário no Supabase com `app_metadata.app_role = ADMIN` e testar

### Fase 3 — Listagem admin
- [ ] `api/ocorrenciasAdmin.ts` com `listarOcorrencias`
- [ ] Tabela com badges de situação/prioridade (labels do §8)
- [ ] Filtros espelhados na URL (`useSearchParams`)
- [ ] Paginação (`page`/`size`, máx 100)
- [ ] Estados vazio/carregando/erro

### Fase 4 — Detalhe admin
- [ ] `api/` para detalhe, PATCHes, observações, encaminhamentos, fotos
- [ ] Abas: resumo, fotos, histórico, encaminhamentos, notas internas
- [ ] Mudança de situação com `observacao` condicional (§7.8) e mensagens 409/422
- [ ] Prioridade manual + área vulnerável (exibindo `prioridadeSetManually`)
- [ ] Confirmação de localização
- [ ] Adicionar nota interna
- [ ] Gerar/copiar texto de encaminhamento (`text/plain`)
- [ ] Registrar encaminhamento (com `requestText` auto-gerado opcional)
- [ ] Remover foto com confirmação, tratando 503
- [ ] Refresh de URLs assinadas expiradas

### Fase 5 — Indicadores e export
- [ ] Painel com os 13 indicadores (§7.16)
- [ ] Download do CSV via `fetch` + blob + `Content-Disposition` (§7.15)

### Fase 6 — Polimento
- [ ] Tratamento global de erros (toast + `correlationId` no 500)
- [ ] Acessibilidade (labels, foco, `aria-*`)
- [ ] Responsividade
- [ ] LGPD: nenhum dado pessoal coletado no público
- [ ] Testes: cliente HTTP, formulário público, guarda de rota

---

**Fim do documento.** Referências cruzadas: `TerritorioLimpo-api-descritivo.md` (arquitetura/fluxos internos), `TerritorioLimpo-api-fase3-plano.md` (padronização de nomes — não afeta o contrato HTTP), `TerritorioLimpo-api/docs/DECISIONS.md` (decisões de implementação).

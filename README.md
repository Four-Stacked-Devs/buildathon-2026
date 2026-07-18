# GabAI Web

GabAI study companion — a responsive Vite + React SPA backed by an Express API that uses OpenAI models (GPT-OSS + Whisper) for tutoring, question generation, and speech-to-text.

**Live demo:** https://buildathon-2026-web.vercel.app

## Structure

- `apps/web` — Vite + React 19 + React Router frontend (`@gabai/web`)
- `apps/server` — Express 5 API server (`@gabai/server`)
- `packages/shared` — shared Zod schemas (`@gabai/shared`)

## Setup

Requires Node.js 20+.

```bash
npm install
```

Create `apps/server/.env` from the example and fill in your API key:

```bash
cp apps/server/.env.example apps/server/.env
```

Then edit `apps/server/.env`:

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | API server port | `4000` |
| `AI_PROVIDER` | AI provider identifier | `openai` |
| `OPENAI_API_KEY` | Your API key (never commit this) | `sk-...` |
| `OPENAI_MODEL_PRIMARY` | Main reasoning model for tutoring turns, summaries, and question generation | `openai/gpt-oss-120b` |
| `OPENAI_MODEL_FAST` | Smaller, faster model for lightweight turns | `openai/gpt-oss-20b` |
| `OPENAI_STT_MODEL` | Whisper model for speech-to-text transcription | `whisper-large-v3-turbo` |
| `SESSION_TTL_MINUTES` | Tutor session lifetime | `30` |

The server validates all of these at boot (`apps/server/src/env.ts`) and refuses to start with missing or placeholder values, so misconfiguration fails fast instead of at request time.

## Run

Two terminals:

```bash
npm run dev:server   # Express API on http://localhost:4000
npm run dev:web      # Vite dev server on http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` and `/health` to the API server, so no frontend env vars are needed in development. For a production build pointing at a remote API, set `VITE_API_BASE_URL`.

Sanity check the API:

```bash
curl http://localhost:4000/health
```

## Other scripts

```bash
npm run typecheck    # typecheck all workspaces
npm run build:web    # production build of the web app
```

## How OpenAI models power the app

- **GPT-OSS 120B** (`OPENAI_MODEL_PRIMARY`) drives the core tutoring loop: tutor turns (`tutor-turn.service.ts`), document summaries (`summary.service.ts`), and quiz/question generation (`question-generation.service.ts`), all with strict JSON-schema structured outputs validated by shared Zod schemas.
- **GPT-OSS 20B** (`OPENAI_MODEL_FAST`) handles latency-sensitive turns where a smaller model keeps the conversation snappy.
- **Whisper** (`OPENAI_STT_MODEL`, `whisper-large-v3-turbo`) transcribes the student's voice input (`stt.service.ts`), enabling the hands-free study flow.

## How Codex and GPT-5.6 accelerated the build

Codex (running GPT-5.6) was used throughout planning and implementation of this repository:

- **Planning and repository scaffolding** — Codex helped plan the monorepo layout (npm workspaces split into `apps/web`, `apps/server`, `packages/shared`) and scaffolded the initial project structure, configs, and workspace wiring.
- **Key decision: provider abstraction** — the AI layer sits behind an `AIProvider` / `STTProvider` interface (`apps/server/src/providers/`), a design decision worked through with Codex so models can be swapped without touching route or service code.
- **Key decision: schema-first API** — request/response contracts live as shared Zod schemas in `packages/shared`, consumed by both the Express server and the React client, and enforced on model outputs via strict JSON-schema response formats. Codex accelerated writing and aligning these schemas across the stack.
- **Key decision: fail-fast env validation** — environment configuration is parsed with Zod at boot rather than checked ad hoc, a pattern Codex helped implement.
- **Frontend port** — GPT-5.6 accelerated porting the original Expo app's screens, design tokens, and components to a responsive Vite + React web app.

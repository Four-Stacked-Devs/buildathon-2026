# Custom Reviewer — Design

**Date:** 2026-07-18
**Status:** Approved

## Goal

After a learning source is analyzed, let the user create a *custom reviewer*: a quiz steered by focus topics, difficulty, a per-type question mix, and free-text instructions — all grounded in the analyzed material. The default flow (pick types, pick a count, start) stays exactly as it is today; customization is opt-in via a toggle on the Setup page.

## Shared schemas (`packages/shared/src/schemas.ts`)

- `documentAnalysisSchema` gains `key_topics: z.array(z.string()).min(3).max(8)`. The topics are extracted during the existing analyze call — no extra request or endpoint.
- New `difficultySchema = z.enum(["easy", "medium", "hard"])`.
- `questionRequestSchema` gains an optional `custom` object:
  - `focusTopics: z.array(z.string()).max(8).default([])` — empty means the whole material.
  - `difficulty: difficultySchema.optional()` — omitted means the model calibrates automatically.
  - `instructions: z.string().trim().max(500).optional()` — user's free-text emphasis, e.g. "focus on dates and definitions".
  - `typeMix: z.array(z.object({ type: exerciseTypeSchema, count: z.number().int().min(1) })).optional()` — when present it overrides `selectedTypes`/`questionCount`; the summed count must be 5–15 (enforced with a Zod refinement).
- When the `custom` key is absent, the request is byte-for-byte what the server accepts today, so nothing regresses.

## Server (`apps/server/src/services/question-generation.service.ts`)

- The analysis system prompt additionally asks for 3–8 key topics covering the material's main sections; the strict JSON response schema (already generated from the Zod schema) enforces the shape.
- `questions()` includes the parsed `custom` block in the model's user message:
  - focus topics → "generate questions only about these topics";
  - difficulty → a calibration instruction (easy = recall, medium = comprehension/application, hard = analysis);
  - instructions → passed as content-emphasis guidance, explicitly framed so it cannot override system behavior;
  - typeMix → exact per-type counts, replacing the flat `selectedTypes` + `questionCount` pair.
- No new endpoints and no changes to routes; the existing `/api/source/:id/questions` handler already forwards the parsed body.

## Web

### Setup page (`apps/web/src/pages/Setup.tsx`)

Below the existing type chips and count segment, a "Customize reviewer" toggle expands a section with:

- **Focus topics** — multi-select chips rendered from `analysis.key_topics`; none selected = all topics. Hidden entirely if the analysis has no `key_topics` (e.g. stale in-memory state from before the schema change).
- **Difficulty** — segmented control: Auto (default, sends nothing) / Easy / Medium / Hard.
- **Question mix** — a +/− stepper per *selected* question type. While a mix is active the flat count segment is hidden and the running total is shown; totals outside 5–15 disable the Start button using the existing inline-hint pattern.
- **Instructions** — one textarea (500-char limit) with a placeholder like "e.g. Focus on dates and definitions".

With the toggle off, the request payload is identical to today's.

### State and API

- `apps/web/src/state/session.tsx` stores the customization (`customEnabled`, `focusTopics`, `difficulty`, `typeMix`, `instructions`) and clears it in `setSource` and `resetSession`.
- `generateQuestions` in `apps/web/src/api/gabai.ts` accepts an optional `custom` argument and includes it in the POST body only when customization is enabled.

## Error handling

- Server: the Zod refinement rejects mixes summing outside 5–15 with a 400, mirroring the client-side gate.
- Client: existing error rendering on Setup covers generation failures; no new error surfaces needed.

## Testing

- `npm run typecheck` across workspaces.
- Manual flow: paste text → analyze (key topics appear) → toggle customize → select topics/difficulty/mix/instructions → generate → verify questions respect the mix counts and topics. Also verify the toggle-off flow behaves exactly as before.

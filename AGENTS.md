# AGENTS.md

Guidance for autonomous coding agents (ds4) working in this repo.

## Architecture Authority
- `RFC-0001-CAVE-ARCHITECTURE.md` is the authoritative clean-architecture constitution. Dependency rule: all imports point inward (`entity <- use_case <- interface_adapter <- data_access/server`).
- Golden path: `View -> Controller -> Input Boundary -> Interactor -> Gateway Port -> Infrastructure Adapter -> Interactor -> Output Data -> Output Boundary -> Presenter -> View Model -> View`.
- Ports/gateway interfaces live in `use_case/gateways/`; storage implementations stay in infrastructure (`data_access/`, `database/`).
- Never import Node `fs`, `path`, or `chalk` into `src/use_case/`; define a gateway port instead.

## Architecture Map (save exploration tokens)
- `resources/project_structure/backend_structure.md` — auto-generated compact file tree, layer file counts, layer-to-layer dependency matrix, and full file-level import edges for `clean-architecture-visualizer/src`.
- Read it instead of globbing/grepping the tree. Regenerate after refactors:
  `node resources/project_structure/generate_dependency_graph.mjs`

## Backend (clean-architecture-visualizer/)
- `entity/` holds pure domain vocabulary (`cleanNode`, `cleanLayer`, `neighbourMap`, `useCaseGraph`).
- `types/sessionData.ts` holds persistence DTOs; `data_access/` holds storage implementations.
- Composition is centralized in `src/app/compositionRoot.ts` + `src/app/engine.ts` (single engine; AppBuilder deleted).

## Verification
- Typecheck: `npx tsc --noEmit` (from `clean-architecture-visualizer/`)
- Tests: `npm test` (jest, 13 suites / ~175 tests)
- Build: `npm run build` (also builds frontend)

## Commits
- Use **Conventional Commits**: `feat`, `fix`, `refactor`, `build`, `test`, `chore`, `deps`, `docs`.
- Concise subject; lowercase, no trailing period. Body explains the "why" when it isn't obvious.
- Show the commit message (subject + body) for approval before committing, unless the user has already explicitly directed the commit.
- Only commit when explicitly asked. Inspect `git status`, `git diff` before committing; stage only intended files.

## AI-usage tracking
- Commit the live session transcript (`conversations/<session>.md`) as the durable record of AI-assisted work; git history is the per-commit record.
- To (re)generate transcripts for this repo's sessions, run:
  `python3 extract_conversations.py --dir .` (writes every session) or `--latest` (most recent only) into `conversations/`.
- To resume context, use opencode's `/sessions` (or `/compact`), **not** by loading the transcript file back in as context.

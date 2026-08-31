# RFC-0002: CAVE Monorepo Reorganization — npm Workspaces, Tooling Consolidation, and Standard Layout

**Status:** Proposed
**Supersedes:** N/A (addendum to `RFC-0001-CAVE-ARCHITECTURE.md`)
**Author:** Agent (`ds4`)
**Needs:** Maintainer approval before implementation (per `GIT_WORKFLOW.md` architectural-change policy)

## Purpose of this Document
`RFC-0001` governs in-package architecture (the Dependency Rule, Golden Path, agent protocol). This RFC addresses the **repository-level** structure that currently prevents that architecture from being enforced uniformly: the codebase is a four-way split with no shared tooling. It proposes a standard npm-workspaces monorepo layout, a single shared lint/format/type-check stack, and a consolidated migration plan.

---

# Part I: Current-State Diagnosis

## 1. Four Independent Packages, Not a Workspace
The repo contains four separate `package.json` files, each with its own `node_modules`, `package-lock.json`, and dependency graph:

| Package | Location | Role |
| --- | --- | --- |
| `clean-architecture-visualizer-cli` | `/` | Thin CLI wrapper that re-builds the backend |
| `clean-architecture-visualizer` | `/clean-architecture-visualizer/` | Backend CLI + Express server + frontend |
| `frontend` | `/clean-architecture-visualizer/frontend/` | React/Vite UI |
| `cave-docs` | `/docs/` | Docusaurus site |

## 2. Dependency Drift
Because nothing is hoisted, versions diverge across packages:
- `typescript@5.9.3` (backend) vs `~5.6.2` (frontend and docs).
- `eslint@10.4.1` (root) vs `^9.39.2` (frontend).
- Prettier configured only at the root; frontend/docs implicitly inherit it.

## 3. Redundant Root Package
The root `package.json` ("clean-architecture-visualizer-cli") exists mainly to expose a `cave` bin and re-run the backend build. It duplicates build logic already owned by the backend package and adds a layer of indirection without a workspace to justify it.

## 4. App + Sub-App Tangled
`clean-architecture-visualizer/` bundles the CLI/server and the React frontend in one package. This forces the backend server (`src/server/server.ts:17-18`) to resolve the frontend via fragile relative paths (`../../frontend` from source, `../../../frontend` from `dist`).

## 5. Inconsistent Tooling
- Two eslint configs: root `eslint.config.ts` (ESM `.ts`) and `frontend/eslint.config.mjs`, with different eslint versions.
- Five `tsconfig.json` files with no shared base: backend, `tsconfig.test.json`, `tsconfig.eslint.json` (added as a workaround), frontend, `tsconfig.node.json`, docs.
- Backend `tsconfig.json` self-conflicts: `exclude: ["tests"]` *and* `include: ["tests/**/*"]` (exclude wins), which forced the `tsconfig.eslint.json` hack and leaves tests outside type-aware linting.

## 6. Consequences
- Multiple installs, multiple lockfiles, slow CI, duplicated dependencies.
- Style enforcement is per-package and inconsistent; `gts` (Google TypeScript Style) currently runs only at the root.
- No shared base config means the "one source of truth" tooling goal of RFC-0001 is unattainable.

---

# Part II: Target Structure

Canonical npm-workspaces monorepo (`apps/` + `packages/`):

```text
CAVE/
  package.json            # workspace root: scripts (build/lint/test/format) + shared devDeps
  package-lock.json       # single lockfile
  turbo.json / nx.json    # optional task orchestration (build in dependency order)
  tsconfig.base.json      # one strict base; apps extend it
  eslint.config.mjs       # shared flat config extending gts, applied repo-wide
  .prettierrc             # repo-wide (unchanged)
  .prettierignore         # repo-wide (unchanged)
  .gitignore
  AGENTS.md  GIT_WORKFLOW.md  README.md  RFC-0001…  RFC-0002…
  resources/              # project structure generator + outputs
  conversations/          # AI session transcripts (unchanged)

  apps/
    backend/              # package name @cave/backend  — moved from clean-architecture-visualizer/
      src/ tests/ examples/ jest.config.js tsconfig.json package.json
    web/                  # package name @cave/web     — moved from clean-architecture-visualizer/frontend/
      src/ tests/ public/ index.html vite.config.ts playwright.config.ts
    docs/                 # package name @cave/docs    — moved from docs/
      api/ developers/ users/ src/ static/ docusaurus.config.ts sidebars*.ts

  packages/               # (optional, future) shared libraries, e.g. @cave/shared-domain
```

## Design Principles
1. **Root owns tooling; apps own code.** All lint/format/type-check configs live once at the root. Apps extend shared bases.
2. **Single dependency graph.** One lockfile, hoisted `node_modules`, one TypeScript version pinned at the root.
3. **Uniform scripts.** `build`, `lint`, `test`, `format`, `typecheck` at the root delegate to workspaces.
4. **Clean separation.** Backend, web, and docs are independent apps; shared domain code has an explicit home in `packages/`.

## Naming Conventions
Follow industry-standard workspace naming:
- **Directories:** `apps/` for deployable applications, `packages/` for libraries (Turborepo/Nx convention). App directories are lowercase: `backend`, `web`, `docs`.
- **Package names:** each workspace package uses an npm scope — `@cave/backend`, `@cave/web`, `@cave/docs`. Scoping namespaces packages (no collisions with public npm names), signals ownership, and gives a uniform convention; future shared libraries follow `@cave/<name>` (e.g. `@cave/shared-domain`).
- **Scoped packages are private by default**; publish with `--access public` only for intended public distribution.

---

# Part III: Tooling Consolidation

## Shared TypeScript Base
Replace the five ad-hoc tsconfigs with `tsconfig.base.json` (strict, `nodenext`, `verbatimModuleSyntax`, `isolatedModules`, `skipLibCheck`) extended by each app. This removes the `exclude: ["tests"]` conflict and the `tsconfig.eslint.json` workaround.

## Single ESLint Config (gts)
Move the shared flat config to the root as `eslint.config.mjs` extending `gts`, applied to all `apps/*` (and `packages/*`). The frontend's separate config is either removed (its app-specific rules become a thin overlay in the same file) or reduced to app-only rules. One eslint version at the root.

## Prettier
`.prettierrc` and `.prettierignore` remain repo-wide and are inherited by every workspace. `format`/`format:check` run across all apps.

## Task Orchestration (optional)
Add `turbo.json` (or `nx.json`) so `build`/`test`/`lint` run in dependency order across `backend → web → docs`. Optional but recommended for a multi-app repo.

---

# Part IV: Migration Plan

Phase-gated to keep the repo buildable at each step.

## Phase 1 — Introduce Workspaces (no moves yet)
1. Add `"workspaces": ["apps/*", "packages/*"]` to root `package.json`.
2. Move shared devDeps (typescript, prettier, eslint, gts, jest, cross-env) to root; pin one TypeScript version.
3. Create root `tsconfig.base.json`; have backend/frontend/docs extend it.
4. Replace root CLI-wrapper scripts with workspace-delegating scripts (`build`, `lint`, `test`, `format`).
5. Verify `npm install` at root produces one lockfile; run `tsc --noEmit` and `jest` from the backend app.

## Phase 2 — Move Directories (preserving history)
6. `git mv clean-architecture-visualizer apps/backend`
7. `git mv clean-architecture-visualizer/frontend apps/web`
8. `git mv docs apps/docs`
9. Update backend server frontend-path resolution (`src/server/server.ts:17-18`): `../../frontend` → `../web` (or env-configurable).
10. Update the `cave` bin path and rename workspace packages to scoped names (`@cave/backend`, `@cave/web`, `@cave/docs`).

## Phase 3 — Consolidate Tooling
11. Single root `eslint.config.mjs` extending `gts`; drop frontend's separate config or reduce to overlay.
12. Delete `tsconfig.eslint.json`; point type-aware linting at the backend app tsconfig now that tests are included correctly.
13. Regenerate `resources/project_structure/backend_structure.md` via `node resources/project_structure/generate_dependency_graph.mjs` (update its path constants first).

## Phase 4 — Update References & CI
14. Update path/name references in `AGENTS.md`, `RFC-0001`, `README.md`, `resources/project_structure/generate_dependency_graph.mjs`, `docs/developers/Frontend.md`, `package.json` bin.
15. Update `.github` CI workflows to the new paths and add a `lint`/`type-check` job across apps (RFC-0001 §IV.7).

## Phase 5 — Verify & Lock In
16. `npm install` at root; confirm hoisting and single lockfile.
17. `npm run lint` (gts), `npm run format:check`, `npm run test`, `npm run build` — all green.
18. (Optional) add `dependency-cruiser` boundary check per RFC-0001 Part VI.6.

---

# Part V: Tradeoffs & Risks

- **Breaking path moves:** `AGENTS.md`, `RFC-0001`, `README`, `resources` generator, docs, and CI reference `clean-architecture-visualizer/`; all must update in the same change.
- **History preservation:** use `git mv`, not `mv`, to keep per-file history/blame.
- **CLI/bin surface:** the `cave` bin (`dist/src/app/index.js`) and package name change; external consumers may be affected.
- **Server ↔ frontend coupling:** the relative-path resolution must change together with the move.
- **Docs subproject:** `docs/` uses `yarn.lock` and Docusaurus; it must adopt the workspace lockfile or be excluded from workspace hoisting if incompatible.
- **Scope:** this is an architectural change; per `GIT_WORKFLOW.md` it requires maintainer approval and is implemented on a disposable `agent/*` branch, merged by a human.

## Implementation Deviations (from Part II–IV)
This RFC was implemented on `agent/monorepo-reorg` (PR #16). Pragmatic deviations from the plan:
- **`apps/docs` is not an npm workspace member.** Docusaurus requires react 19 while `apps/web` uses react 18; a single npm workspace cannot cleanly isolate them. Docs stays a standalone app (own `yarn.lock`, own CI), at `apps/docs/`.
- **Web react pinned via root `overrides`** (`react`/`react-dom` → `18.3.1`) so npm hoists one copy; the stale lockfile was dropped for a fresh resolve.
- **Shared eslint config stays `eslint.config.ts`** (not `.mjs`) extending gts for `apps/backend`; `apps/web` keeps its own react-aware `eslint.config.mjs`. A single config for all apps is deferred.
- **`packages/shared-domain`** (`@cave/shared-domain`) was created and `cleanNode`/`cleanLayer` moved into it; backend and web import it, removing the cross-app source dependency.
- **`chalk` downgraded to `^4.1.2`** in backend for jest `--experimental-vm-modules` ESM stability.
- `format:check` and `npm run lint` still report pre-existing violations (tracked separately; not part of this reorg).

---

# Part VI: Definition of Done

- Root `package.json` declares workspaces; single lockfile; hoisted `node_modules`.
- One TypeScript version, one shared tsconfig base, one shared eslint (gts) config, one prettier config.
- Root scripts `build`/`lint`/`test`/`format`/`typecheck` delegate to workspaces.
- `apps/backend`, `apps/web`, `apps/docs` are cleanly separated with scoped names (`@cave/backend`, `@cave/web`, `@cave/docs`); shared code has a `packages/` home.
- Backend `tsconfig.json` no longer self-conflicts; tests included in type-aware linting; `tsconfig.eslint.json` removed.
- CI lints and type-checks all apps; backend tests excluded from `dist/` output.
- `backend_structure.md` regenerated; all references updated; `git mv` history preserved.
- `npm run lint` (gts), `npm run format:check`, `npm run test`, `npm run build` all pass.

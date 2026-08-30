# RFC-0001: CAVE Clean Architecture Constitution, Engineering Specifications, and Agent Protocol

**Status:** Accepted
**Supersedes:** `ARCHITECTURE.md`, `ARCHITECTURE_CRITIQUE.md`, and prior handbook drafts.

## Purpose of this Document
This document is the authoritative source of truth for architecture within CAVE. It serves simultaneously as a constitutional governance standard, a precise engineering refactoring blueprint, a rubric for code review, and an operating specification for autonomous agents (`ds4`). The architecture described here is not merely preferred; it is rigidly required.

---

# Part I: Educational Foundations

## The Pedagogical Mission
Most software projects optimize for shipping features, but CAVE has a dual obligation: it must also teach software design. A feature that works while violating Clean Architecture is defective because University of Toronto second-year software design students inevitably learn from the codebase itself. 

## Threshold Concepts and Cognitive Load
Clean Architecture operates as a foundational threshold concept in software design. Students often begin with a linear mental model (Input $\to$ Processing $\to$ Database $\to$ Output). This architecture enforces an inverted model (Policies $\leftarrow$ Interfaces $\leftarrow$ Frameworks). 

This inversion is enforced strictly to manage Cognitive Load Theory (CLT). A student modifying a use case should not need to hold Express routing, React state, filesystem APIs, ANSI terminal colors, or JSON database schemas in their working memory. By isolating these concerns, the cognitive load required to understand and extend the system is dramatically reduced.

---

# Part II: Constitutional Principles

* **Principle 1: The Dependency Rule.** All source-level dependencies (including imports, type imports, interfaces, generics, inheritance, and compile-time references) must point exclusively inward. A dependency is a dependency even if it is erased at runtime.
* **Principle 2: Policies Own Abstractions.** Inner policy layers define and own interfaces. Outer layers implement them. Gateway contracts must never reside in the infrastructure layer.
* **Principle 3: Optionality of Details.** Core business rules must survive the swap of Express, Node filesystems, CLI frameworks (Commander), or storage engines without requiring modification. Presenters own presentation; use cases produce raw information. Storage structures are implementation details hidden from the use case.

---

# Part III: The Golden Path

When executing any feature, data must flow through this exact sequence without skipping or merging steps:

> View $\to$ Controller $\to$ Input Boundary $\to$ Interactor $\to$ Gateway Port $\to$ Infrastructure Adapter $\to$ Interactor $\to$ Output Data $\to$ Output Boundary $\to$ Presenter $\to$ View Model $\to$ View

If a proposed feature bypasses a step in this chain, contributors and automated agents must assume the architecture is defective until proven otherwise.

---

# Part IV: Granular Engineering Diagnosis & Smells

The current codebase contains significant architectural violations that must be remediated. The following sections detail the explicit engineering flaws.

## 1. The 705-Line God Class (`graphVerificationInteractor`)
The `graphVerificationInteractor.ts` file acts as a massive God class spanning 705 lines. It currently mixes five distinct responsibilities: filesystem traversal, disjoint-set-union algorithms, layer classification, rule verification, and persistence mapping.
* **The Smell:** Scanning files, querying data, performing analysis, and saving data inside a single interactor.
* **The Fix:** The interactor must be dismantled into isolated collaborators: a `FileGraphBuilder` to scan files, a `LayerResolver` for classification, and a `GraphPersistenceMapper` inside the `data_access` layer for database storage. The interactor should only orchestrate the workflow.

## 2. Presenter Bypass and Shared Mutable State
Currently, presenters like `GetProjectSummaryPresenter` are identical one-line pass-throughs, meaning the Presenter layer is effectively fictional.
* **The Smell:** Interactors directly invoking `console.log` or calling `chalk` for terminal formatting. Interactors building snake_case JSON payloads directly.
* **The Fix:** `OutputData` must become an immutable, read-only object after construction. Interactors must hand raw, unformatted data to the Presenter via an Output Boundary, allowing the Presenter to determine channel-specific formatting (e.g., ANSI colors for CLI, JSON formatting for HTTP).

## 3. Global File Session Store vs. Multi-User Safety
The session store (`src/database/sessionDb.ts`) writes the entire session to a single shared JSON file (`clean-arch-cli-session.json`) in the OS temp directory. Every `set()` operation performs a full-file synchronous write to disk.
* **The Smell:** Two users running the CLI on different projects will overwrite each other's data. Furthermore, `SessionDBAccessInterface` exposes ~25 CRUD methods that leak storage DTOs (`NodeStorage`, `EdgeStorage`) into the business logic.
* **The Fix:** Introduce a genuine in-memory repository keyed per session/project (e.g., `Map<projectId, SessionState>`), coupled with debounced or batched disk writes. The generic repository must return domain entities like `useCaseGraph`, not storage arrays.

## 4. Scattered Composition Roots
Dependency wiring is performed manually at every call site. `src/app/appBuilder.ts` wires the CLI command paths, while Express routes (like `analysis.ts`) instantiate databases and hand-wire interactors inline for every HTTP endpoint.
* **The Smell:** Three separate, independent wiring paths that can easily drift out of sync.
* **The Fix:** Establish a single DI container or `compositionRoot.ts` that builds and returns a map of ready-to-run use cases. The HTTP framework should receive pre-assembled interactors, not construct them.

## 5. Domain Vocabulary Co-Mingled with Infrastructure
Domain entities (`cleanNode`, `cleanLayer`, `neighbourMap`) reside in a generic `types/` folder alongside persistence DTOs (`SessionData`, `FileStorage`).
* **The Smell:** Locating storage concepts beside domain concepts encourages the use case layer to inadvertently import infrastructure definitions.
* **The Fix:** Migrate pure domain vocabulary to `src/entity/` and strictly isolate persistence types within `src/data_access/`.

## 6. Frontend Fragmentation & Dead Code
The React frontend contains dead or duplicated structural components. `layout/Navbar.tsx` and `layout/Header.tsx` sit unused while near-copies operate in `components/common/`. Furthermore, a secondary, hand-rolled data-fetching path exists in `api/getUseCaseDiagramData.ts` that duplicates domain validation logic outside of the standard React Query hooks.
* **The Fix:** Delete all dead UI components. Ensure UI components only render data and collect user intent, routing all data fetching strictly through standardized `actions/*` hooks.

## 7. CI Guardrails and Build Brittleness
The CI pipeline (`jest-tests`) runs tests, but fails to type-check or lint the backend codebase. The `format-checks` job incorrectly executes from the repo root, missing the frontend entirely. Production builds currently output test files directly into the `dist/` directory.
* **The Fix:** Introduce a backend `lint` and `type-check` CI job. Exclude the `tests/` directory from the production build output. 

---

# Part V: Agent Operating Specification (`ds4` Protocol)

As an autonomous coding agent (`ds4`) operating via IDE plugins (e.g., Zed, Continue, Aider), you are bound by strict context-window management and architectural constraints. 

**Execution Sequence (Enforcing the Golden Path):**
1. Identify the layer and allowed dependencies.
2. Define Gateway Ports and purely typed `InputData`/`OutputData` DTOs.
3. Implement the Interactor (business logic) against the Ports.
4. Implement Interface Adapters (Presenters, Controllers).
5. Implement Infrastructure (Repositories, UI).

**Pre-Commit Hallucination Defense:**
* **Verify Imports:** Local models are prone to hallucinating convenience imports. You must never import Node `fs`, `path`, or `chalk` directly into `src/use_case/`. You must strictly define a Gateway Port for these utilities.
* **Verify Dependency Direction:** Ensure no file in the `use_case` layer imports a contract owned by `data_access`.
* **Enforce Presenter Boundaries:** Search for UI formatting logic, colors, or direct storage DTOs inside interactors. If found, extract them immediately.

---

# Part VI: Migration Roadmap & Definition of Done

## Execution Phases
1. **Relocate Ports:** Move `FileAccessInterface`, `SessionDBAccessInterface`, and `CleanArchInfoAccessInterface` into `src/use_case/gateways/`.
2. **Session Store & Persistence Overhaul:** Replace the global temp-file database with a multi-user isolated repository (`Map<projectId, SessionState>`). Narrow the persistence interfaces to return domain entities rather than storage DTOs.
3. **The 705-Line Dismantling (God Class + Presenter Duties):** Break up `graphVerificationInteractor` into distinct builders, classifiers, and mappers. Simultaneously, give `OutputData` strictly typed fields and push all colorization, logging, and JSON key formatting down into the Presenters so the file is only modified once.
4. **Domain Vocabulary Relocation:** Move `cleanNode.ts`, `cleanLayer.ts`, and `neighbourMap.ts` into `entity/`.
5. **Consolidate Composition & UI:** Fold the scattered Express and CLI wiring into a single `compositionRoot.ts` returning a map of ready-to-run use cases. Delete dead React components and standardize page layouts.
6. **Automated Guardrail Lock-in:** Install `dependency-cruiser` to enforce boundaries (`entity <- use_case <- interface_adapter <- infrastructure`) and fix the backend CI linting/TypeScript compilation pipelines. Doing this last prevents CI failures during the transition.

## Definition of Done
A feature or refactor is considered complete only if:
* The Dependency Rule is strictly validated.
* Fitness functions (e.g., `npm run lint:arch`) pass.
* Ports belong to `use_case`.
* Storage implementation details remain exclusively in infrastructure.
* Interactors can execute without framework details.
* Composition is thoroughly centralized.

Architectural exceptions cannot be authorized by code review alone; they require a formal written RFC and maintainer approval.
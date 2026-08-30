# Git Workflow

Commit and branch conventions for agents working in this repo. AGENTS.md points
here for git/commit instructions.

## Commit Conventions (from AGENTS.md)

- Use **Conventional Commits**: `feat`, `fix`, `refactor`, `build`, `test`, `chore`, `deps`, `docs`.
- Concise subject; lowercase, no trailing period. Body explains the "why" when it isn't obvious.
- Commit freely and frequently on disposable `agent/*` branches — no per-commit approval needed there.
- Approval happens at the merge gate: anything reaching `feature/*` or `main` is human-reviewed (see "Merging Agent Work" / "Merging to Main").
- Stage only intended files; inspect `git status`, `git diff` before committing.

---

This repository uses an agent-first workflow designed for safety, reviewability, and easy rollback.

## Principles

1. Agents never work directly on `main`.
2. All agent work happens on disposable branches.
3. Humans own architectural decisions.
4. Humans resolve merge conflicts.
5. Every change must be reviewable as a Git diff.
6. Small, focused branches are preferred over large, multi-purpose branches.

---

## Branch Structure

Use the following hierarchy:

```text
main
  ↑
feature/*
  ↑
agent/*
```

Examples:

```text
main

feature/minuum-analysis
feature/refactor-parser
feature/add-images

agent/parser-cleanup
agent/add-tests
agent/error-handling
```

## Responsibilities

### main

Production-quality code.

Rules:

- Human-controlled.
- Always buildable.
- Always testable.
- No direct agent commits.

### feature/*

A coherent piece of work.

Examples:

- `feature/new-search`
- `feature/refactor-storage`
- `feature/minuum-analysis`

Rules:

- Human-owned.
- Reviewed before merging to main.
- May integrate multiple agent branches.

### agent/*

Disposable implementation branches.

Examples:

- `agent/add-parser`
- `agent/fix-typing`
- `agent/improve-tests`

Rules:

- Agent-owned.
- Narrow scope.
- Safe to delete.

---

## Starting Work

Human creates the feature branch:

```bash
git checkout main
git pull
git checkout -b feature/my-feature
```

Agent creates a working branch:

```bash
git checkout -b agent/my-task
```

All commits occur on the agent branch.

---

## Keeping Branches Current

Trunk-based model: `main` is the single integration branch. Private branches (`agent/*`, local `feature/*` work) rebase onto `main`.

Before significant work:

```bash
git fetch origin
git rebase main
```

Agents should prefer rebasing over merging.

Rebase only **private/local** branches. **Never rebase shared history** — never rebase `main`, nor any branch other agents/people may have based work on (rewriting shared history breaks everyone).

Avoid creating unnecessary merge commits.

Preferred history:

```text
A -- B -- C -- D
```

Avoid:

```text
A -- B ---- M
      \    /
       C --
```

---

## Conflict Policy

## Critical Rule

Agents must never resolve merge or rebase conflicts.

If a rebase or merge produces conflicts:

```text
CONFLICT (...)
```

Stop immediately.

Report:

- conflicting files
- current branch
- attempted operation

Human review is required.

Do not:

- guess the correct resolution
- automatically choose one side
- rewrite conflicting code

---

## Commit Policy

Commit frequently.

Use descriptive commit messages.

Good:

```text
agent: implement parser
agent: add parser tests
agent: improve error handling
agent: simplify cache logic
```

Bad:

```text
fix stuff
updates
changes
wip
```

Each commit should represent a logical unit of work.

---

## Scope Control

Agents should make only the changes necessary for the assigned task.

Do not:

- perform drive-by refactors
- rename unrelated files
- reformat entire repositories
- replace libraries without explicit instructions
- change architecture without approval

If an issue is discovered outside the assigned scope:

1. Finish the assigned task.
2. Document the issue.
3. Allow a human to decide whether it should be addressed.

---

## Review Expectations

Before considering work complete, provide:

## Summary

What was changed.

## Files Modified

List of modified files.

## Risks

Potential concerns, assumptions, or tradeoffs.

## Verification

Commands executed:

```bash
npm test
pytest
cargo test
```

Include results.

---

## Merging Agent Work

Integrate agent work onto `main` (or a `feature/*` branch) keeping history linear.

Preferred workflow:

```bash
git checkout main
git merge --ff-only agent/my-task
```

Fast-forward merges are preferred whenever possible.

If a fast-forward merge is not possible (branch has drifted), rebase the **private** branch onto main first, then fast-forward:

```bash
git checkout agent/my-task
git rebase main
git checkout main
git merge --ff-only agent/my-task
```

Use rebase-merge/squash-merge if you want a single squashed commit per PR.

---

## Merging to Main

Before merging to main:

- tests pass
- lint passes
- code reviewed
- architecture approved (if applicable)

Human performs the final merge.

Keep `main` linear: fast-forward or rebase-merge only. Never rebase `main` itself.

Agents do not merge to main.

---

## Architectural Changes

Agents may propose architectural changes but must not implement significant architectural modifications without explicit approval.

Examples:

- introducing new services
- changing storage systems
- changing API boundaries
- replacing core libraries
- changing repository structure

Provide an RFC-style recommendation instead.

Wait for approval before implementation.

---

## Deletion Policy

Agents must be conservative when deleting code.

Before removing functionality:

- verify that it is unused
- explain why removal is safe
- identify affected files

Large deletions require explicit approval.

---

## Default Behavior

When uncertain:

1. Make the smallest reasonable change.
2. Preserve existing behavior.
3. Leave clear notes.
4. Escalate design decisions to a human.

Optimization is secondary to correctness and reviewability.

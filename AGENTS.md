<!-- pagesquad-skills-repo -->

# AGENTS.md — maintaining PageSquad AI Skills

This file is the contract for any coding agent that edits **this repository** (`pagesquad-ai-skills`). It is not the client-site guide. Sites the squad generates follow the architect skills. This file tells you how to change those skills without drifting.

The installer must not overwrite this file. It is marked `pagesquad-skills-repo` and it is tracked in git.

## What this repo is

A skill pack plus two CLIs (`scripts/install-skills.js`, `scripts/orchestrate-build.js`). Run them with Bun. It is not an Astro application. Do not create `src/`, `astro.config.mjs`, or an npm lockfile at the repo root.

Six architects live under `skills/pagesquad-*/`:

| Skill | Owns |
|---|---|
| `pagesquad-visibility-architect` | SEO, GEO, heading map, JSON-LD requirements |
| `pagesquad-conversion-architect` | Copy and offer structure |
| `pagesquad-brand-architect` | Tokens, type, image direction |
| `pagesquad-experience-architect` | Astro 7, Svelte 5, Tailwind v4, Lighthouse Performance 100, security guideline |
| `pagesquad-automation-architect` | Lead capture, CRM, WhatsApp, Apps Script |
| `pagesquad-insight-architect` | GTM, GA4, pixels, consent, experiments |

Pipeline order is visibility → conversion → brand → experience → automation → insight. State files are the hand-off. Do not invent a seventh architect or a new state file unless `scripts/orchestrate-build.js` grows a step for it in the same change.

## Read this, then the skill

1. This file.
2. `docs/ROADMAP.md` — do not redo a closed item, and add a log line when you close one.
3. The `SKILL.md` you are changing. Read the whole file.
4. A `references/` file only when the change touches that topic.
5. `skills/pagesquad-experience-architect/references/security_guidelines.md` when the change touches forms, env, headers, webhooks, pixels, or dependencies.
6. `skills/pagesquad-experience-architect/references/astro_patterns.md` when the change touches the stack.
7. `skills/pagesquad-experience-architect/references/core_web_vitals.md` when the change touches LCP, fonts, islands, images, third-party scripts, or the Lighthouse bar.

`docs/SECURITY.md` is a pointer to the security guideline. Edit the guideline, not the pointer. Edit `core_web_vitals.md` for the score. Do not add a second copy of either.

## Stack contract for generated sites

Recorded once in `references/astro_patterns.md`:

- **Astro 7**, latest patch (`astro@7`, currently the 7.4 line). Static SSG by default (`output: 'static'`). Per-route SSR is `prerender = false` on that route. Full SSR is `output: 'server'`.
- **Svelte 5** is the only island framework (runes). Do not emit React islands, `LeadForm.tsx`, Svelte 4 (`export let`, `$:`, `on:click`), `output: 'hybrid'`, `Astro.glob()`, `<ViewTransitions />`, or `src/content/config.ts`.
- **Tailwind CSS v4** via `@theme` and `@tailwindcss/vite`.
- Do not install Astro 5 or Astro 6 for new work. Astro 5.18.2 was the last 5.x release and it is outside the security-fix window.
- **Lighthouse Performance 100** on the mobile lab (two runs, then desktop). SEO, accessibility, and best-practices stay at 90+. The Core Web Vitals good band (LCP 2.5 s, INP 200 ms, CLS 0.1) is about a 90 and is not a pass. Rules live in `core_web_vitals.md`.

If a skill, script, or sample state file disagrees with the patterns file or the Lighthouse file, fix the disagreement. Do not add a second copy of the API or the score table.

## Runtime

Bun is the runtime for this pack and for the commands skills teach agents to run on a generated site.

- Document `bun <file>.ts`. The matching `.js` file is the same program. Do not document a second command for it.
- Shebang for those CLIs: `#!/usr/bin/env bun`.
- Generated-site commands in skills are `bun create`, `bun add`, and `bun run build`. `init-astro-project.sh` exits when `bun` is missing.
- Do not add `node`, `npm`, or `npx` for PageSquad scripts or for Astro project steps.
- Leave `node:fs`, `node:path`, and `node:child_process` imports. Bun loads them. Leave the words "LCP node" in `core_web_vitals.md`. That is the DOM element.
- `npm install -g` in `INSTALLATION.md` and `AGENTIC_SETUP.md` is only for the vendor CLIs (Claude Code, Codex, Antigravity). Do not convert those lines, and do not copy that pattern onto PageSquad scripts.
- `*.py` twins stay behaviorally identical to the Bun script. Skills do not tell agents to run Python.

## How to edit a skill

- `SKILL.md` stays operational: modes, protocol, JSON schema, assertions, and which reference to open. Patterns and checklists go in `references/`.
- One fact, one home. Link to the owner. Do not paste the security guideline, the Lighthouse bar, or the Astro API into a second skill.
- The YAML `description` is how agents decide to load the skill. Keep it specific to the work that should trigger it.
- Assertions must be checkable. If you add a rule, add an `[assert]` that names the reference, or the rule will be skipped.
- Schema changes update `scripts/orchestrate-build.js` in the same change. The sample state is what downstream steps read.
- `*.js`, `*.ts`, and `*.py` of a utility must stay behaviorally the same. A fix in one is unfinished until the other two match. The documented command is the Bun one. See Runtime.
- Shell scripts are bash and `set -euo pipefail`. Keep them idempotent.
- Placeholders only in examples. No live tokens, sheet URLs, or customer copy.
- Do not add a new reference file unless `SKILL.md` links it from the token-optimization list or an assertion.

## Security

Follow `skills/pagesquad-experience-architect/references/security_guidelines.md`.

Repo-specific rules:

- `.env` and `.credentials/` stay untracked. Scripts fail closed when a credential is missing. Ask the user. Do not route around a missing key.
- Google service accounts for `create-lead-sheet` do not get project `roles/editor` or `roles/owner`.
- Do not commit generated client sites, `report/` audits, or local agent install folders (`.grok/`, `.claude/`, `.agents/`, `.codex/`). Those are gitignored.

## Verify

This package has no test runner. Before you finish a change:

- Follow Runtime. Syntax-check a JS or TS CLI with `bun build <file> --outfile=/tmp/out.js`. That transpiles the file. It does not run it.
- Do not execute `orchestrate-build.js`, `create-lead-sheet.ts`, or `pagespeed-audit.ts` as a syntax check. The orchestrator rewrites local state. The other two call Google.
- `bash -n` on any shell script you edited.
- If you changed `orchestrate-build.js` or a pipeline schema, run `bun scripts/orchestrate-build.js "Example Brand"` and confirm the state JSON matches the schema. Run it only in a scratch directory. Read the script header first and do not point it at a client project.

Say what you could not run.

## Installer

`scripts/install-skills.js` copies skills into a consumer project and can write that project's `AGENTS.md`. It must skip any `AGENTS.md` that contains `pagesquad-skills-repo`, so a local `--codex` install does not replace this file.

Consumer `AGENTS.md` text is a short index: Astro 7, Svelte 5, Tailwind v4, Bun for PageSquad scripts, the security guideline, and `core_web_vitals.md`. The long contract stays here.

## Documentation map

| File | Role |
|---|---|
| `README.md` | What the pack is |
| `INSTALLATION.md`, `AGENTIC_SETUP.md` | Install the skills into an agent CLI |
| `USER_GUIDE.md` | Run the A.C.E.S. pipeline |
| `SKILLS_OVERVIEW.md` | One-page role summary |
| `CONTRIBUTING.md` | Human contribution entry |
| `docs/ROADMAP.md` | Audit log and open work |
| `docs/SECURITY.md` | Pointer to the security guideline |
| `skills/pagesquad-experience-architect/references/astro_patterns.md` | Stack source of truth |
| `skills/pagesquad-experience-architect/references/security_guidelines.md` | Security source of truth |
| `skills/pagesquad-experience-architect/references/core_web_vitals.md` | Lighthouse Performance 100 |
| `AGENTS.md` | This contract |

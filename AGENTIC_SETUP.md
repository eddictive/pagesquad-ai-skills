# Agentic CLI Setup Guide 🏗️

This guide walks you through installing the **PageSquad AI** skill set into your
preferred AI coding agent — **step by step, in your own terminal**.

The PageSquad AI framework ships **six specialized Architect skills**, each
prefixed with `pagesquad-` so they are instantly recognizable in your skill
registry:

| Skill Folder | Architect Role | Invocation Key |
| :--- | :--- | :--- |
| `pagesquad-visibility-architect` | SEO / GEO Strategist | `@pagesquad-visibility-architect` |
| `pagesquad-conversion-architect` | Copywriter / Narrative Designer | `@pagesquad-conversion-architect` |
| `pagesquad-brand-architect` | Visual Identity / Creative Director | `@pagesquad-brand-architect` |
| `pagesquad-experience-architect` | Frontend Lead (Astro 7 / Svelte 5 / Tailwind v4) | `@pagesquad-experience-architect` |
| `pagesquad-automation-architect` | CRM / Webhook / Lead Automation | `@pagesquad-automation-architect` |
| `pagesquad-insight-architect` | Analytics / GTM / A/B Testing | `@pagesquad-insight-architect` |

---

## Quick Start (One Command)

Install locally into your current project for all supported agents:

```bash
bunx git+https://github.com/eddictive/pagesquad-ai-skills.git --local --all
```

This will:

1. Copy every `pagesquad-*` skill into your workspace agent config folders.
2. Generate `AGENTS.md` (for Codex) and `.grok/grok.md` (for Grok).
3. Pre-create state directories for collaborative pipeline runs.

> **Tip:** After installation, copy `.env-example` to `.env` and fill in your
> Google API credentials (`GOOGLE_API_KEY`, `GOOGLE_OAUTH_TOKEN`, or
> `GOOGLE_SERVICE_ACCOUNT_JSON`) so utility scripts work out of the box.

---

## Install for a Specific Agent

Use the flag that matches your agent CLI:

| Flag | Agent CLI | Target Folder |
| :--- | :--- | :--- |
| `--antigravity` | Antigravity CLI | `.agents/skills/` |
| `--claude` | Claude Code CLI | `.claude/skills/` |
| `--codex` | OpenAI Codex CLI | `AGENTS.md` (root) |
| `--grok` | Grok XAi CLI | `.grok/skills/` + `.grok/grok.md` |
| `--other` | Aider / generic | `.skills/` |

```bash
# Example: install only for Claude Code + Grok
bunx git+https://github.com/eddictive/pagesquad-ai-skills.git --local --claude --grok

# Example: install only for Antigravity
bunx git+https://github.com/eddictive/pagesquad-ai-skills.git --local --antigravity
```

**Scope flags:** append `--local` (default) for workspace-level or `--global`
for user-home-level installation.

---

## 1. Antigravity CLI 🚀

The Antigravity CLI auto-indexes skills and supports both explicit and semantic
(invocation-free) matching.

### Install

```bash
# Zero-clone (recommended)
bunx git+https://github.com/eddictive/pagesquad-ai-skills.git --local --antigravity

# Or, if you cloned the repo
bun scripts/install-skills.js --local --antigravity
```

### How Skills Are Loaded

- **Workspace scope:** `.agents/skills/pagesquad-*/SKILL.md`
- **Global scope:** `~/.gemini/antigravity-cli/skills/pagesquad-*/SKILL.md`

### Invoking Skills

- **Explicit invocation** — prepend `@` and the skill name:

  > `@pagesquad-visibility-architect audit the SEO hierarchy of this page.`

  > `@pagesquad-automation-architect set up a WhatsApp redirect + Google Sheet lead capture flow.`

- **Semantic auto-matching** — describe your task in plain English; Antigravity
  reads the `name` + `description` frontmatter of every skill and injects the
  most relevant one automatically.
- **Inspect loaded skills** — type `/skills` in the Antigravity TUI to see all
  registered `pagesquad-*` skills.

---

## 2. Claude Code CLI (Anthropic) 🧊

Claude Code parses `SKILL.md` frontmatter to create custom slash commands.

### Install

```bash
npm install -g @anthropic-ai/claude-code
bunx git+https://github.com/eddictive/pagesquad-ai-skills.git --local --claude
```

### How Skills Are Loaded

- **Workspace scope:** `.claude/skills/pagesquad-*/SKILL.md`
- **Global scope:** `~/.claude/skills/pagesquad-*/SKILL.md`

### Invoking Skills

- **Slash commands** — every skill becomes a slash command named after its
  `name` frontmatter field:

  > `/pagesquad-brand-architect suggest a premium color palette for a fintech brand.`

- **Always-on rules** — link individual `SKILL.md` files into the root
  `CLAUDE.md` for persistent project-level instructions.

---

## 3. OpenAI Codex CLI 💻

Codex CLI loads project-wide guidelines from `AGENTS.md`. The installer writes
a ready-made `AGENTS.md` at your project root with links to every skill.

### Install

```bash
# Install Codex CLI
npm install -g @openai/codex

# Install PageSquad AI skills (generates AGENTS.md)
bunx git+https://github.com/eddictive/pagesquad-ai-skills.git --local --codex
```

### How Skills Are Loaded

- **Workspace guidelines:** `AGENTS.md` at the project root.
- **Workflow config:** `.codex/config.toml`.

### Invoking Skills

Codex reads `AGENTS.md` automatically. Reference the architect by name in your
prompt; the `AGENTS.md` table links point to the live `pagesquad-*` `SKILL.md`
files:

> "Based on the Experience Architect guidelines, scaffold a new Astro 7 +
> Svelte 5 + Tailwind v4 landing page. Hydrate a LeadForm island only if the decision tree requires it."

To inspect or override:

```bash
codex config show
code .codex/config.toml
```

---

## 4. Grok XAi CLI (Grok Build) 🧠

Grok auto-indexes skills under `.grok/skills/` and reads `.grok/grok.md` for
project-level context.

### Install

```bash
# Install the Grok CLI
curl -fsSL https://x.ai/cli/install.sh | bash

# Install PageSquad AI skills
bunx git+https://github.com/eddictive/pagesquad-ai-skills.git --local --grok
```

### How Skills Are Loaded

- **Workspace scope:** `.grok/skills/pagesquad-*/SKILL.md`
- **Global scope:** `~/.grok/skills/pagesquad-*/SKILL.md`
- **Repo config:** `.grok/grok.md` (generated by the installer).

### Invoking Skills

Use the skill name directly in chat, or let Grok auto-detect from your prompt:

> "Using the pagesquad-insight-architect specifications, set up GA4 event
> tracking for form submissions."

To verify what loaded:

```bash
grok inspect
```

---

## 5. Other Agents (Aider / Cursor / VS Code Copilot) 🤖

Point any agent at the skill files directly.

### Aider

```bash
bunx git+https://github.com/eddictive/pagesquad-ai-skills.git --local --other
aider --read skills/pagesquad-visibility-architect/SKILL.md \
      --read skills/pagesquad-experience-architect/SKILL.md
```

### Cursor / GitHub Copilot

Reference files with `#`:

> "Using #skills/pagesquad-brand-architect/SKILL.md, generate a color scheme."

### VS Code Copilot (global install)

```bash
bunx git+https://github.com/eddictive/pagesquad-ai-skills.git --global --other
# Point Copilot Chat at ~/.pagesquad-ai/pagesquad-*/SKILL.md
```

---

## Environment Variables

Several utility scripts require Google Cloud credentials. Copy `.env-example` to
`.env` and fill in your credentials:

```bash
cp .env-example .env
```

| Variable | Used By | Purpose |
| :--- | :--- | :--- |
| `GOOGLE_API_KEY` | pagesquad-visibility-architect | PageSpeed Insights audit script (API key, shared across Google APIs on the same project) |
| `GOOGLE_OAUTH_TOKEN` | pagesquad-automation-architect | OAuth2 access token for Google Sheets + Apps Script API (create-lead-sheet script) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | pagesquad-automation-architect | *(Optional)* Path to or inline JSON of a service account key — auto-mints an OAuth2 token |

### Obtaining `GOOGLE_API_KEY`

Create or reuse a Google Cloud project with the **PageSpeed Insights API**
enabled, then create an API key:

```bash
# Google Cloud Console → APIs & Services → Credentials → Create API key
cp .env-example .env
# Edit .env and paste your key after GOOGLE_API_KEY=
```

### Obtaining `GOOGLE_OAUTH_TOKEN` (for create-lead-sheet)

The `create-lead-sheet` script needs an OAuth2 bearer token with write access
to Sheets and Apps Script APIs. Three methods work — pick one:

**Method 1 — gcloud (recommended for interactive use):**

```bash
gcloud auth application-default login
gcloud auth application-default print-access-token
# Then set it in .env:
echo "GOOGLE_OAUTH_TOKEN=$(gcloud auth application-default print-access-token)" >> .env
```

**Method 2 — Service Account (recommended for automated/agentic use):**

1. Go to [Google Cloud Console → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Create a service account. Do **not** grant `roles/editor` or `roles/owner`. Enable the Google Sheets, Apps Script, and Drive APIs. The script requests only the scopes listed below; the account owns the files it creates.
3. Create and download a JSON key file
4. Enable the script in your shell:

```bash
export GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/your-service-account-key.json
bun skills/pagesquad-automation-architect/scripts/create-lead-sheet.ts --name "Acme Leads"
```

The script automatically mints a JWT, exchanges it for an access token, and
calls the Sheets + Apps Script APIs. No pre-obtained token needed.

**Method 3 — OAuth2 Playground (one-off):** Visit
[Google OAuth2 Playground](https://developers.google.com/oauthplayground), select
all five scopes listed in the script header, and copy the resulting token into
`.env`.

### Required scopes

```
https://www.googleapis.com/auth/script.projects
https://www.googleapis.com/auth/script.deployments
https://www.googleapis.com/auth/script.scriptapp
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive
```

---

## Global vs Local Installation

| Scope | Command Flag | Target Location | Use When |
| :--- | :--- | :--- | :--- |
| **Local** (workspace) | `--local` *default* | `.agents/`, `.claude/`, `.grok/`, `.codex/`, `.skills/` | Per-project setup |
| **Global** (user) | `--global` | `~/.gemini/`, `~/.claude/`, `~/.grok/`, `~/.pagesquad-ai/` | Available across all projects |

---

## Troubleshooting

| Problem | Fix |
| :--- | :--- |
| Skills don't appear in `/skills` (Antigravity) | Run the installer with `--local --antigravity` from your project root. |
| Codex ignores `AGENTS.md` | Ensure the file is at the workspace root, not nested. |
| `pagespeed-audit` script returns 403 | Add `GOOGLE_API_KEY` to `.env` in your project root. |
| `create-lead-sheet` fails with 401/403 | Ensure `GOOGLE_OAUTH_TOKEN` or `GOOGLE_SERVICE_ACCOUNT_JSON` is set in `.env`; the token must have `https://www.googleapis.com/auth/script.projects` and `https://www.googleapis.com/auth/spreadsheets` scopes. |
| Old skill directories linger | Manually delete the non-prefixed folders (e.g. `visibility-architect/`) from your agent config, then re-run the installer. |

---

## Resources

- [INSTALLATION.md](./INSTALLATION.md) — Full installation reference
- [USER_GUIDE.md](./USER_GUIDE.md) — How to use the A.C.E.S. workflow
- [SKILLS_OVERVIEW.md](./SKILLS_OVERVIEW.md) — The six Architects explained
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Extend or improve a skill
- GitHub: https://github.com/eddictive/pagesquad-ai-skills
- Cloudflare Agent Setup (reference): https://developers.cloudflare.com/agent-setup/prompt.md

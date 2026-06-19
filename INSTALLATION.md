# Installation & Setup 🛠️

To use the **PageSquad AI Framework**, you need an AI agent capable of executing complex, multi-step tasks and following technical instructions. 

This guide covers setup and integration instructions for the standard CLI-based AI agents: **Antigravity CLI**, **Claude Code CLI**, and **OpenAI Codex CLI**.

---

## ⚙️ Automated Installer

We provide an interactive helper script to automate copying and linking the skills into the correct config folders for your chosen CLI agents. You can run this installer **with or without cloning** the repository.

### A. Zero-Clone Installation (Recommended) 🚀
If you do not want to clone this repository, you can execute the installer directly from your project folder:

#### Method 1: Using `bunx` or `npx` (Best for private/public repos)
```bash
# Install locally inside your project workspace (Bun)
bunx git+https://github.com/eddictive/pagesquad-ai-skills.git --local

# Install locally inside your project workspace (Node)
npx -y git+https://github.com/eddictive/pagesquad-ai-skills.git --local

# Install globally in your home user scope (Bun)
bunx git+https://github.com/eddictive/pagesquad-ai-skills.git --global
```

#### Method 2: Using `curl` (Standard shell pipeline)
```bash
# Install locally in your current project workspace (Bun)
curl -fsSL https://raw.githubusercontent.com/eddictive/pagesquad-ai-skills/main/scripts/install-skills.js | bun - --local

# Install locally in your current project workspace (Node)
curl -fsSL https://raw.githubusercontent.com/eddictive/pagesquad-ai-skills/main/scripts/install-skills.js | node - --local
```
*Note: For private repositories, authenticate the curl command by adding `-H "Authorization: token YOUR_GITHUB_PAT"`.*

### B. Standard Installation (Cloned Repo)
If you have already cloned the repository, navigate to the folder and run:
```bash
# Interactive setup menu (Bun or Node)
bun scripts/install-skills.js
# or
node scripts/install-skills.js

# Silent setup for all CLIs locally
bun scripts/install-skills.js --local --all
```

#### Available Options / Flags:
*   `--local` (default): Installs within your current workspace (`.agents/`, `.claude/`, `.grok/`, `.codex/`).
*   `--global`: Installs in your home directory (`~/.gemini/`, `~/.claude/`, `~/.grok/`).
*   `--antigravity`: Installs for Antigravity CLI.
*   `--claude`: Installs for Claude Code CLI.
*   `--codex`: Installs for OpenAI Codex CLI.
*   `--grok`: Installs for Grok Build CLI.
*   `--other`: Installs a generic `.skills/` folder.
*   `--all`: Installs for all of the above.

---

## 1. Antigravity CLI (Mandatory Migration) 🚀

The **Antigravity CLI** automatically indexes skills, supports semantic matches, and allows explicit keyword invoking.

### Installation & Initialization
```bash
# Install the Antigravity CLI
npm install -g @google/antigravity-cli

# Initialize/verify configuration
agy inspect
```

### How Skills are Loaded
- **Workspace Scope:** `.agents/skills/<skill-name>/SKILL.md`
- **Global Scope:** `~/.gemini/antigravity-cli/skills/<skill-name>/SKILL.md`

### Invoking Skills
- **Explicit Invocations:** Prepend the prompt with `@` followed by the skill's name:
  > "@visibility-architect audit the SEO hierarchy of this page."
- **Semantic Auto-Matching:** Based on your prompt content, Antigravity parses the description metadata in the `SKILL.md` frontmatter and injects the instructions automatically if they are relevant.
- **Inspect Loaded Skills:** Type `/skills` in the Antigravity TUI console to see currently registered skills.

---

## 2. Claude Code CLI (Anthropic) 🧊

Claude Code supports modular custom commands (slash commands) by parsing `SKILL.md` files with YAML frontmatter.

### Installation
```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code
```

### How Skills are Loaded
- **Workspace Scope:** `.claude/skills/<skill-name>/SKILL.md`
- **Global Scope:** `~/.claude/skills/<skill-name>/SKILL.md`

### Invoking Skills
- **Slash Commands:** The frontmatter of the skill definitions automatically creates custom slash commands. Use them directly:
  > `/visibility-architect audit my on-page markup`
- **Always-on Instructions:** For persistent coding standards, you can link rules into `CLAUDE.md` at the project root.

---

## 3. OpenAI Codex CLI 💻

Codex CLI uses persistent project guidelines (`AGENTS.md` / `TEAM_GUIDE.md`) and configuration mappings.

### Installation
Follow official setup instructions for the Codex CLI tools.

### How Skills are Loaded
- **Workspace Guidelines:** Codex CLI reads `AGENTS.md` or `.agents.md` in the current working directory to load project rules.
- **Workflow configuration:** Mapped in the `.codex/config.toml` project file.

### Invoking Skills
- The `AGENTS.md` file created by the installer acts as a lookup for all six architects. Codex will automatically scan this file and apply the guidelines from [SKILL.md](file://./skills/visibility-architect/SKILL.md) matching your target workflow.

---

## 4. Grok XAi CLI (Grok Build) 🧠

Grok CLI automatically reads project-specific configuration and rules in your workspace.

### Installation
```bash
# Install the Grok CLI (macOS / Linux / WSL)
curl -fsSL https://x.ai/cli/install.sh | bash
```

### How Skills are Loaded
- **Workspace Scope:** `.grok/skills/<skill-name>/SKILL.md`
- **Global Scope:** `~/.grok/skills/<skill-name>/SKILL.md`
- **Repository configuration:** `.grok/grok.md` in the repository root.
- **Convention Files:** Grok CLI also auto-detects and respects standard `AGENTS.md` and `CLAUDE.md` files.

### Invoking Skills
- Grok automatically indexes skills under `.grok/skills/` and the rules in `.grok/grok.md` on startup. Use the TUI chat and request a specific architect by name or let Grok auto-detect it:
  > "Using the Brand Architect specifications, help me select a premium color scheme."
- **Inspect Configuration:** Run `grok inspect` in your workspace directory to verify loaded guides and skills.

---

## 5. Other Environments (Aider / VS Code Copilot) 🤖

If using other tools, point them directly to the `SKILL.md` files:

- **Aider:**
  ```bash
  aider --read skills/visibility-architect/SKILL.md
  ```
- **GitHub Copilot / Cursor:** Reference files using `@` or `#` symbols:
  > "Using #skills/brand-architect/SKILL.md generate color scheme options."

---

*Looking for the specific architect roles? See the [SKILLS_OVERVIEW.md](./SKILLS_OVERVIEW.md).*

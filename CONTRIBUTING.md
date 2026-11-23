# Contributing to PageSquad AI 🏗️

We welcome contributions to the **PageSquad AI Framework**! Whether you are a specialized architect yourself or an AI engineer, your input helps make this framework more robust.

## How to Contribute

### 1. Refine the Knowledge Base
The `references/` directory in each skill contains the "technical memory" of the architects. If you have updated SEO checklists, new Astro design patterns, or better conversion frameworks:
- Create a new Markdown file in the relevant `references/` folder.
- Link to it in the architect's `SKILL.md`.

### 2. Improve Architect Protocols
The collaboration rules in `SKILL.md` define how the agents interact. If you find a more efficient hand-off process (e.g., between the Conversion and Automation architects), please submit a proposal.

### 3. Add New Scripts
If you have a Bun script that helps an architect perform their job better (for example a PageSpeed audit or a webhook check), add it under that skill's `scripts/` directory and document `bun <file>.ts`. Do not add a Node or npm path.

## Core Standards for Contributions
- **Agents:** Read [AGENTS.md](./AGENTS.md) before editing skills. Generated sites use Astro 7, Svelte 5, and Tailwind v4.
- **Documentation First:** Every change must be documented in the relevant `SKILL.md` or `references/` file.
- **One home per fact:** Stack patterns live in `skills/pagesquad-experience-architect/references/astro_patterns.md`. Security rules live in `skills/pagesquad-experience-architect/references/security_guidelines.md`. Link to them. Do not paste a second copy.
- **Performance Focused:** This framework prioritizes speed (Core Web Vitals) and conversion. Avoid "heavy" or "bloated" patterns.
- **Agent-Friendly:** Write instructions and checklists in a way that is easily parsed and executed by an LLM. Use lists, tables, and clear headings.

---

*Thank you for helping us build the future of AI-driven architecture!*

# User Guide: Orchestrating the Architects 🗺️

This guide explains how to use the **PageSquad AI Framework** to build high-converting web and landing page experiences.

## 1. Activation Concepts

There are four primary ways to interact with these skills depending on your CLI:

### A. Antigravity CLI (Explicit Prefix `@`)
Invoke the skills directly using the `@` symbol. Antigravity will load the specific architect context:
**Prompt Example:**
> "@experience-architect draft the Astro JS component structure for a 'Service Detail' page focusing on performance and mobile responsiveness."

### B. Claude Code CLI (Slash Command `/`)
Use the slash command automatically created from the skill folder name:
**Prompt Example:**
> "/experience-architect draft the Astro JS component structure for a 'Service Detail' page focusing on performance and mobile responsiveness."

### C. OpenAI Codex CLI (Direct Context in `AGENTS.md`)
Because the workspace has `AGENTS.md` loaded in Codex CLI, Codex automatically knows the rules. Simply reference the architect role in your prompts:
**Prompt Example:**
> "Based on the Experience Architect guidelines, draft the Astro JS component structure for a 'Service Detail' page focusing on performance and mobile responsiveness."

### D. Grok XAi CLI (Direct Context in `.grok/grok.md` and `.grok/skills/`)
Grok CLI automatically processes instructions stored under `.grok/grok.md` and indexes skills in `.grok/skills/` in the workspace or home directory. Refer to the architect by name or invoke them directly:
**Prompt Example:**
> "Following the Experience Architect specifications, draft the Astro JS component structure for a 'Service Detail' page focusing on performance and mobile responsiveness."

---

## 2. The Collaborative A.C.E.S. Workflow

To build a full project collaboratively, the architects execute sequentially under the **A.C.E.S. Protocol**, automatically passing structured data using JSON files located in `.grok/state/` (or `.agents/state/`).

### State Pipeline Map

| Step | Architect | Read State File | Write State File | Primary Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Visibility** | *None (User Prompt)* | `visibility_state.json` | Semantic brief, H-tags, keyword requirements, and SEO schemas. |
| **2** | **Conversion** | `visibility_state.json` | `conversion_state.json` | Copywriting structure (PAS/AIDA), headline, and body copy. |
| **3** | **Brand** | `conversion_state.json` | `brand_state.json` | HSL colors, typography settings, and visual prompting assets. |
| **4** | **Experience** | All preceding JSONs | `experience_state.json` | High-performance Astro/Tailwind page components. |
| **5** | **Automation** | `experience_state.json` | `automation_state.json` | Webhook CRM mappings & fast auto-response messaging templates. |
| **6** | **Insight** | Experience & Automation | `insight_state.json` | GTM container setup, GA4 events, and A/B test criteria. |

---

## 3. Practical Example: Automated State Run

You can orchestrate and run the multi-agent pipeline simulation using the built-in runner:

```bash
node scripts/orchestrate-build.js "Premium Fitness App Landing Page"
```

This will run each agent in sequence, validating constraints with assertions, and outputting the following state results:

1. **`visibility_state.json`:** Compiles H1-H3 structures, target search terms, and schema formats.
2. **`conversion_state.json`:** Consumes search details, drafting PAS headlines/sections mapped to the target keywords.
3. **`brand_state.json`:** Consumes copy structure, extracting aesthetic themes and formatting Midjourney prompts.
4. **`experience_state.json`:** Consumes visual and copy rules to layout frontend static islands.
5. **`automation_state.json`:** Connects form endpoints and drafts automated lead responses.
6. **`insight_state.json`:** Generates GTM dataLayer templates based on form IDs and actions.

---

## 4. Best Practices

- **Isolated vs Pipeline Mode:** Use **Isolated Mode** (standard chat commands) when auditing existing code. Use **Pipeline Mode** (structured runner) when generating new funnels from scratch.
- **Strict Self-Validation:** Never ignore `[assert]` failures. Check the assertion matrix printed by each architect to ensure no design/SEO leaks occur.
- **Dynamic Reference Hydration:** Keep your agent fast and minimize token usage by only requesting reference folder lookups (e.g., `references/google_guidelines.md`) when solving a failed assertion.

---

*Need help with a specific architect? Read the detailed [SKILLS_OVERVIEW.md](./SKILLS_OVERVIEW.md).*

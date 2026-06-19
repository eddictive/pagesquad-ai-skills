# PageSquad AI 🏗️

**A collaborative multi-agent framework for high-performance web development and conversion-centric landing pages.**

The **PageSquad AI Framework** is a modular collection of specialized AI personas designed to work together like a professional agency. Each "Architect" in this suite possesses deep domain expertise, strict operational standards, and clear collaboration protocols to take a project from initial SEO strategy to a fully automated, high-converting digital experience.

---

## 🏛️ The Six Architects

| Architect | Role | Core Mission |
| :--- | :--- | :--- |
| **Visibility** | Strategist | SEO/GEO Optimization & Semantic Structure |
| **Conversion** | Narrative | Persuasive Copywriting & Sales Psychology |
| **Brand** | Visuals | Aesthetic Trust, AI Asset Gen & Brand Identity |
| **Experience** | Technical | High-Perf UI/UX (Astro/Tailwind) & Frontend |
| **Automation** | Operations | CRM Integration, Webhooks & Lead Nurturing |
| **Insight** | Analytics | Data Tracking, A/B Testing & Growth Audits |

---

## 🚀 Key Innovation: The A.C.E.S. Workflow Protocol

This isn't just a list of prompts. This is a **structured procedural framework** running the **A.C.E.S. (Agentic Collaborative Execution & Synergy) Protocol**:
1.  **Dual Operational Modes:** Every agent can execute in *Isolated Mode* (for solo auditing/drafting) or *Pipeline Mode* (for collaborative workflows).
2.  **Structured JSON Hand-offs:** Agents communicate programmatically using structured state files under `.grok/state/` (or `.agents/state/`), eliminating freeform context loss.
3.  **Self-Validating Assertions:** Code, design, and copy are checked against programmatic `[assert]` statements prior to return.
4.  **Dynamic Reference Hydration:** Detailed reference manuals are only read when an assertion fails, minimizing token overhead.

### Features
- **A.C.E.S. Orchestrator:** Sequential, automated build simulation via `node scripts/orchestrate-build.js`.
- **GEO (Generative Engine Optimization):** Built-in strategies for the "AI-Search" era (crawlers & citations).
- **Islands Architecture:** Optimized for Astro JS and high Core Web Vitals.
- **Automation-First:** Native support for the "5-Minute Rule" in lead response.
- **Inter-Agent Protocol:** Programmatic state mapping variables.

---

## 📂 Project Structure

```text
skills/
├── [architect-name]/
│   ├── SKILL.md             # Core instructions & A.C.E.S. operational schemas
│   ├── [name].skill         # Packaged skill module
│   ├── references/          # Checklists and technical deep-dives (on-demand hydration)
│   ├── scripts/             # Local tools and automation
│   └── assets/              # Reusable media/templates
scripts/
├── install-skills.js        # Interactive installer utility (Antigravity/Claude/Codex/Grok)
└── orchestrate-build.js     # State-based A.C.E.S. multi-agent pipeline orchestrator
```

---

## ⚙️ Installation

To get started with the PageSquad AI Framework, you will need a supported agent CLI (such as **Antigravity CLI**, **Claude Code**, **OpenAI Codex CLI**, or **Grok Build CLI**).

### Zero-Clone Installation (Recommended) 🚀
No need to clone the repository! Run the installer directly inside your target project folder:
```bash
# Using npx
npx -y git+https://github.com/eddictive/pagesquad-ai-skills.git --local

# Using curl & node
curl -fsSL https://raw.githubusercontent.com/eddictive/pagesquad-ai-skills/main/scripts/install-skills.js | node - --local
```
*For global installations or additional agent CLI targets, see the full [INSTALLATION.md](./INSTALLATION.md) guide.*

---

## 🛠️ Usage

This framework can be used in two ways:

1.  **Individual Activation:** Use an architect as a specialized consultant in **Isolated Mode** for a specific task.
2.  **Orchestrated Workflow (A.C.E.S. Pipeline):** Run the automated pipeline orchestrator to sequence the development cycle sequentially from concept to analytics tags:
    ```bash
    node scripts/orchestrate-build.js "Premium Fitness Brand landing page"
    ```
    This updates the state files under `.grok/state/*.json` programmatically.

*See the [USER_GUIDE.md](./USER_GUIDE.md) for detailed implementation instructions.*

---

## 📜 License & Contribution

This project is designed for AI-assisted workflows. Contributions to the reference libraries and architect protocols are welcome!

---

*Built for the next generation of AI-driven web development.*

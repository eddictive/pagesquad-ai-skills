# PageSquad AI: The 6 Architects 🏛️

This document provides a deep dive into the six specialized domains of the **PageSquad AI Framework**.

---

## 1. Visibility Architect 🔍
*The Strategist*
- **Objective:** To ensure the product is discoverable by both humans (Search Engines) and AI (Generative Engines).
- **Key Expertise:** Technical SEO, Schema.org markup, Semantic Clustering.
- **Innovation:** **GEO (Generative Engine Optimization)**. Focuses on "Answer-First" content structures that LLMs prefer for citations and extraction.
- **Workflow Role:** Defines the structural "skeleton" (H-tags) and meta-requirements for every page.

## 2. Conversion Architect ✍️
*The Narrative Designer*
- **Objective:** To turn visitors into leads or customers through persuasive storytelling.
- **Key Expertise:** Sales psychology, NLP triggers, Copywriting Frameworks (AIDA, PAS, BAB).
- **Core Standard:** Benefits over features. Every sentence must drive the user closer to the Call to Action (CTA).
- **Workflow Role:** Crafts the narrative flow and "Message Match" between ads and landing pages.

## 3. Brand Architect 🎨
*The Visual Lead*
- **Objective:** To establish immediate "Visual Trust" and authority.
- **Key Expertise:** Color psychology, Typography hierarchy, AI Prompt Engineering (Midjourney/DALL-E/Stable Diffusion).
- **Core Standard:** Aesthetic Consistency. Ensuring the "visual soul" of the brand is mirrored across every touchpoint.
- **Workflow Role:** Generates high-quality on-brand assets and defines the creative direction.

## 4. Experience Architect 💻
*The Technical Lead*
- **Objective:** To build frictionless, lightning-fast digital interfaces.
- **Key Expertise:** Astro JS, Tailwind CSS, UI/UX Heuristics, Core Web Vitals.
- **Core Standard:** **Mobile-First & Static-First**. Prioritizing speed and accessibility (WCAG AA).
- **Workflow Role:** Transforms copy and assets into a functional, high-performance web application.

## 5. Automation Architect ⚙️
*The Bridge*
- **Objective:** To connect the front-end experience to back-end business operations.
- **Key Expertise:** CRM Integration (HubSpot/Salesforce), Webhooks, Email/WhatsApp API automation.
- **Core Standard:** **The "5-Minute Rule"**. Ensuring automated first-responses occur in less than 5 minutes to maximize lead conversion.
- **Workflow Role:** Builds the "Operation Blueprint" for lead capture and post-conversion nurturing.

## 6. Insight Architect 📊
*The Growth Validator*
- **Objective:** To turn raw data into actionable growth strategies.
- **Key Expertise:** GA4/GTM implementation, Heatmap analysis, A/B Test design.
- **Core Standard:** Data Integrity. Excluding bot/internal traffic to ensure "clean" decision-making data.
- **Workflow Role:** Audits the success of the other architects and proposes optimizations based on real user behavior.

---

### Why this Framework Works

Unlike generic AI prompts, this framework utilizes **domain-specific isolation**. By separating the "Visibility" logic from the "Conversion" logic, the AI avoids the common pitfall of writing copy that is *good for search* but *bad for sales*, or vice versa.

Under the **A.C.E.S. (Agentic Collaborative Execution & Synergy) Protocol**, these competing priorities are programmatically balanced through a formal state machine:
*   **JSON-Based Hand-offs:** The outputs are stored as structured JSON states, preventing semantic data loss across hand-offs.
*   **Self-Validation:** Every step validates itself with binary `[assert]` declarations.
*   **Zero-Overhead Tokens:** Context window stuffing is eliminated through dynamic reference loading on demand.

The "Architect" protocol ensures that these competing priorities are balanced through a formal, structured collaboration process.

### Utility Scripts & Extensibility

To extend the capabilities of the Architects beyond static text generation, the framework utilizes **Utility Scripts** located in the `skills/*/scripts/` directories. 

These scripts provide the AI agents with executable tools to validate their work against real-world metrics. For example:
*   **Visibility Architect:** Uses the `pagespeed-audit` script to query Google's PageSpeed Insights API, fetching live Core Web Vitals and SEO data.
*   **Automation Architect:** Can use custom webhook-testing utilities to validate CRM connections.

**Agent-Directed Execution:** 
Scripts are designed specifically for LLM agents. They rely on environment variables (managed via a `.env` file) for API keys (e.g., `PAGESPEED_API_KEY`). If an agent attempts to run a script without the required key, the script fails gracefully with an `Agent Action Required` directive, prompting the agent to ask the human user for the missing credential before proceeding. This guarantees safe, autonomous API usage.

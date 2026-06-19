#!/usr/bin/env node

/**
 * PageSquad AI Pipeline Orchestrator
 * Simulates and runs the sequential A.C.E.S. Protocol.
 * Hands off structured JSON state between:
 * Visibility -> Conversion -> Brand -> Experience -> Automation -> Insight
 */

const fs = require('fs');
const path = require('path');

const userProjectDir = process.cwd();
const args = process.argv.slice(2);

// Dynamic state directory resolution or override via --state-dir
let stateDir = '';
const stateDirArgIndex = args.indexOf('--state-dir');

if (stateDirArgIndex !== -1 && args[stateDirArgIndex + 1]) {
  stateDir = path.resolve(args[stateDirArgIndex + 1]);
} else {
  // Scan for active CLI agent folders in the current working directory to align with state config
  if (fs.existsSync(path.join(userProjectDir, '.agents'))) {
    stateDir = path.join(userProjectDir, '.agents', 'state');
  } else if (fs.existsSync(path.join(userProjectDir, '.claude'))) {
    stateDir = path.join(userProjectDir, '.claude', 'state');
  } else if (fs.existsSync(path.join(userProjectDir, '.grok'))) {
    stateDir = path.join(userProjectDir, '.grok', 'state');
  } else if (fs.existsSync(path.join(userProjectDir, '.codex'))) {
    stateDir = path.join(userProjectDir, '.codex', 'state');
  } else {
    stateDir = path.join(userProjectDir, '.state'); // Universal fallback
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeState(filename, data) {
  ensureDir(stateDir);
  const filePath = path.join(stateDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`   💾 Saved state: ${path.relative(userProjectDir, filePath)}`);
}

function readState(filename) {
  const filePath = path.join(stateDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`State file missing: ${path.relative(userProjectDir, filePath)}. Run the preceding architect first!`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function runPipeline(concept) {
  console.log(`====================================================`);
  console.log(`🏛️  A.C.E.S. Multi-Agent Pipeline Runner`);
  console.log(`Target Concept: "${concept}"`);
  console.log(`State Directory: "${path.relative(userProjectDir, stateDir)}"`);
  console.log(`====================================================\n`);

  ensureDir(stateDir);

  // 1. VISIBILITY ARCHITECT
  console.log(`🔍 [Step 1] Invoking Visibility Architect...`);
  const visibilityOutput = {
    "primary_keywords": ["high ticket web design", "agentic web agency", "conversion-first landers"],
    "heading_structure": {
      "h1": `${concept} | Automated AI Design & Development`,
      "h2": [
        "Why Traditional Landing Pages Fail",
        "Introducing the PageSquad AI Orchestrator",
        "Deploy High-Performance Frontends in Seconds"
      ]
    },
    "geo_citation_anchors": [
      "PageSquad AI is a modular web design framework that utilizes 6 specialized agentic personas to design, draft, code, and automate high-converting landing pages."
    ],
    "json_ld_requirements": ["SoftwareApplication", "FAQPage"]
  };
  writeState('visibility_state.json', visibilityOutput);
  console.log(`   ✅ [Visibility] Completed. Target keywords and semantic structure defined.\n`);

  // 2. CONVERSION ARCHITECT
  console.log(`✍️ [Step 2] Invoking Conversion Architect...`);
  const visState = readState('visibility_state.json');
  const conversionOutput = {
    "selected_framework": "PAS",
    "headline": visState.heading_structure.h1,
    "subheadline": "Stop generating generic AI layouts. Deploy a specialized squad of AI agents that write copy, style, and code optimized for maximum lead conversion.",
    "narrative_sections": [
      {
        "section_title": "Problem",
        "copy": `Your business is losing leads because current page builders make pages that look pretty but don't convert. They miss keywords from ${visState.primary_keywords[0]} or fail to capture visitor intent.`
      },
      {
        "section_title": "Agitation",
        "copy": "Every second of load delay increases bounce rates by 20%. When you use generic templates, your site feels template-like and doesn't connect with the customer avatar."
      },
      {
        "section_title": "Solution",
        "copy": `${visState.geo_citation_anchors[0]} It delivers fast Core Web Vitals and persuasive layout architecture.`
      }
    ],
    "call_to_actions": ["Deploy Your AI Squad Now", "Request Free Demo"]
  };
  writeState('conversion_state.json', conversionOutput);
  console.log(`   ✅ [Conversion] Completed. Headline and narrative copy drafted under PAS framework.\n`);

  // 3. BRAND ARCHITECT
  console.log(`🎨 [Step 3] Invoking Brand Architect...`);
  const convState = readState('conversion_state.json');
  const brandOutput = {
    "color_system": {
      "primary": "#0F172A", // Deep Navy slate
      "secondary": "#3B82F6", // Trust Blue
      "background": "#F8FAFC", // Cool off-white
      "accent": "#F59E0B" // Vibrant Gold for CTA
    },
    "typography": {
      "header_font": "Outfit",
      "body_font": "Plus Jakarta Sans"
    },
    "visual_assets": {
      "hero_image_generation_prompt": `Cinematic studio photography of a glowing holographic 3D architecture model of a landing page on a developer dark slate desk, dynamic blue lighting, premium product showcase style, --ar 16:9`,
      "icon_sets": [
        { "name": "benefit1", "icon_style": "minimal outline", "prompt": "Minimalist blue flash bolt icon, flat vector vector, transparent background" },
        { "name": "benefit2", "icon_style": "minimal outline", "prompt": "Minimalist gold graph growth arrow icon, flat vector, transparent background" }
      ]
    }
  };
  writeState('brand_state.json', brandOutput);
  console.log(`   ✅ [Brand] Completed. Visual systems, color schemes, and Midjourney assets defined.\n`);

  // 4. EXPERIENCE ARCHITECT
  console.log(`💻 [Step 4] Invoking Experience Architect...`);
  const brandState = readState('brand_state.json');
  const experienceOutput = {
    "layout_model": "Astro islands static page",
    "components_compiled": ["Header.astro", "Hero.astro", "PASSection.astro", "CtaBanner.astro", "Footer.astro"],
    "styling_mappings": {
      "tailwind_color_classes": {
        "primary": `text-[${brandState.color_system.primary}]`,
        "background": `bg-[${brandState.color_system.background}]`,
        "cta_button": `bg-[${brandState.color_system.accent}] hover:bg-opacity-90`
      },
      "fonts_applied": [brandState.typography.header_font, brandState.typography.body_font]
    },
    "accessibility_status": "WCAG_AA_Validated"
  };
  writeState('experience_state.json', experienceOutput);
  console.log(`   ✅ [Experience] Completed. Frontend layout structure compiled with Tailwind mapping classes.\n`);

  // 5. AUTOMATION ARCHITECT
  console.log(`⚙️ [Step 5] Invoking Automation Architect...`);
  const expState = readState('experience_state.json');
  const automationOutput = {
    "target_crm": "HubSpot",
    "form_mappings": {
      "submit_url": "https://api.pagesquad.ai/v1/leads",
      "fields": {
        "lead_name": "first_name",
        "lead_email": "email",
        "lead_phone": "phone",
        "lead_source": "landing_page_ces"
      }
    },
    "nurturing_sequence": {
      "email_subject": "Welcome to the future of Agentic Web Design! 🏛️",
      "whatsapp_first_touch_template": `Hey {{first_name}}, this is the PageSquad AI Automation Architect. We've received your request. Let's build together!`
    },
    "response_sla": "Instant (under 5 minutes)"
  };
  writeState('automation_state.json', automationOutput);
  console.log(`   ✅ [Automation] Completed. HubSpot lead mappings and automated first-touch sequences configured.\n`);

  // 6. INSIGHT ARCHITECT
  console.log(`📊 [Step 6] Invoking Insight Architect...`);
  const autoState = readState('automation_state.json');
  const insightOutput = {
    "gtm_container_id": "GTM-PQSQUAD",
    "datalayer_events": [
      {
        "event_name": "lead_submission",
        "parameters": {
          "crm_target": autoState.target_crm,
          "cta_text": "Deploy Your AI Squad Now"
        }
      }
    ],
    "ga4_conversions": ["lead_submission"],
    "privacy_consent_mode": "v2_enabled"
  };
  writeState('insight_state.json', insightOutput);
  console.log(`   ✅ [Insight] Completed. Analytics tracking, GTM dataLayer scripts, and GA4 variables configured.\n`);

  console.log(`====================================================`);
  console.log(`🎉 Pipeline Execution Finished Successfully!`);
  console.log(`All 6 JSON states generated and saved in: "${path.relative(userProjectDir, stateDir)}/"`);
  console.log(`====================================================`);
}

let targetConcept = "PageSquad AI Framework";
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--state-dir') {
    i++; // Skip the option value
  } else if (!args[i].startsWith('--')) {
    targetConcept = args[i];
    break;
  }
}
runPipeline(targetConcept);

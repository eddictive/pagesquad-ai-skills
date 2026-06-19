#!/usr/bin/env node

/**
 * PageSquad AI Installer
 * Automatically configures and deploys the six Architect skills for:
 * 1. Antigravity CLI (.agents/skills/)
 * 2. Claude Code (.claude/skills/)
 * 3. OpenAI Codex CLI (AGENTS.md)
 * 4. Grok XAi CLI (.grok/skills/)
 * 5. Generic agent platforms (.skills/)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const https = require('https');
const { execSync } = require('child_process');

const userProjectDir = process.cwd();

// Detect if we have local source files
let skillsSrcDir = '';
let isLocalSource = false;

try {
  const localPath = path.join(__dirname, '..', 'skills');
  if (fs.existsSync(localPath)) {
    skillsSrcDir = localPath;
    isLocalSource = true;
  }
} catch (e) {
  // __dirname might not be defined when piped into node
}

if (!isLocalSource) {
  const cwdPath = path.join(userProjectDir, 'skills');
  if (fs.existsSync(cwdPath)) {
    skillsSrcDir = cwdPath;
    isLocalSource = true;
  }
}

const architects = [
  'visibility-architect',
  'conversion-architect',
  'brand-architect',
  'experience-architect',
  'automation-architect',
  'insight-architect'
];

// Target Paths
const targets = {
  antigravity: {
    local: path.join(userProjectDir, '.agents', 'skills'),
    global: path.join(os.homedir(), '.gemini', 'antigravity-cli', 'skills')
  },
  claude: {
    local: path.join(userProjectDir, '.claude', 'skills'),
    global: path.join(os.homedir(), '.claude', 'skills')
  },
  grok: {
    local: path.join(userProjectDir, '.grok', 'skills'),
    global: path.join(os.homedir(), '.grok', 'skills')
  },
  other: {
    local: path.join(userProjectDir, '.skills'),
    global: path.join(os.homedir(), '.pagesquad-ai')
  }
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFolderSync(from, to) {
  ensureDir(to);
  const files = fs.readdirSync(from);
  for (const file of files) {
    // Skip ZIP .skill files in the destination to keep clean
    if (file.endsWith('.skill')) continue;

    const fromPath = path.join(from, file);
    const toPath = path.join(to, file);
    
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  }
}

function downloadAndExtractTarball(url, destDir) {
  return new Promise((resolve, reject) => {
    const tarballPath = path.join(os.tmpdir(), 'pagesquad-skills.tar.gz');
    const file = fs.createWriteStream(tarballPath);
    console.log(`📡 Downloading skill assets from ${url}...`);
    
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadAndExtractTarball(response.headers.location, destDir).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status Code ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          console.log(`📦 Extracting archive...`);
          try {
            ensureDir(destDir);
            execSync(`tar -xzf "${tarballPath}" -C "${destDir}"`);
            fs.unlinkSync(tarballPath);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    }).on('error', (err) => {
      if (fs.existsSync(tarballPath)) {
        try { fs.unlinkSync(tarballPath); } catch (e) {}
      }
      reject(err);
    });
  });
}

async function ensureSkillsSrc() {
  if (isLocalSource) {
    return skillsSrcDir;
  }

  // We are in remote mode, let's download the tarball
  console.log(`ℹ️  Local skills source not found. Fetching from GitHub...`);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pagesquad-skills-'));
  const tarballUrl = 'https://github.com/eddictive/pagesquad-ai-skills/archive/refs/heads/main.tar.gz';
  
  await downloadAndExtractTarball(tarballUrl, tempDir);
  
  const files = fs.readdirSync(tempDir);
  const repoDirName = files.find(f => f.startsWith('pagesquad-ai-skills-'));
  if (!repoDirName) {
    throw new Error('Could not find extracted repository folder in temporary directory.');
  }
  
  skillsSrcDir = path.join(tempDir, repoDirName, 'skills');
  
  // Register cleanup on exit
  process.on('exit', () => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors on exit
    }
  });
  
  return skillsSrcDir;
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function installSkillsFor(clis, isGlobal) {
  const scopeStr = isGlobal ? 'GLOBAL' : 'LOCAL';
  console.log(`\n🚀 Installing PageSquad AI in ${scopeStr} mode...\n`);

  const srcDir = await ensureSkillsSrc();

  if (clis.includes('antigravity')) {
    const agDest = isGlobal ? targets.antigravity.global : targets.antigravity.local;
    console.log(`🤖 Deploying for Antigravity CLI -> ${agDest}`);
    ensureDir(agDest);
    if (!isGlobal) {
      ensureDir(path.join(userProjectDir, '.agents', 'state'));
      console.log(`   📂 Pre-created local state directory: .agents/state/`);
    }
    for (const arch of architects) {
      const src = path.join(srcDir, arch);
      const dest = path.join(agDest, arch);
      if (fs.existsSync(src)) {
        copyFolderSync(src, dest);
        console.log(`   ✅ Loaded ${arch}`);
      }
    }
  }

  if (clis.includes('claude')) {
    const claudeDest = isGlobal ? targets.claude.global : targets.claude.local;
    console.log(`🧊 Deploying for Claude Code -> ${claudeDest}`);
    ensureDir(claudeDest);
    if (!isGlobal) {
      ensureDir(path.join(userProjectDir, '.claude', 'state'));
      console.log(`   📂 Pre-created local state directory: .claude/state/`);
    }
    for (const arch of architects) {
      const src = path.join(srcDir, arch);
      const dest = path.join(claudeDest, arch);
      if (fs.existsSync(src)) {
        copyFolderSync(src, dest);
        console.log(`   ✅ Loaded /${arch}`);
      }
    }
  }

  if (clis.includes('codex')) {
    if (isGlobal) {
      console.log(`⚠️  Codex CLI only supports workspace-level configuration. Skipping global setup for Codex.`);
    } else {
      console.log(`💻 Configuring for OpenAI Codex CLI...`);
      const codexConfigDir = path.join(userProjectDir, '.codex');
      ensureDir(codexConfigDir);
      ensureDir(path.join(userProjectDir, '.codex', 'state'));
      console.log(`   📂 Pre-created local state directory: .codex/state/`);

      const configPath = path.join(codexConfigDir, 'config.toml');
      if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, `# OpenAI Codex Config\n[agent]\nname = "Codex Suite"\n`, 'utf8');
        console.log(`   ✅ Created .codex/config.toml`);
      }

      const agentsMdPath = path.join(userProjectDir, 'AGENTS.md');
      const agentsContent = `# Project Agents & Guidelines (Codex CLI) 🤖

This file registers the active AI Architect guidelines for the OpenAI Codex CLI.

## Active Architects

*   **Visibility Architect:** Focuses on SEO/GEO & semantic structure. Guided by [SKILL.md](file://./skills/visibility-architect/SKILL.md).
*   **Conversion Architect:** Focuses on PAS/AIDA copywriting and sales psychology. Guided by [SKILL.md](file://./skills/conversion-architect/SKILL.md).
*   **Brand Architect:** Focuses on visual styles, typography, and image generation. Guided by [SKILL.md](file://./skills/brand-architect/SKILL.md).
*   **Experience Architect:** Focuses on Astro JS & Tailwind CSS component layouts. Guided by [SKILL.md](file://./skills/experience-architect/SKILL.md).
*   **Automation Architect:** Focuses on CRMs, webhooks, and the 5-Minute response SLA. Guided by [SKILL.md](file://./skills/automation-architect/SKILL.md).
*   **Insight Architect:** Focuses on GTM, GA4, heatmaps, and A/B test analytics. Guided by [SKILL.md](file://./skills/insight-architect/SKILL.md).

## Operational Standards
All code generation and content modifications must respect the specifications detailed under the respective \`SKILL.md\` and \`references/\` directories.
`;
      fs.writeFileSync(agentsMdPath, agentsContent, 'utf8');
      console.log(`   ✅ Created/Updated root AGENTS.md`);
    }
  }

  if (clis.includes('grok')) {
    const grokDest = isGlobal ? targets.grok.global : targets.grok.local;
    console.log(`🧠 Deploying for Grok XAi CLI -> ${grokDest}`);
    ensureDir(grokDest);
    for (const arch of architects) {
      const src = path.join(srcDir, arch);
      const dest = path.join(grokDest, arch);
      if (fs.existsSync(src)) {
        copyFolderSync(src, dest);
        console.log(`   ✅ Loaded ${arch}`);
      }
    }

    if (!isGlobal) {
      console.log(`🧠 Configuring for Grok XAi CLI...`);
      const grokConfigDir = path.join(userProjectDir, '.grok');
      ensureDir(grokConfigDir);
      ensureDir(path.join(userProjectDir, '.grok', 'state'));
      console.log(`   📂 Pre-created local state directory: .grok/state/`);

      const grokMdPath = path.join(grokConfigDir, 'grok.md');
      const grokContent = `# Grok Architect Instructions 🧠

This file defines the project instructions for the Grok XAi CLI.

## Available Specialized Skills

*   **Visibility Architect:** Focuses on SEO, GEO, and semantic clustering. Setup in [skills/visibility-architect/SKILL.md](file://./skills/visibility-architect/SKILL.md).
*   **Conversion Architect:** Focuses on PAS/AIDA copywriting and CRO strategy. Setup in [skills/conversion-architect/SKILL.md](file://./skills/conversion-architect/SKILL.md).
*   **Brand Architect:** Focuses on color identity, typography, and visual assets. Setup in [skills/brand-architect/SKILL.md](file://./skills/brand-architect/SKILL.md).
*   **Experience Architect:** Focuses on Astro JS, Tailwind CSS, and UX layouts. Setup in [skills/experience-architect/SKILL.md](file://./skills/experience-architect/SKILL.md).
*   **Automation Architect:** Focuses on Webhooks, CRM integrations, and response SLA. Setup in [skills/automation-architect/SKILL.md](file://./skills/automation-architect/SKILL.md).
*   **Insight Architect:** Focuses on Google Tag Manager, GA4, and A/B audits. Setup in [skills/insight-architect/SKILL.md](file://./skills/insight-architect/SKILL.md).

## Usage Standard
When asked to act as one of these architects, read and apply the standards, rules, and reference files specified in the corresponding folder.
`;
      fs.writeFileSync(grokMdPath, grokContent, 'utf8');
      console.log(`   ✅ Created .grok/grok.md`);
    }
  }

  if (clis.includes('other')) {
    const genericDest = isGlobal ? targets.other.global : targets.other.local;
    console.log(`🤖 Deploying for Generic Agent Environment -> ${genericDest}`);
    ensureDir(genericDest);
    for (const arch of architects) {
      const src = path.join(srcDir, arch);
      const dest = path.join(genericDest, arch);
      if (fs.existsSync(src)) {
        copyFolderSync(src, dest);
        console.log(`   ✅ Loaded ${arch}`);
      }
    }
  }

  console.log(`\n🎉 Installation complete!`);
}

async function runInteractive() {
  console.log(`==========================================`);
  console.log(`🏛️  PageSquad AI Installer`);
  console.log(`==========================================\n`);

  console.log(`Select the Agent CLI(s) you wish to install skills for:`);
  console.log(`  [1] Antigravity CLI`);
  console.log(`  [2] Claude Code CLI`);
  console.log(`  [3] OpenAI Codex CLI`);
  console.log(`  [4] Grok Build CLI`);
  console.log(`  [5] Other (Generic .skills/ folder)`);
  console.log(`  [6] All of the above`);
  console.log(`  [7] Exit`);
  
  const choice = await askQuestion(`\nEnter choice (e.g. 1, 2, or 6): `);
  if (choice === '7' || !choice) {
    console.log('❌ Installation cancelled.');
    process.exit(0);
  }

  let selectedCLIs = [];
  if (choice === '6') {
    selectedCLIs = ['antigravity', 'claude', 'codex', 'grok', 'other'];
  } else {
    const choices = choice.split(',').map(c => c.trim());
    for (const c of choices) {
      if (c === '1') selectedCLIs.push('antigravity');
      else if (c === '2') selectedCLIs.push('claude');
      else if (c === '3') selectedCLIs.push('codex');
      else if (c === '4') selectedCLIs.push('grok');
      else if (c === '5') selectedCLIs.push('other');
    }
  }

  if (selectedCLIs.length === 0) {
    console.log('❌ Invalid selection. Exiting.');
    process.exit(1);
  }

  console.log(`\nSelect Scope:`);
  console.log(`  [1] Local Workspace scope (Recommended)`);
  console.log(`  [2] Global User scope`);
  const scopeChoice = await askQuestion(`\nEnter choice (1-2): `);
  const isGlobal = scopeChoice === '2';

  await installSkillsFor(selectedCLIs, isGlobal);
}

// Check arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`🏛️  PageSquad AI Installer`);
  console.log(`Usage: node install-skills.js [options]`);
  console.log(`\nOptions:`);
  console.log(`  --local          Install locally in workspace (default)`);
  console.log(`  --global         Install globally in home directory`);
  console.log(`  --antigravity    Only install for Antigravity CLI`);
  console.log(`  --claude         Only install for Claude Code CLI`);
  console.log(`  --codex          Only install for OpenAI Codex CLI`);
  console.log(`  --grok           Only install for Grok Build CLI`);
  console.log(`  --other          Only install generic .skills/ folder`);
  console.log(`  --all            Install for all CLIs (default)`);
  process.exit(0);
}

(async () => {
  if (args.length > 0) {
    // Non-interactive mode
    const isGlobal = args.includes('--global');
    let selectedCLIs = [];
    if (args.includes('--antigravity')) selectedCLIs.push('antigravity');
    if (args.includes('--claude')) selectedCLIs.push('claude');
    if (args.includes('--codex')) selectedCLIs.push('codex');
    if (args.includes('--grok')) selectedCLIs.push('grok');
    if (args.includes('--other')) selectedCLIs.push('other');
    
    if (selectedCLIs.length === 0 || args.includes('--all')) {
      selectedCLIs = ['antigravity', 'claude', 'codex', 'grok', 'other'];
    }
    
    await installSkillsFor(selectedCLIs, isGlobal);
  } else {
    // Interactive mode
    await runInteractive();
  }
})().catch(err => {
  console.error('❌ Installation failed:', err);
  process.exit(1);
});

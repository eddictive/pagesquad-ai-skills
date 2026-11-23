#!/usr/bin/env bash
# Initialize the standard PageSquad site: current Astro (7.x), Svelte 5 islands,
# Tailwind v4. See SKILL.md and references/astro_patterns.md.
#
# Usage:
#   init-astro-project.sh <target-directory> [--name <project-name>] [--skip-install]
#
# Behavior:
#   - Creates the canonical directory tree and starter files defined by the
#     Experience Architect Build Protocol (see SKILL.md).
#   - If <target-directory> already contains an Astro project, only missing
#     directories/files are added (idempotent).
#   - Unless --skip-install is passed, scaffolds via `bun create astro@latest`
#     before layering the PageSquad structure on top. Bun is the only runtime.
#   - Installs current Astro (7.x via create astro@latest). Does not pin astro@5 or astro@6.
#
# Examples:
#   init-astro-project.sh ./my-lander
#   init-astro-project.sh . --skip-install        # structure only, existing project
#   init-astro-project.sh ./site --name my-site

set -euo pipefail

die() { echo "[ERROR] $*" >&2; exit 1; }

[[ $# -lt 1 ]] && die "Usage: init-astro-project.sh <target-directory> [--name <project-name>] [--skip-install]"

TARGET_DIR="$1"
NAME="$(basename "$TARGET_DIR")"
SKIP_INSTALL=false

shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --name) NAME="$2"; shift 2 ;;
    --skip-install) SKIP_INSTALL=true; shift ;;
    *) die "Unknown option: $1" ;;
  esac
done

command -v bun >/dev/null 2>&1 || die "Bun is required. Install Bun, or pass --skip-install and scaffold manually."
PKG_MGR="bun"

mkdir -p "$TARGET_DIR"

# --- Scaffold Astro itself (unless skipped or already present) ---
if [[ "$SKIP_INSTALL" == false && ! -f "$TARGET_DIR/package.json" ]]; then
  echo "[OK] Scaffolding Astro (minimal template) via bun..."
  (cd "$TARGET_DIR" && bun create astro@latest . --template minimal --install --no-git --yes)
fi

[[ -f "$TARGET_DIR/package.json" ]] || die "No package.json in $TARGET_DIR — scaffold Astro first or drop --skip-install."

# --- Version floor ---
if grep -Eq '"astro"[[:space:]]*:[[:space:]]*"[~^]?[56]\.' "$TARGET_DIR/package.json"; then
  echo "[WARN] This project is not on Astro 7. Astro 5 is end-of-life; Astro 6 is the previous major."
  echo "       Upgrade before building: (cd \"$TARGET_DIR\" && $PKG_MGR add astro@7)"
fi

# --- Tailwind v4 + Svelte 5 ---
if ! grep -q '"tailwindcss"' "$TARGET_DIR/package.json" 2>/dev/null; then
  echo "[OK] Adding Tailwind v4..."
  (cd "$TARGET_DIR" && "$PKG_MGR" add tailwindcss @tailwindcss/vite)
fi

if ! grep -q '"svelte"' "$TARGET_DIR/package.json" 2>/dev/null; then
  echo "[OK] Adding Svelte 5 and @astrojs/svelte..."
  (cd "$TARGET_DIR" && "$PKG_MGR" add svelte@5 @astrojs/svelte)
fi

# --- PageSquad canonical structure ---
DIRS=(
  "src/components/sections"
  "src/components/ui"
  "src/components/islands"
  "src/layouts"
  "src/data/pages"
  "src/styles"
  "src/assets"
  "public"
)
for d in "${DIRS[@]}"; do
  mkdir -p "$TARGET_DIR/$d"
done
echo "[OK] Directory tree created (sections/ui/islands/layouts/data/styles/assets)."

# --- Starter files (only if missing — idempotent) ---

# global.css with @theme tokens placeholder
if [[ ! -f "$TARGET_DIR/src/styles/global.css" ]]; then
  cat > "$TARGET_DIR/src/styles/global.css" <<'CSS'
@import "tailwindcss";

/* Design tokens — map from brand_state.json */
@theme {
  --color-primary: #0F172A;
  --color-secondary: #1E293B;
  --color-background: #F8FAFC;
  --color-accent: #F59E0B;
  --font-heading: "Outfit", sans-serif;
  --font-body: "Plus Jakarta Sans", sans-serif;
}
CSS
  echo "[OK] Created src/styles/global.css (@theme tokens)"
fi

# BaseLayout.astro
if [[ ! -f "$TARGET_DIR/src/layouts/BaseLayout.astro" ]]; then
  cat > "$TARGET_DIR/src/layouts/BaseLayout.astro" <<'ASTRO'
---
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
  canonical?: string;
}

const { title, description, canonical = Astro.url.href } = Astro.props;
---

<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <!-- TODO: JSON-LD from visibility_state.json. Escape "<" before set:html. -->
  </head>
  <body class="bg-background font-body text-primary">
    <slot />
  </body>
</html>
ASTRO
  echo "[OK] Created src/layouts/BaseLayout.astro"
fi

# Page data type stub
if [[ ! -f "$TARGET_DIR/src/data/types.ts" ]]; then
  cat > "$TARGET_DIR/src/data/types.ts" <<'TS'
// Shared interfaces — map pipeline state (visibility/conversion/brand) into components.
export interface CampaignData {
  hero: { headline: string; subheadline: string; ctaPrimary: string; ctaSecondary: string };
  sections: { id: string; title: string; copy: string }[];
  formFields: { name: string; type: string; required: boolean; label: string }[];
}
TS
  echo "[OK] Created src/data/types.ts"
fi

# svelte.config.js — required so the Svelte language tools and vitePreprocess agree
if [[ ! -f "$TARGET_DIR/svelte.config.js" ]]; then
  cat > "$TARGET_DIR/svelte.config.js" <<'JS'
import { vitePreprocess } from '@astrojs/svelte';

export default {
  preprocess: vitePreprocess(),
};
JS
  echo "[OK] Created svelte.config.js"
fi

# Example island. Static until a page adds a client:* directive.
if [[ ! -f "$TARGET_DIR/src/components/islands/LeadForm.svelte" ]]; then
  cat > "$TARGET_DIR/src/components/islands/LeadForm.svelte" <<'SVELTE'
<script lang="ts">
  /** Svelte 5 island. Hydrate only when the Island Decision Tree says so. */
  interface Field {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
  }

  let { fields = [], action = '' }: { fields?: Field[]; action?: string } = $props();
  let status = $state<'idle' | 'submitting'>('idle');
</script>

<form method="POST" action={action} onsubmit={() => (status = 'submitting')}>
  {#each fields as field (field.name)}
    <label>
      {field.label}
      <input name={field.name} type={field.type ?? 'text'} required={field.required} />
    </label>
  {/each}
  <button type="submit" data-tracking-id="cta_form_submit" disabled={status === 'submitting'}>
    {status === 'submitting' ? 'Mengirim…' : 'Kirim'}
  </button>
</form>
SVELTE
  echo "[OK] Created src/components/islands/LeadForm.svelte (Svelte 5, not hydrated until client:*)"
fi

write_astro_config() {
  cat > "$TARGET_DIR/astro.config.mjs" <<'JS'
// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

// PageSquad default: static SSG. See references/astro_patterns.md before
// switching output to 'server' or opting a route out with prerender = false.
export default defineConfig({
  output: 'static',
  integrations: [svelte()],
  vite: { plugins: [tailwindcss()] },
  security: {
    checkOrigin: true,
  },
});
JS
}

CONFIG="$TARGET_DIR/astro.config.mjs"
if [[ ! -f "$CONFIG" ]]; then
  write_astro_config
  echo "[OK] Created astro.config.mjs (static output, Svelte 5, Tailwind v4)"
elif ! grep -q '@astrojs/svelte' "$CONFIG"; then
  # Replace only the untouched create-astro stub. Leave real configs alone.
  line_count=$(wc -l < "$CONFIG" | tr -d ' ')
  if [[ "$line_count" -le 25 ]] && grep -q 'defineConfig' "$CONFIG"; then
    write_astro_config
    echo "[OK] Replaced stock astro.config.mjs with the PageSquad config"
  else
    cat <<'NOTE'
[WARN] astro.config.mjs has no @astrojs/svelte. Add this yourself; the file was left untouched:

  import svelte from '@astrojs/svelte';
  import tailwindcss from '@tailwindcss/vite';
  export default defineConfig({
    output: 'static',
    integrations: [svelte()],
    vite: { plugins: [tailwindcss()] },
    security: { checkOrigin: true },
  });
NOTE
  fi
fi

echo ""
echo "[OK] PageSquad Astro project ready at: $TARGET_DIR"
echo "Stack: current Astro 7.x, Svelte 5 islands, Tailwind v4, output static."
echo "Next steps:"
echo "  1. Fill @theme tokens in src/styles/global.css from brand_state.json"
echo "  2. Build sections in src/components/sections/ (see SKILL.md Build Protocol)"
echo "  3. Verify: bun verify-build.ts --src $TARGET_DIR/src --dist $TARGET_DIR/dist"

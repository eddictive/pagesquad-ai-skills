#!/usr/bin/env bash
# Initialize the standard PageSquad Astro + Tailwind v4 project structure.
#
# Usage:
#   init-astro-project.sh <target-directory> [--name <project-name>] [--skip-install]
#
# Behavior:
#   - Creates the canonical directory tree and starter files defined by the
#     Experience Architect Build Protocol (see SKILL.md).
#   - If <target-directory> already contains an Astro project, only missing
#     directories/files are added (idempotent).
#   - Unless --skip-install is passed, scaffolds via `bun create astro`
#     (falls back to npm) before layering the PageSquad structure on top.
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

PKG_MGR=""
command -v bun >/dev/null 2>&1 && PKG_MGR="bun"
[[ -z "$PKG_MGR" ]] && command -v npm >/dev/null 2>&1 && PKG_MGR="npm"
[[ -z "$PKG_MGR" ]] && die "Neither bun nor npm found. Install one, or pass --skip-install and scaffold manually."

mkdir -p "$TARGET_DIR"

# --- Scaffold Astro itself (unless skipped or already present) ---
if [[ "$SKIP_INSTALL" == false && ! -f "$TARGET_DIR/package.json" ]]; then
  echo "[OK] Scaffolding Astro (minimal template) via $PKG_MGR..."
  if [[ "$PKG_MGR" == "bun" ]]; then
    (cd "$TARGET_DIR" && bun create astro@latest . --template minimal --install --no-git --yes)
  else
    (cd "$TARGET_DIR" && npm create astro@latest . -- --template minimal --install --no-git --yes)
  fi
fi

[[ -f "$TARGET_DIR/package.json" ]] || die "No package.json in $TARGET_DIR — scaffold Astro first or drop --skip-install."

# --- Tailwind v4 ---
if ! grep -q '"tailwindcss"' "$TARGET_DIR/package.json" 2>/dev/null; then
  echo "[OK] Adding Tailwind v4..."
  (cd "$TARGET_DIR" && "$PKG_MGR" add tailwindcss @tailwindcss/vite)
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
    <!-- TODO: JSON-LD schema from visibility_state.json -->
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

# Vite plugin reminder for astro.config
if ! grep -q '@tailwindcss/vite' "$TARGET_DIR/astro.config.mjs" 2>/dev/null; then
  cat <<'NOTE'
[WARN] Remember to register the Tailwind vite plugin in astro.config.mjs:

  import tailwindcss from '@tailwindcss/vite';
  export default defineConfig({
    vite: { plugins: [tailwindcss()] },
  });
NOTE
fi

echo ""
echo "[OK] PageSquad Astro project ready at: $TARGET_DIR"
echo "Next steps:"
echo "  1. Fill @theme tokens in src/styles/global.css from brand_state.json"
echo "  2. Build sections in src/components/sections/ (see SKILL.md Build Protocol)"
echo "  3. Verify: node verify-build.js --src $TARGET_DIR/src --dist $TARGET_DIR/dist"

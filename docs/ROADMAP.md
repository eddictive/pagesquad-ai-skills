# PageSquad AI — Skills Roadmap

Roadmap pengembangan skill PageSquad AI. Satu bagian per audit/plan, terbaru di atas.

---

## Lighthouse Performance 100 — 2026-11-23

**Status:** Guideline added. One home: `skills/pagesquad-experience-architect/references/core_web_vitals.md`.

The CWV "good" band (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1) scores about **90**, not 100. The guide uses the documented Lighthouse 10 weights (TBT 30%, LCP 25%, CLS 25%, FCP 10%, Speed Index 10%) and a mobile lab bar of TBT 0 ms, CLS 0, LCP about 1.2 s. Field CrUX stays a FAST / good-band check, not a score out of 100.

Experience, Visibility, Brand, Insight, and Automation each assert their piece. `pagespeed-audit` now fails Performance under 100 and leaves SEO, accessibility, and best-practices at 90+.

---

## Astro 7 + Svelte 5 + security — 2026-11-23

**Status:** Stack, security guideline, and maintainer `AGENTS.md` landed. Open items below.

### What changed

- Generated sites target **Astro 7 latest patch** (7.4 line as of 2026-11) + **Svelte 5** islands + Tailwind v4. Astro 5 and 6 are not install targets. Astro 5.18.2 was the last 5.x release and is outside the security-fix window.
- `astro_patterns.md` is the stack source of truth: static / per-route SSR / server output, Content Layer (`src/content.config.ts`), server islands, `astro:env`, Actions, Svelte 5 runes. Removed APIs called out: `output: 'hybrid'`, `Astro.glob()`, `<ViewTransitions />`, `src/content/config.ts`.
- `init-astro-project.sh` adds `svelte@5`, `@astrojs/svelte`, `svelte.config.js`, and an Astro 7 config (`output: 'static'`, `security.checkOrigin`). Warns when an existing project is still on Astro 5 or 6.
- Orchestrator sample state no longer emits a React `LeadForm.tsx` island. Simple forms stay at zero hydrated islands. `stack` is part of `experience_state.json`.
- Security guideline: `skills/pagesquad-experience-architect/references/security_guidelines.md` (pointer: `docs/SECURITY.md`). Visibility, Automation, and Insight assert against it. New Apps Script handlers omit `err.toString()`.
- Maintainer contract: root `AGENTS.md` (`pagesquad-skills-repo`). The installer will not overwrite that marker. `AGENTS.md` is tracked again.

### Still open

| Item | Why it matters |
|---|---|
| `create-lead-sheet` still deploys a public Apps Script `doPost` with no server-side shared secret | A secret in client JS does not help. The real fix is an Astro Action proxy that holds `LEAD_INGEST_SECRET`. Documented in the security guideline; not built. |
| No automated tests for `verify-build`, the installer, or the orchestrator | Schema drift between `SKILL.md` and `orchestrate-build.js` is easy to miss. |
| JS / TS / Python copies of each utility can drift | A fix in one runtime is unfinished until the other two match. There is no check that enforces this. |
| `wa-link-builder` utility | Still open from the 2026-09-16 Automation plan. |
| Service-account docs used to recommend `roles/editor` | Docs now say least privilege. The script scopes were already narrower than Editor. No code change required. |

---

## Experience Architect Upgrade — 2026-09-16

**Sumber:** Audit mendalam SKILL.md + 5 file references + integrasi `orchestrate-build.js`
**Status:** Plan #1 & #2 diimplementasikan (lihat commit terkait). #3–#7 backlog.

### Temuan Audit

**Kondisi:** Skill paling "tipis" dari enam Architect (49 baris SKILL.md + 171 baris references) untuk peran "Technical Lead" yang paling berat.

#### 🔴 Critical

1. **SKILL.md tidak berisi cara membangun** — hanya mode, schema, assertions. Tidak ada panduan scaffold project, naming convention, wiring form → automation. Pipeline jadi non-deterministic.
2. **Schema `experience_state.json` tidak sinkron dengan downstream** — Automation Architect butuh `form_fields` untuk mapping webhook; Insight Architect butuh `tracking_hooks` (ID/class elemen) untuk dataLayer; tidak ada `output_path` untuk verifikasi file.
3. **Astro/Tailwind roadmap kedaluwarsa** — `astro_patterns.md` belum mencakup `astro:assets` (`<Image>`/`<Picture>`), Astro Actions untuk form, View Transitions, Server Islands, Tailwind v4 CSS-first `@theme`.
4. **Tidak ada decision tree island** — kapan vanilla `<script>` vs framework island (`client:load`/`client:visible`)? Salah pilih menggagalkan assertion static-islands.

#### 🟠 Medium

5. **Tidak ada utility script** — Visibility Architect punya `pagespeed-audit`; Experience Architect tidak punya scaffold/verify-build script.
6. **DaisyUI + Shadcn disebut bersamaan** tanpa keputusan kapan pakai yang mana (filosofi bertolak belakang; Shadcn butuh React).
7. **Assertion #3 tidak verifiable** — "page speed optimized" tanpa mekanisme cek (build size? island count?).
8. **Tidak ada mode remediasi** — tidak bisa menerima hasil audit (mis. PageSpeed failing audits) dan memperbaiki kode; hanya build baru / audit manual.

#### 🟢 Baik (pertahankan)

- Struktur mode Isolated/Pipeline konsisten
- References UI/UX (Nielsen, audit checklist) solid
- Progressive disclosure + token optimization protocol
- Prinsip static-first & mobile-first

### Action Plan

| # | Aksi | Effort | Nilai | Status |
|---|---|---|---|---|
| 1 | Perluas SKILL.md: scaffold blueprint, naming convention, island decision tree, form→automation wiring | 0.5 hari | ⭐⭐⭐⭐⭐ | ✅ Done (2026-09-16) |
| 2 | Upgrade schema `experience_state.json`: + `form_fields`, `tracking_hooks`, `output_path` | 1 jam | ⭐⭐⭐⭐⭐ | ✅ Done (2026-09-16) |
| 3 | Update `astro_patterns.md`: astro:assets, Actions, View Transitions, Tailwind v4 `@theme` | 2 jam | ⭐⭐⭐⭐ | ✅ Done (2026-09-16) |
| 4 | Utility script: `init-astro-project` + `verify-build` (js/ts/py) | 0.5 hari | ⭐⭐⭐⭐ | ✅ Done (2026-09-16) |
| 5 | Putuskan DaisyUI vs Shadcn per use case + dokumentasi trade-off | 30 mnt | ⭐⭐⭐ | ✅ Done (2026-09-16) |
| 6 | Assertion verifiable: run build & report bundle size / island count | 1 jam | ⭐⭐⭐ | ✅ Done (2026-09-16) |
| 7 | Mode C: Remediate (audit findings → fixed code) | 2 jam | ⭐⭐⭐ | ✅ Done (2026-09-16) |

### Detail Implementasi #3–#7

**#3 — `astro_patterns.md` rewrite**: `astro:assets` (`<Image>`/`<Picture>` dengan srcset, width/height enforced), Astro Actions untuk form (server logic + zod validation tanpa island), ClientRouter View Transitions, sitemap integration, kontrak field name dengan Automation Architect.

**#4 — Utility scripts**:
- `scripts/init-astro-project.sh` — scaffold struktur standar (8 direktori, `global.css` dengan `@theme` tokens, `BaseLayout.astro`, `types.ts`); idempotent; opsi `--skip-install` untuk project existing. Runtime later pinned to Bun only (npm fallback removed).
- `scripts/verify-build.{js,ts,py}` — 4 checks: build exit code, total client JS ≤ budget (default 50 KiB), island count ≤ max (default 3), raw `<img>` punya width/height. Output PASS/FAIL per check + exit code untuk orchestrator. Teruji 3 skenario (over-budget FAIL → partial FAIL → all-PASS) di ketiga varian.

**#5 — `tailwind_components.md`**: decision table 3 kolom (vanilla utilities default / DaisyUI untuk widget static / Shadcn hanya dalam React island kompleks) + larangan campur library dalam satu project.

**#6 — Assertion #3 kini executable**: assertion merujuk `verify-build` script; hasil wajib direkam di `build_verification` state.

**#7 — Mode C: Remediate**: menerima audit findings (mis. PageSpeed failing audits) → map ke fix berdasarkan 4 kategori prioritas (a11y → image delivery → JS/CSS waste → caching), output per-finding table (finding → file → fix), re-run verification untuk before/after, larangan fix yang men-regress metric lain.

### Detail Implementasi #1 & #2

**#1 — SKILL.md expansion** (baru):
- Section *Build Protocol*: scaffold standard (`bun create astro` → minimal template + Tailwind v4), struktur direktori baku (`src/pages`, `src/components/sections`, `src/components/ui`, `src/layouts`, `src/data/pages`, `src/styles`), naming convention PascalCase untuk komponen section
- *Island Decision Tree*: vanilla `<script>` untuk interaksi ringan (menu, accordion, counter) → `client:visible` untuk komponen framework below-fold → `client:load` hanya jika interaktif di atas fold → `client:idle` untuk non-kritis
- *Form Wiring Protocol*: form field HARUS didefinisikan dengan `name` eksplisit yang cocok dengan `automation_state.json` mapping; submit via Astro Action/APIRoute; tracking hook (`data-tracking-id`) di setiap elemen konversi
- Assertion #3 diperkuat dengan verifikasi konkret

**#2 — Schema upgrade** (`experience_state.json`):
```json
{
  "layout_model": "Astro/Tailwind static page",
  "output_path": "src/pages/index.astro",
  "components_compiled": [...],
  "form_fields": [
    { "name": "full_name", "type": "text", "required": true, "label": "Nama Lengkap" }
  ],
  "tracking_hooks": [
    { "element": "#cta-hero-btn", "event": "cta_click", "location": "hero" }
  ],
  "styling_mappings": { ... },
  "islands_used": [{ "component": "LeadForm.tsx", "directive": "client:visible" }],
  "build_verification": { "passed": true, "bundle_size_kb": 42, "island_count": 1 },
  "accessibility_status": "WCAG_AA_Validated"
}
```

---

## Log

- 2026-09-16: Audit Experience Architect; implementasi plan #1 (SKILL.md expansion) & #2 (schema upgrade). Roadmap doc dibuat.
- 2026-09-16: Backlog #3–#7 selesai — astro_patterns + tailwind_components rewrite, utility scripts (init-astro-project.sh, verify-build js/ts/py), Mode C Remediate, assertion executable. Semua item action plan Done.

---

## Automation Architect Upgrade — 2026-09-16

**Sumber:** Audit user-driven — skill hanya mendukung HubSpot webhook; market Indonesia butuh chat-first capture
**Referensi nyata:** https://lp.kotanabi.com/konsultasi/ (reverse-engineered: Astro + React island, dual-submit WhatsApp redirect + Google Apps Script sheet logging + dataLayer event)

### Temuan

1. **Capture method tunggal & enterprise-heavy** — schema hanya kenal `target_crm: HubSpot` + REST webhook; tidak ada jalur gratis/chat-first
2. **Referensi WhatsApp hanya API resmi Meta** (approval template, biaya) — overkill untuk UMKM; tidak ada pola `wa.me` deep-link gratis
3. **Tidak ada logging murah** — Google Sheet via Apps Script tidak tercover (padahal pola umum SMB Indonesia)

### Implementasi

- **Lead Capture Decision Tree** di SKILL.md: `whatsapp_redirect` (default market chat-first) → `google_script_sheet` → `crm_webhook` → `middleware`
- **Schema upgrade**: `capture_method`, `form_mappings.whatsapp_number` (E.164 tanpa +), `whatsapp_redirect.message_template` dengan token `{{field}}`, `target_crm` boleh `"Google Sheets"` / `null`
- **Reference baru** `lead_capture_methods.md`: kode client-side WhatsApp redirect, pola dual-submit KotaNabi, Apps Script `doPost` + setup steps, Google Forms embed alternative, tabel perbandingan 6 metode
- **Assertions diperkuat**: field mapping vs `experience_state.json → form_fields`, format nomor E.164, dataLayer event wajib per submit path
- **Orchestrator**: Automation step kini output capture_method whatsapp_redirect + sheet logging default (Indonesia-market), field mapping tetap derived dari experience form_fields

### Action Plan

| # | Aksi | Status |
|---|---|---|
| 1 | Decision tree + schema upgrade (SKILL.md) | ✅ Done |
| 2 | Reference lead_capture_methods.md (kode konkret) | ✅ Done |
| 3 | Orchestrator sync | ✅ Done |
| 4 | Tambah utility script (mis. wa-link-builder) | ⬜ Backlog |

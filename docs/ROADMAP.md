# PageSquad AI — Skills Roadmap

Roadmap pengembangan skill PageSquad AI. Satu bagian per audit/plan, terbaru di atas.

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
| 3 | Update `astro_patterns.md`: astro:assets, Actions, View Transitions, Tailwind v4 `@theme` | 2 jam | ⭐⭐⭐⭐ | ⬜ Backlog |
| 4 | Utility script: `init-astro-project` + `verify-build` (js/ts/py) | 0.5 hari | ⭐⭐⭐⭐ | ⬜ Backlog |
| 5 | Putuskan DaisyUI vs Shadcn per use case + dokumentasi trade-off | 30 mnt | ⭐⭐⭐ | ⬜ Backlog |
| 6 | Assertion verifiable: run build & report bundle size / island count | 1 jam | ⭐⭐⭐ | ⬜ Backlog |
| 7 | Mode C: Remediate (audit findings → fixed code) | 2 jam | ⭐⭐⭐ | ⬜ Backlog |

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

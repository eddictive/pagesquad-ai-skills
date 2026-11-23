# Security Guidelines

OWASP-oriented rules for every site this squad generates, and for this skills repository. One home: this file. Other skills and `docs/SECURITY.md` point here.

Load this file when the work touches forms, endpoints, headers, env vars, tracking pixels, webhooks, Apps Script, or dependencies. Do not paste exploit steps, payloads, or proof-of-concept strings into skills, state files, or reports.

## 1. Version floor (A06 — vulnerable components)

New sites install the **latest Astro 7 patch** and **Svelte 5**.

- Do not scaffold `astro@5` or `astro@6`. Astro 5 ended at 5.18.2 (2026-05-26) and is outside the security-fix window. Astro 6 is the previous major only.
- Stay on the latest 7.4 patch or newer. The 7.4 line closed several issues in the image endpoint, script/style rendering, and view transitions. Pinning an older 7.0–7.3 release reopens those bugs.
- Commit the lockfile. Do not float `"astro": "latest"` in `package.json`.
- Add a dependency only when the Island Decision Tree or a written requirement needs it. Do not add React to style a button.

Rendering details (static, per-route SSR, server output, Content Layer, server islands, `astro:env`, Actions) live in `astro_patterns.md`.

## 2. Secrets (A02 — cryptographic failures)

- Secrets live in the server environment: `astro:env/server` with `access: 'secret'`. Never `PUBLIC_`, never a Svelte island, never a `wa.me` URL, never a state JSON file, never a client `dataLayer` payload.
- `.env`, service-account JSON, and OAuth tokens are gitignored. Examples use placeholders (`DEPLOY-YOUR-APPS-SCRIPT`, `6281234567890`).
- If a command fails for a missing credential, stop and ask the user. Do not scrape a replacement key, reuse a token from another project, or invent one.
- `experience_state.json` and `automation_state.json` may name a field (`submit_url`). They must not contain a live secret. A public Apps Script URL is a credential: treat it as one in the repo even though a client-side form will eventually expose it. See §5.

## 3. Injection and XSS (A03)

- Render text as text. Do not use `set:html` for copy, form values, CMS fields, query params, or lead data.
- Markdown and MDX from authors are untrusted until the renderer escapes HTML. Do not pass attacker-controlled language labels or raw HTML into code blocks.
- JSON-LD is inserted as HTML. Escape `<` before `set:html`:

```ts
const jsonLd = JSON.stringify(schema).replace(/</g, '\\u003c');
```

- Svelte 5 escapes `{expression}` text. Do not use `{@html expression}` for anything the user, a CRM, or a query string can influence.
- Do not echo server exception strings to the browser. `err.toString()` in a JSON response is an information leak.
- `is:inline` scripts skip Astro's bundler and break CSP hashing. Prefer a processed `<script>` unless a vendor snippet cannot be moved.

## 4. Access control and CSRF (A01, A05)

- Leave `security.checkOrigin` at `true`. It is Astro's CSRF check for on-demand form posts. Disabling it requires a written reason in the PR or state notes.
- On-demand routes (`prerender = false`, `output: 'server'`, Actions, server islands) are the ones that need this check. A fully static file has no server to abuse, and also no server to hide a secret.
- Server-island props are encrypted by Astro. Still do not put secrets in them. Set `ASTRO_KEY` when more than one instance serves the site.
- Do not authorize requests by reading only `Referer`. The origin check above is the control.

## 5. Forms, webhooks, and Apps Script (A04, A08)

Pick the trust boundary before writing the submit handler.

| Path | Rule |
|---|---|
| Browser → Astro Action or `src/pages/api` → CRM / Apps Script | **Preferred** when an adapter exists. Validate with `astro:schema` (Zod). Hold `LEAD_INGEST_SECRET` on the server. Forward only the allowlisted fields. |
| Browser → `wa.me` / `api.whatsapp.com` | Allowed for chat-first capture. `encodeURIComponent` the message. The URL is public. Do not put a CRM token, sheet id, or secret in the message or the link. |
| Browser → public Apps Script `doPost` | The web-app URL is world-callable once it is in client JS. A second secret embedded in that same JS does not help. Allowlist fields, reject unexpected keys, return `{ status: 'error' }` with no exception text, and watch the sheet for spam. |
| HubSpot / Salesforce webhook | Sign or authenticate the request the vendor documents. Verify the signature on the server. Do not call the CRM from a Svelte island. |

`create-lead-sheet` deploys the Apps Script web app as "anyone" and, until a later change, does not inject a server-side secret. Prefer the Action proxy in the table when the site has an adapter. Do not return `err.toString()` from new `doPost` handlers.

Honeypot field plus a server-side size limit on the body. Astro's `actionBodySizeLimit` exists for Actions; do not accept unbounded JSON.

## 6. Headers and CSP (A05)

On Astro 6+ set CSP once the Insight Architect's script origins are known:

```js
export default defineConfig({
  security: {
    checkOrigin: true,
    csp: true,
  },
});
```

Add vendor origins explicitly (`scriptDirective` / `styleDirective`). GTM, Meta, and TikTok will not work under the default policy until those origins are listed. Coordinate the list; do not drop in `'unsafe-inline'` and `'unsafe-eval'` to make a tag manager load.

Static hosts still need response headers (`public/_headers`, Netlify headers, or the adapter):

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Send `Strict-Transport-Security` only on the HTTPS production host.

Base layout also sets `<meta name="referrer" content="strict-origin-when-cross-origin" />`.

## 7. SSRF and images (A10)

- Remote `astro:assets` URLs belong to an allowlist. Do not pass a user-supplied URL to the image optimizer.
- The on-demand `/_image` endpoint has had path and host bugs in older 7.x patches. Run the current 7.4 patch or newer, and do not enable on-demand image optimization for untrusted input.
- Server-side `fetch` from an Action uses a fixed destination (the CRM URL from configuration), not a URL taken from the form body.

## 8. Tracking and privacy (A09, Insight Architect)

- No names, emails, phone numbers, or message bodies in `dataLayer`, GA4, Meta, or TikTok payloads. Ids and `capture_method` are enough.
- Marketing pixels fire after consent. `privacy_consent_mode: "v2_enabled"` is the default in `insight_state.json`. A page that loads GTM in `<head>` before consent does not meet that flag.
- Do not log lead bodies in client console, analytics, or the Apps Script error response.
- Partytown moves a script off the main thread. It is not a security boundary and it is not a consent tool.

## 9. Skills repository

These rules apply when editing `pagesquad-ai-skills` itself:

- Do not commit `.env`, `.credentials/`, or a Google key file. `.gitignore` already excludes them.
- Utility scripts fail closed when a credential is missing. Keep that behavior.
- Service accounts used by `create-lead-sheet` do not get `roles/editor` or `roles/owner`. Enable the Sheets, Apps Script, and Drive APIs and request only the scopes listed in the script header.
- Generated examples stay placeholders. A real `submit_url` from a client project does not belong in this repo.
- Security changes are made in this file first, then linked. Do not copy the policy into a second skill.

## 10. Quick check before hand-off

1. Astro major is 7, latest patch, lockfile present. Svelte islands use runes.
2. No secret in a client component, public env, state file, or WhatsApp URL.
3. Forms validate on the server when a server exists. `checkOrigin` is still on.
4. No `set:html` / `{@html}` of untrusted data. JSON-LD escapes `<`.
5. Error responses do not include exception text.
6. Pixels wait for consent and carry no PII.
7. New dependencies are justified by name in the state notes.

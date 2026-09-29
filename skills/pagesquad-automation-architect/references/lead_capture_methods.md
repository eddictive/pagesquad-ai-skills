# Lead Capture Methods Implementation Guide

Concrete implementations for each capture method in the Lead Capture Decision Tree. Field names must match `experience_state.json → form_fields`.

## 1. WhatsApp Redirect (`whatsapp_redirect`)

The Indonesia-market default: submit opens a pre-filled chat to the sales number. Zero backend, zero cost, instant human contact.

### Client-side pattern (works in vanilla JS or an island)

```javascript
const WHATSAPP_NUMBER = '6281234567890'; // E.164, no '+'

function buildWhatsAppUrl(fields) {
  const message = `Halo Admin,\nSaya ${fields.full_name} tertarik dengan ${fields.package}.\nNo. WA saya: ${fields.phone}.\n${fields.message}`;
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fields = Object.fromEntries(new FormData(form));
  // fire conversion tracking first (Insight Architect contract)
  window.dataLayer?.push({ event: 'lead_submission', capture_method: 'whatsapp_redirect' });
  window.open(buildWhatsAppUrl(fields), '_blank');
});
```

- URL host: `api.whatsapp.com/send` or `wa.me/<number>?text=` — both work on mobile & desktop.
- Keep the pre-filled message under ~400 URL-encoded chars (some browsers truncate long URLs).
- Phone validation: digits only, 8–15 chars; normalize `08…` → `628…` before sending anywhere.
- Static-page variant (no JS): a plain `<a href="https://wa.me/628...?text=...">` CTA button — zero island cost.

### The KotaNabi pattern (dual-submit — recommended for chat-first + logging)

One submit does both: open WhatsApp AND log to Google Sheet.

```javascript
async function onSubmit(e) {
  e.preventDefault();
  const fields = Object.fromEntries(new FormData(form));
  window.dataLayer?.push({ event: 'lead_submission', capture_method: 'whatsapp_redirect+sheet' });

  // 1. Open pre-filled WhatsApp chat (user continues conversation there)
  window.open(buildWhatsAppUrl(fields), '_blank');

  // 2. Log the lead to Google Sheet via Apps Script (fire-and-forget)
  await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors', // Apps Script does not return CORS headers
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toLocaleString('id-ID'),
      name: fields.full_name,
      phone: fields.phone,
      source: 'Landing Page',
      message: fields.message,
    }),
  }).catch(() => {/* non-blocking: WA chat already opened */});
}
```

## 2. Google Apps Script → Spreadsheet (`google_script_sheet`)

Free CRM-lite: every submit appends a row to a Google Sheet.

### Setup

Two options are available:

#### Option A: Manual setup (one-time)

1. Create a Google Sheet with header row matching your payload keys (`timestamp`, `name`, `phone`, `source`, `message`).
2. Extensions → Apps Script, paste the script below, replace `SHEET_NAME`.
3. Deploy → New deployment → Web app → Execute as: *Me* → Access: *Anyone*. Copy the `/exec` URL into `form_mappings.submit_url`.

```javascript
// Apps Script (Code.gs)
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([data.timestamp, data.name, data.phone, data.source, data.message]);
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

- Always POST with `mode: 'no-cors'` — Apps Script responses lack CORS headers, so `fetch` resolves opaque; treat it as fire-and-forget and never block the UX on it.
- Payload keys must match the sheet header row exactly.
- Optional hardening: append a shared secret token and check `e.parameter.token` in `doPost`.

#### Option B: Programmatic setup (auto-create via script)

Skip the manual steps entirely. The Automation Architect can auto-provision the
entire sheet + web-app stack with a single utility script that calls the
Google Sheets API and Apps Script API directly.

**Prerequisites:** a Google OAuth2 access token with the scopes
`script.projects`, `script.deployments`, `script.scriptapp`, `spreadsheets`,
and `drive`. Two authentication methods are supported:

- **OAuth2 token** — store as `GOOGLE_OAUTH_TOKEN` in `.env`. Obtain it with:
  ```bash
  gcloud auth application-default login
  gcloud auth application-default print-access-token
  ```
- **Service account JSON** (recommended for automated/agentic use) — store as
  `GOOGLE_SERVICE_ACCOUNT_JSON` (inline JSON or path to key file). The script
  auto-mints a JWT and exchanges it for a token — no pre-obtained token needed.

**Run the script** (Node.js, Bun/TypeScript, or Python — all ship in `scripts/`):

```bash
# Node.js (OAuth token)
GOOGLE_OAUTH_TOKEN=$(grep GOOGLE_OAUTH_TOKEN .env | cut -d= -f2-) \
  node scripts/create-lead-sheet.js --name "Acme Leads" --sheet "Leads"

# Node.js via Bun/TypeScript (service account)
GOOGLE_SERVICE_ACCOUNT_JSON=$(grep GOOGLE_SERVICE_ACCOUNT_JSON .env | cut -d= -f2-) \
  bun scripts/create-lead-sheet.ts --name "Acme Leads" --sheet "Leads"

# Python
GOOGLE_OAUTH_TOKEN=$(grep GOOGLE_OAUTH_TOKEN .env | cut -d= -f2-) \
  python3 scripts/create-lead-sheet.py --name "Acme Leads" --sheet "Leads"
```

The script will:

1. **Create a Google Spreadsheet** — titled `Acme Leads` with a `Leads` tab and
   the header row (`timestamp`, `name`, `phone`, `source`, `message`) pre-filled.
2. **Create an Apps Script project** — with a `Code.gs` file containing the
   `doPost(e)` handler that appends each POSTed form payload as a new row.
3. **Deploy as a web app** — configured for `executeAs: USER` / `access: EVERYONE`
   so the landing-page form can POST directly without auth.
4. **Print the web-app URL** — copy this into `form_mappings.submit_url` in your
   `automation_state.json`.

```
✅ Spreadsheet created: https://docs.google.com/spreadsheets/d/1BxiMVs0X.../edit
✅ Apps Script project created: 1BxiMVs0X...
   📜 Script code uploaded (Code.gs + manifest)
   🏷️  Version created: 1
   🚀 Deployed as web app: https://script.google.com/macros/s/XXXX/exec
========================================
🎉 Lead capture sheet deployed successfully!
========================================
Web App URL:     https://script.google.com/macros/s/XXXX/exec
Use this URL as form_mappings.submit_url in automation_state.json.
```

The deployed Apps Script reads the spreadsheet ID at deploy time and writes to it
via `SpreadsheetApp.openById()`, so the connection is baked into the script — no
manual copy-paste of IDs needed.

> **Note for AI Agents:** The script supports `GOOGLE_OAUTH_TOKEN` (direct
> token) or `GOOGLE_SERVICE_ACCOUNT_JSON` (auto-mints JWT). If both are missing,
> it falls back to `gcloud auth application-default print-access-token`.
> If all methods fail, the script exits with an `Agent Action Required` directive
> — ask the user to authenticate and provide credentials, then rerun.

## 3. CRM Webhook (`crm_webhook`)

HubSpot/Salesforce/proprietary REST. See `crm_integrations.md` for the full guide. Key rules:

- POST server-side (Astro Action / API route) — never expose API keys client-side.
- Fire the client dataLayer event first, then redirect to thank-you page.

## 4. Middleware (`middleware`)

Zapier/Make catch-hook between form and destinations. Use for no-code teams, branching logic, or multi-destination fan-out (sheet + CRM + Slack notification).

## Google Forms alternative (embed)

When no developer touching the page is possible: embed a Google Form (`<iframe src="https://docs.google.com/forms/.../viewform?embedded=true">`) and use Apps Script `onFormSubmit` trigger to notify the sales team via WhatsApp notification or email.

- Trade-offs: no design control, no UTM capture (unless added as form fields), iframe hurts Core Web Vitals — prefer native form + Apps Script when possible.

## Method Comparison

| Method | Cost | Backend | Response speed | Best for |
|---|---|---|---|---|
| `whatsapp_redirect` | Free | None | Instant (chat opens) | Chat-first markets (ID), SMBs |
| `google_script_sheet` (manual) | Free | Apps Script | Sheet instantly; reply manual | Lead logging without CRM |
| `google_script_sheet` (auto) | Free | Apps Script (auto-provisioned) | Sheet instantly; reply manual | Zero-touch setup, agentic deployment |
| WA redirect + sheet (KotaNabi) | Free | Apps Script | Instant chat + logged | Best of both — recommended ID default |
| `crm_webhook` | CRM cost | Server route | Instant + assignment rules | Teams with real CRM |
| `middleware` | Zapier/Make cost | Third-party | Minutes | No-code teams, multi-fan-out |
| Google Forms embed | Free | Google | Manual | Zero-dev constraint only |

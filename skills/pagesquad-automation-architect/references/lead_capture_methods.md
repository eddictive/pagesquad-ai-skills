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

### Setup (one-time, manual — document these steps for the user)

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
| `google_script_sheet` | Free | Apps Script | Sheet instantly; reply manual | Lead logging without CRM |
| WA redirect + sheet (KotaNabi) | Free | Apps Script | Instant chat + logged | Best of both — recommended ID default |
| `crm_webhook` | CRM cost | Server route | Instant + assignment rules | Teams with real CRM |
| `middleware` | Zapier/Make cost | Third-party | Minutes | No-code teams, multi-fan-out |
| Google Forms embed | Free | Google | Manual | Zero-dev constraint only |

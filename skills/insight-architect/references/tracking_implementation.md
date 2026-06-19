# Technical Tracking Implementation Guide

Detailed procedures for implementing tracking across various platforms.

## 1. Google Tag Manager (GTM)
The "Brain" of the tracking setup.
- **Container Setup**: Ensure the GTM snippet is placed in the `<head>` and `<body>` as high as possible.
- **Naming Convention**: `[Platform] - [Event Name] - [Detail]` (e.g., `GA4 - Event - Lead Form Submission`).
- **Workspace Management**: Always use "Preview" mode before publishing.

## 2. Google Analytics 4 (GA4)
- **Enhanced Measurement**: Enable for automatic tracking of scrolls, clicks, and searches.
- **Key Events (Conversions)**: Mark the most important events (e.g., `generate_lead`) as Key Events.
- **Data Retention**: Set to 14 months (default is often 2 months).
- **Custom Dimensions**: Register event parameters in the GA4 UI to see them in reports.

## 3. Meta Pixel (Facebook Pixel)
- **Standard Events**: Use standard names (`Lead`, `Purchase`, `Contact`, `ViewContent`) to help Meta's AI optimize.
- **Advanced Matching**: Enable to improve attribution accuracy.
- **Conversion API (CAPI)**: Implement server-side tracking to bypass ad blockers and browser limitations.

## 4. TikTok Pixel
- **Standard Events**: Align with TikTok's event names (`SubmitForm`, `Contact`, `Button Click`).
- **Advanced Matching**: Pass hashed email or phone numbers to improve attribution and audience targeting.
- **Event API (S2S)**: Like Meta CAPI, use TikTok's Events API for server-side tracking to ensure data reliability.
- **TikTok Pixel Helper**: Use the Chrome extension to verify that the Pixel is firing and events are correctly identified.

## 5. Data Layer Specifications
Provide these to the `experience-architect` for implementation:
```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  'event': 'lead_form_submitted',
  'form_name': 'Main Contact Form',
  'product_type': 'Premium'
});
```

## Validation Checklist
- [ ] GTM is loading correctly.
- [ ] GA4 Config tag fires on all pages.
- [ ] Pixel Helper shows "Green" for all standard events.
- [ ] No duplicate events are firing.
- [ ] Cross-domain tracking is configured (if applicable).

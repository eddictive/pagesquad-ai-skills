# CRM Integration Guide

Connecting landing pages to the primary sales systems of record.

## 1. HubSpot Integration
- **Forms API**: Preferred method for passing lead data while maintaining attribution.
- **Tracking Code**: Ensure the HubSpot tracking code is present for "Source" tracking.
- **Custom Properties**: Match landing page fields to HubSpot properties (e.g., `interest_package_type`).
- **Lists**: Automatically add new leads to a "Specific Campaign" list.

## 2. Salesforce Integration
- **Web-to-Lead**: The simplest method for basic lead capture.
- **REST API**: Use for complex, multi-object creation (Account + Contact + Opportunity).
- **Lead Assignment Rules**: Configure in SFDC to route leads based on geography or product interest.

## 3. Webhook & Middleware (Zapier/Make)
- **The "Safety Net"**: Use a middleware to catch form data, log it in a Spreadsheet (Google Sheets), and then push it to the CRM.
- **Data Formatting**: Use middleware to normalize phone numbers (e.g., converting `08...` to `628...`) before CRM entry.
- **Branching Logic**: Send different follow-ups based on the form source or lead data.

## 4. Custom API Integration (Bun/Node.js)
For high-volume or proprietary systems.
- **Security**: Use environment variables for API keys. Implement CSRF protection.
- **Performance**: Use asynchronous requests to avoid blocking the user's "Thank You" page load.
- **Logging**: Maintain a local or cloud log of all outgoing API payloads for troubleshooting.

## Field Mapping Checklist
- [ ] First Name -> `firstname`
- [ ] Email -> `email`
- [ ] Phone -> `phone` (with country code validation)
- [ ] Product/Service -> `product_interest`
- [ ] Source URL -> `lead_source_url`
- [ ] UTM Parameters -> `utm_source`, `utm_medium`, `utm_campaign`

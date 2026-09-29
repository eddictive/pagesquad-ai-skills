#!/usr/bin/env bun

/**
 * Google Lead Capture Sheet Creator (TypeScript / Bun)
 *
 * Automates the "google_script_sheet" capture method by:
 *   1. Creating a Google Sheet with a "Leads" tab and header row.
 *   2. Creating a Google Apps Script project that appends POSTed form data.
 *   3. Deploying the script as a web app (accessible to "anyone").
 *   4. Printing the resulting web-app URL for use as form_mappings.submit_url.
 *
 * Authentication (supports two modes — at least one is required):
 *
 *   Mode A — OAuth2 access token (GOOGLE_OAUTH_TOKEN env var)
 *     Obtain via:
 *       gcloud auth application-default login
 *       gcloud auth application-default print-access-token
 *
 *   Mode B — Service Account JSON (GOOGLE_SERVICE_ACCOUNT_JSON env var)
 *     The script mints a JWT and exchanges it for an access token automatically.
 *     Can be a JSON string or a path to a .json key file.
 *
 *   Required scopes:
 *     - https://www.googleapis.com/auth/script.projects
 *     - https://www.googleapis.com/auth/script.deployments
 *     - https://www.googleapis.com/auth/script.scriptapp
 *     - https://www.googleapis.com/auth/spreadsheets
 *     - https://www.googleapis.com/auth/drive
 *
 * Usage:
 *   GOOGLE_OAUTH_TOKEN=ya29.xxxx bun create-lead-sheet.ts --name "My Leads" --sheet "Leads"
 *   GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/key.json bun create-lead-sheet.ts --name "My Leads"
 *
 * Note for AI Agents: If credentials are missing, the script fails gracefully
 *   with an "Agent Action Required" directive. Ask the user to set up a service
 *   account or provide an OAuth2 token, then rerun.
 */

import { createSign } from 'crypto';
import { readFileSync } from 'fs';
import { request } from 'https';
import { URL } from 'url';
import { URLSearchParams } from 'url';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.deployments',
  'https://www.googleapis.com/auth/script.scriptapp',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
].join(' ');

interface ParsedOpts {
  name: string;
  sheet: string;
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): ParsedOpts {
  const opts: ParsedOpts = { name: 'PageSquad Lead Capture', sheet: 'Leads' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--name' && argv[i + 1]) opts.name = argv[++i]!;
    else if (argv[i] === '--sheet' && argv[i + 1]) opts.sheet = argv[++i]!;
    else if (argv[i] === '-h' || argv[i] === '--help') {
      console.log('Usage: bun create-lead-sheet.ts [--name "Sheet Name"] [--sheet "Tab Name"]');
      console.log('Required env: GOOGLE_OAUTH_TOKEN or GOOGLE_SERVICE_ACCOUNT_JSON');
      process.exit(0);
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  private_key_id?: string;
}

function getServiceAccountToken(saJson: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let sa: ServiceAccountKey;
    try {
      sa = typeof saJson === 'string' ? JSON.parse(saJson) : sa;
    } catch {
      reject(new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON'));
      return;
    }

    if (!sa.client_email || !sa.private_key) {
      reject(new Error('Service account JSON is missing client_email or private_key'));
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT', kid: sa.private_key_id };
    const claim = {
      iss: sa.client_email,
      scope: GOOGLE_SCOPES,
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedClaim = Buffer.from(JSON.stringify(claim)).toString('base64url');
    const signingInput = `${encodedHeader}.${encodedClaim}`;

    const signer = createSign('RSA-SHA256');
    signer.update(signingInput);
    const signature = signer.sign(sa.private_key);
    const jwt = `${signingInput}.${signature.toString('base64url')}`;

    const payload = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString();

    const req = request(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.access_token) {
              console.log('\u2705 OAuth2 token minted from service account');
              resolve(parsed.access_token);
            } else {
              reject(new Error(`Token exchange failed: ${JSON.stringify(parsed)}`));
            }
          } catch {
            reject(new Error(`Parse error — raw: ${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function getAccessToken(): Promise<string> {
  // Mode A: direct OAuth2 token
  if (process.env.GOOGLE_OAUTH_TOKEN) {
    return process.env.GOOGLE_OAUTH_TOKEN;
  }

  // Mode B: service account JSON
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (saJson) {
    let saData = saJson;
    if (!saJson.trim().startsWith('{') && /\.json$/i.test(saJson.trim())) {
      try {
        saData = readFileSync(saJson.trim(), 'utf8');
      } catch (e) {
        throw new Error(`Cannot read service account JSON file at ${saJson}: ${e}`);
      }
    }
    console.log('\U0001f511 Minting OAuth2 token from service account...');
    return await getServiceAccountToken(saData);
  }

  throw new Error(
    'No Google credentials found. Set GOOGLE_OAUTH_TOKEN or GOOGLE_SERVICE_ACCOUNT_JSON in .env. ' +
      'See AGENTIC_SETUP.md for instructions on creating a service account.'
  );
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

function apiRequest(token: string, method: string, urlPath: string, body?: unknown): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL('https://' + urlPath);
    const payload = body ? JSON.stringify(body) : null;
    const req = request(
      url,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
              reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error(`Parse error: ${(e as Error).message} — raw: ${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Step 1 — Create the Google Spreadsheet
// ---------------------------------------------------------------------------

async function createSpreadsheet(token: string, title: string, sheetName: string): Promise<string> {
  const headers = ['timestamp', 'name', 'phone', 'source', 'message'];
  const body = {
    properties: { title },
    sheets: [
      {
        properties: {
          title: sheetName,
          gridProperties: { rowCount: 1000, columnCount: headers.length },
        },
      },
    ],
  };

  const res: any = await apiRequest(token, 'POST', 'sheets.googleapis.com/v4/spreadsheets', body);
  const spreadsheetId = res.spreadsheetId as string;
  console.log(`\u2705 Spreadsheet created: ${res.spreadsheetUrl}`);

  // Populate the header row
  const valuesBody = {
    valueInputOption: 'RAW',
    values: [headers],
  };
  await apiRequest(
    token,
    'PUT',
    `sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:E1`,
    valuesBody
  );
  console.log(`   \U0001f4dd Header row set: ${headers.join(', ')}`);

  return spreadsheetId;
}

// ---------------------------------------------------------------------------
// Step 2 — Create & deploy the Apps Script web app
// ---------------------------------------------------------------------------

function buildAppsScriptCode(spreadsheetId: string): string {
  return `// Auto-generated by PageSquad AI Automation Architect
const SPREADSHEET_ID = '${spreadsheetId}';

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Leads');
    const data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.phone || '',
      data.source || 'Landing Page',
      data.message || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', service: 'pagesquad-lead-form' }))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}

const APPSSCRIPT_MANIFEST = JSON.stringify({
  timeZone: 'Asia/Jakarta',
  exceptionLogging: 'STACKDRIVER',
  runtimeVersion: 'V8',
  webApp: {
    access: 'EVERYONE',
    executeAs: 'USER',
  },
}, null, 2);

async function createAndDeployScript(token: string, spreadsheetId: string, title: string): Promise<string> {
  // 2a. Create the Apps Script project
  const project: any = await apiRequest(token, 'POST', 'script.googleapis.com/v1/projects', {
    title: `${title} - Web App`,
  });
  const scriptId = project.scriptId as string;
  console.log(`\u2705 Apps Script project created: ${scriptId}`);

  // 2b. Upload script content (Code.gs + manifest)
  const contentBody = {
    files: [
      {
        name: 'Code.gs',
        type: 'SERVER_JS',
        source: buildAppsScriptCode(spreadsheetId),
      },
      {
        name: 'appsscript',
        type: 'APPSSCRIPT',
        source: APPSSCRIPT_MANIFEST,
      },
    ],
  };
  await apiRequest(
    token,
    'PUT',
    `script.googleapis.com/v1/projects/${scriptId}/content`,
    contentBody
  );
  console.log(`   \U0001f4dc Script code uploaded (Code.gs + manifest)`);

  // 2c. Create a version
  const version: any = await apiRequest(
    token,
    'POST',
    `script.googleapis.com/v1/projects/${scriptId}/versions`,
    { description: 'v1 - initial web app deployment' }
  );
  const versionId = version.versionId as string;
  console.log(`   \U0001f3f7\ufe0f  Version created: ${versionId}`);

  // 2d. Deploy as web app
  const deployment: any = await apiRequest(
    token,
    'POST',
    `script.googleapis.com/v1/projects/${scriptId}/deployments`,
    {
      deployment: {
        title: 'Lead Form Web App',
        versionId: String(versionId),
        manifest: {},
      },
    }
  );
  const deploymentId = deployment.deploymentId as string;
  const webAppUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;
  console.log(`   \U0001f680 Deployed as web app: ${webAppUrl}`);

  return webAppUrl;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));

  console.log(`\U0001f3d7\uFE0F  PageSquad AI — Google Lead Capture Sheet Creator`);
  console.log(`   Sheet name: ${opts.name}`);
  console.log(`   Tab name:   ${opts.sheet}\n`);

  let token: string;
  try {
    token = await getAccessToken();
  } catch (err) {
    console.error(`\n❌ ${(err as Error).message}`);
    process.exit(1);
  }

  try {
    // Step 1 — Create spreadsheet
    console.log('--- Step 1: Creating Google Spreadsheet ---');
    const spreadsheetId = await createSpreadsheet(token, opts.name, opts.sheet);

    // Step 2 — Create & deploy Apps Script web app
    console.log('\n--- Step 2: Creating & deploying Apps Script web app ---');
    const webAppUrl = await createAndDeployScript(token, spreadsheetId, opts.name);

    // Output summary
    console.log('\n========================================');
    console.log('\U0001f389 Lead capture sheet deployed successfully!');
    console.log('========================================');
    console.log(`Spreadsheet ID:  ${spreadsheetId}`);
    console.log(`Web App URL:     ${webAppUrl}`);
    console.log(`Submit URL:      ${webAppUrl}`);
    console.log(`Sheet URL:       https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    console.log('\nUse this URL as form_mappings.submit_url in automation_state.json.');
    console.log('Note: The web app is deployed as "Anyone" — restrict if needed via');
    console.log('the Apps Script dashboard after testing.');
  } catch (err) {
    console.error('\n❌ Failed:', (err as Error).message);
    console.error(
      '\nAgent Action Required: Verify that your credentials have the required scopes' +
        ' (script.projects, script.deployments, script.scriptapp, spreadsheets, drive)' +
        ' and that the Google Cloud project has both the Apps Script API and Sheets API enabled.'
    );
    process.exit(1);
  }
}

main();

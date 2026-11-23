#!/usr/bin/env python3

"""
Google Lead Capture Sheet Creator (Python)
Helps the Automation Architect auto-provision a Google Sheet + Apps Script web app.

Automates the "google_script_sheet" capture method by:
  1. Creating a Google Sheet with a "Leads" tab and header row.
  2. Creating a Google Apps Script project that appends POSTed form data.
  3. Deploying the script as a web app (accessible to "anyone").
  4. Printing the resulting web-app URL for use as form_mappings.submit_url.

Authentication (supports multiple modes — at least one is required):

  Mode A — OAuth2 access token (GOOGLE_OAUTH_TOKEN env var)
    Obtain via:
      gcloud auth application-default login
      gcloud auth application-default print-access-token

  Mode B — Service Account JSON (GOOGLE_SERVICE_ACCOUNT_JSON env var)
    The script mints a JWT and exchanges it for an access token.
    Can be a JSON string or a path to a .json key file.
    Requires the `cryptography` library (pip install cryptography).
    Create a service account at:
      https://console.cloud.google.com/iam-admin/serviceaccounts

  Mode C — Auto-detect via gcloud (fallback)
    If neither env var is set, the script tries:
      gcloud auth application-default print-access-token

  Required scopes:
    - https://www.googleapis.com/auth/script.projects
    - https://www.googleapis.com/auth/script.deployments
    - https://www.googleapis.com/auth/script.scriptapp
    - https://www.googleapis.com/auth/spreadsheets
    - https://www.googleapis.com/auth/drive

Usage:
  GOOGLE_OAUTH_TOKEN=ya29.xxxx python create-lead-sheet.py --name "My Leads" --sheet "Leads"
  GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/key.json python create-lead-sheet.py --name "My Leads"

Note for AI Agents: If credentials are missing, the script fails gracefully
  with an "Agent Action Required" directive. Ask the user to set up a service
  account or provide an OAuth2 token, then rerun.
"""

import sys
import os
import json
import time
import base64
import argparse
import subprocess
import urllib.request
import urllib.parse
import urllib.error

GOOGLE_SCOPES = " ".join([
    "https://www.googleapis.com/auth/script.projects",
    "https://www.googleapis.com/auth/script.deployments",
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
])


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------

def api_request(token, method, url_path, body=None):
    """Make an authenticated request to a Google REST API endpoint."""
    url = f"https://{url_path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, method=method, headers=headers, data=data)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err_body = ""
        try:
            err_body = e.read().decode("utf-8")
        except Exception:
            pass
        raise RuntimeError(f"HTTP {e.code}: {err_body}") from e


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def get_service_account_token(sa_json):
    """Mint an OAuth2 access token from a Google Service Account JSON key.

    Uses the ``cryptography`` library if available; otherwise raises a
    helpful error so the caller can fall back to gcloud.
    """
    try:
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import padding
    except ImportError:
        raise RuntimeError(
            "The `cryptography` library is required for service-account JWT signing. "
            "Install it with: pip install cryptography  "
            "Or obtain a token via `gcloud auth application-default login` first."
        )

    sa = json.loads(sa_json) if isinstance(sa_json, str) else sa_json
    if "client_email" not in sa or "private_key" not in sa:
        raise RuntimeError("Service account JSON is missing client_email or private_key")

    now = int(time.time())
    header = {"alg": "RS256", "typ": "JWT", "kid": sa.get("private_key_id", "")}
    claim = {
        "iss": sa["client_email"],
        "scope": GOOGLE_SCOPES,
        "aud": "https://oauth2.googleapis.com/token",
        "exp": now + 3600,
        "iat": now,
    }

    signing_input = f"{_b64url_encode(json.dumps(header).encode())}.{_b64url_encode(json.dumps(claim).encode())}"

    private_key = serialization.load_pem_private_key(
        sa["private_key"].encode(), password=None
    )
    signature = private_key.sign(
        signing_input.encode(),
        padding.PKCS1v15(),
        hashes.SHA256(),
    )
    jwt = f"{signing_input}.{_b64url_encode(signature)}"

    payload = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": jwt,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
    if "access_token" not in result:
        raise RuntimeError(f"Token exchange failed: {json.dumps(result)}")
    print("\u2705 OAuth2 token minted from service account")
    return result["access_token"]


def get_token_from_gcloud():
    """Obtain an access token via gcloud (fallback when env vars are absent)."""
    try:
        result = subprocess.run(
            ["gcloud", "auth", "application-default", "print-access-token"],
            capture_output=True, text=True, timeout=15,
        )
        if result.returncode != 0:
            raise RuntimeError(f"gcloud failed: {result.stderr.strip()}")
        token = result.stdout.strip()
        if not token:
            raise RuntimeError("gcloud returned an empty token")
        return token
    except FileNotFoundError:
        raise RuntimeError("gcloud is not installed")
    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(f"gcloud token retrieval failed: {e}")


def get_access_token():
    """Resolve the Google OAuth2 access token.

    Tries (in order):
      1. GOOGLE_OAUTH_TOKEN env var
      2. GOOGLE_SERVICE_ACCOUNT_JSON env var (with cryptography library)
      3. gcloud auth application-default print-access-token
    """
    # Mode A: direct OAuth2 token
    token = os.environ.get("GOOGLE_OAUTH_TOKEN")
    if token:
        return token

    # Mode B: service account JSON
    sa_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        print("\U0001f511 Minting OAuth2 token from service account...")
        sa_data = sa_json
        # If it doesn't look like JSON, treat it as a file path
        stripped = sa_json.strip()
        if not stripped.startswith("{") and stripped.lower().endswith(".json"):
            try:
                with open(stripped, "r") as f:
                    sa_data = f.read()
            except OSError as e:
                raise RuntimeError(f"Cannot read service account JSON file: {e}")
        return get_service_account_token(sa_data)

    # Mode C: gcloud fallback
    print("Attempting to obtain token via gcloud...")
    try:
        return get_token_from_gcloud()
    except RuntimeError:
        raise RuntimeError(
            "No Google credentials found. Set GOOGLE_OAUTH_TOKEN or "
            "GOOGLE_SERVICE_ACCOUNT_JSON in .env, or run "
            "`gcloud auth application-default login`. See AGENTIC_SETUP.md "
            "for instructions."
        )


# ---------------------------------------------------------------------------
# Apps Script code template
# ---------------------------------------------------------------------------

APPSSCRIPT_CODE = """// Auto-generated by PageSquad AI Automation Architect
const SPREADSHEET_ID = '{spreadsheet_id}';

function doPost(e) {{
  try {{
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('{sheet_name}');
    const data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.phone || '',
      data.source || 'Landing Page',
      data.message || ''
    ]);
    // Notify the sales team via email (optional)
    // MailApp.sendEmail('sales@yourdomain.com', 'New Lead', ...);
    return ContentService
      .createTextOutput(JSON.stringify({{ status: 'ok' }}))
      .setMimeType(ContentService.MimeType.JSON);
  }} catch (err) {{
    return ContentService
      .createTextOutput(JSON.stringify({{ status: 'error' }}))
      .setMimeType(ContentService.MimeType.JSON);
  }}
}}

function doGet() {{
  return ContentService
    .createTextOutput(JSON.stringify({{ status: 'ok', service: 'pagesquad-lead-form' }}))
    .setMimeType(ContentService.MimeType.JSON);
}}
"""

APPSSCRIPT_MANIFEST = json.dumps({
    "timeZone": "Asia/Jakarta",
    "exceptionLogging": "STACKDRIVER",
    "runtimeVersion": "V8",
    "webApp": {
        "access": "EVERYONE",
        "executeAs": "USER"
    }
}, indent=2)


# ---------------------------------------------------------------------------
# Step 1 — Create the Google Spreadsheet
# ---------------------------------------------------------------------------

def create_spreadsheet(token, title, sheet_name):
    headers = ["timestamp", "name", "phone", "source", "message"]
    body = {
        "properties": {"title": title},
        "sheets": [
            {
                "properties": {
                    "title": sheet_name,
                    "gridProperties": {"rowCount": 1000, "columnCount": len(headers)},
                }
            }
        ],
    }

    res = api_request(token, "POST", "sheets.googleapis.com/v4/spreadsheets", body)
    spreadsheet_id = res["spreadsheetId"]
    print(f"\u2705 Spreadsheet created: {res['spreadsheetUrl']}")

    # Populate the header row
    values_body = {
        "valueInputOption": "RAW",
        "values": [headers],
    }
    api_request(
        token,
        "PUT",
        f"sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{sheet_name}!A1:E1",
        values_body,
    )
    print(f"   \U0001f4dd Header row set: {', '.join(headers)}")

    return spreadsheet_id


# ---------------------------------------------------------------------------
# Step 2 — Create & deploy the Apps Script web app
# ---------------------------------------------------------------------------

def create_and_deploy_script(token, spreadsheet_id, title, sheet_name):
    code = APPSSCRIPT_CODE.format(spreadsheet_id=spreadsheet_id, sheet_name=sheet_name)

    # 2a. Create the Apps Script project
    project = api_request(
        token,
        "POST",
        "script.googleapis.com/v1/projects",
        {"title": f"{title} - Web App"},
    )
    script_id = project["scriptId"]
    print(f"\u2705 Apps Script project created: {script_id}")

    # 2b. Upload script content (Code.gs + manifest)
    content_body = {
        "files": [
            {"name": "Code.gs", "type": "SERVER_JS", "source": code},
            {"name": "appsscript", "type": "APPSSCRIPT", "source": APPSSCRIPT_MANIFEST},
        ],
    }
    api_request(
        token,
        "PUT",
        f"script.googleapis.com/v1/projects/{script_id}/content",
        content_body,
    )
    print(f"   \U0001f4dc Script code uploaded (Code.gs + manifest)")

    # 2c. Create a version
    version = api_request(
        token,
        "POST",
        f"script.googleapis.com/v1/projects/{script_id}/versions",
        {"description": "v1 - initial web app deployment"},
    )
    version_id = version["versionId"]
    print(f"   \U0001f3f7\ufe0f  Version created: {version_id}")

    # 2d. Deploy as web app
    deployment = api_request(
        token,
        "POST",
        f"script.googleapis.com/v1/projects/{script_id}/deployments",
        {
            "deployment": {
                "title": "Lead Form Web App",
                "versionId": str(version_id),
                "manifest": {},
            }
        },
    )
    deployment_id = deployment["deploymentId"]
    web_app_url = f"https://script.google.com/macros/s/{deployment_id}/exec"
    print(f"   \U0001f680 Deployed as web app: {web_app_url}")

    return web_app_url


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Create a Google Sheet + Apps Script web app for lead capture."
    )
    parser.add_argument("--name", default="PageSquad Lead Capture", help="Spreadsheet title")
    parser.add_argument("--sheet", default="Leads", help="Tab/sheet name inside the spreadsheet")
    args = parser.parse_args()

    print("\U0001f3d7\uFE0F  PageSquad AI \u2014 Google Lead Capture Sheet Creator")
    print(f"   Sheet name: {args.name}")
    print(f"   Tab name:   {args.sheet}")

    # Resolve token (oauth token, service account, or gcloud fallback)
    try:
        token = get_access_token()
    except RuntimeError as e:
        print(f"\n\u274c {e}", file=sys.stderr)
        sys.exit(1)

    try:
        # Step 1 — Create spreadsheet
        print("\n--- Step 1: Creating Google Spreadsheet ---")
        spreadsheet_id = create_spreadsheet(token, args.name, args.sheet)

        # Step 2 — Create & deploy Apps Script web app
        print("\n--- Step 2: Creating & deploying Apps Script web app ---")
        web_app_url = create_and_deploy_script(token, spreadsheet_id, args.name, args.sheet)

        # Output summary
        print("\n========================================")
        print("\U0001f389 Lead capture sheet deployed successfully!")
        print("========================================")
        print(f"Spreadsheet ID:  {spreadsheet_id}")
        print(f"Web App URL:     {web_app_url}")
        print(f"Submit URL:      {web_app_url}")
        print(f"Sheet URL:       https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit")
        print("\nUse this URL as form_mappings.submit_url in automation_state.json.")
        print("Note: The web app is deployed as 'Anyone' — restrict if needed via")
        print("the Apps Script dashboard after testing.")

    except Exception as err:
        print(f"\n\u274c Failed: {err}", file=sys.stderr)
        print(
            "\nAgent Action Required: Verify that your credentials have the required scopes"
            " (script.projects, script.deployments, script.scriptapp, spreadsheets, drive)"
            " and that the Google Cloud project has both the Apps Script API"
            " and Sheets API enabled.",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()

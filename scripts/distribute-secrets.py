#!/usr/bin/env python3
"""Distribute MathQuest OAuth secrets from macOS Keychain to a Render service.

WHY urllib (not requests/httpx): per feedback_render_env_vars_python.md (2026-04-07),
shell pipes dropped keys twice in production. Pure-Python urllib keeps bytes in-process.

WHY GET-merge-PUT: Render `PUT /v1/services/{id}/env-vars` is FULL REPLACEMENT.
Omitting existing vars wipes them. Always merge first.
"""
from __future__ import annotations

import argparse
import gc
import hashlib
import json
import logging
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

# Keychain secret manifest: (account, service, env_var_name)
SECRETS: list[tuple[str, str, str]] = [
    ("mathquest-worlds", "google-client-id", "GOOGLE_CLIENT_ID"),
    ("mathquest-worlds", "google-client-secret", "GOOGLE_CLIENT_SECRET"),
    ("mathquest-worlds", "auth-secret", "AUTH_SECRET"),
    ("mathquest-worlds", "allowed-email", "ALLOWED_EMAIL"),
]
RENDER_API_ACCOUNT = "cws-sdk"
RENDER_API_SERVICE = "render-api-key"
LOG_DIR = Path.home() / ".claude" / "deployment-history" / "mathquest-worlds"
HEALTH_TIMEOUT_SEC = 300
HEALTH_POLL_SEC = 10
MAX_RETRIES = 5


def redact(value: str) -> str:
    """Fingerprint a secret without revealing it."""
    if not value:
        return "<empty>"
    digest = hashlib.sha256(value.encode()).hexdigest()[:8]
    return f"<redacted:len={len(value)},sha256[:8]={digest}>"


class SecretScrubFilter(logging.Filter):
    """Last-line defense: scrub any raw secret values from log records.

    Secrets are registered here AFTER they're fetched. If a dev accidentally
    logs a raw value, this filter replaces it with the redacted fingerprint.
    """

    def __init__(self) -> None:
        super().__init__()
        self._values: list[tuple[str, str]] = []  # (raw, redacted)

    def register(self, value: str) -> None:
        if value and len(value) >= 8:  # avoid over-redacting short strings
            self._values.append((value, redact(value)))

    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage()
        for raw, red in self._values:
            if raw in msg:
                msg = msg.replace(raw, red)
        record.msg = msg
        record.args = ()
        return True


SCRUB = SecretScrubFilter()


def setup_logging(service_id: str) -> Path:
    LOG_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(LOG_DIR, 0o700)
    ts = datetime.now().strftime("%Y%m%d-%H%M")
    log_path = LOG_DIR / f"distribute-secrets-{service_id}-{ts}.log"
    handler = logging.FileHandler(log_path)
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    handler.addFilter(SCRUB)
    stream = logging.StreamHandler()
    stream.setFormatter(logging.Formatter("%(levelname)s %(message)s"))
    stream.addFilter(SCRUB)
    logging.basicConfig(level=logging.INFO, handlers=[handler, stream], force=True)
    os.chmod(log_path, 0o600)
    return log_path


def kc_fetch(account: str, service: str) -> str | None:
    """Fetch a secret from Keychain. Returns None if missing."""
    r = subprocess.run(
        ["security", "find-generic-password", "-a", account, "-s", service, "-w"],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        return None
    return r.stdout.rstrip("\n")


def load_all_secrets() -> tuple[dict[str, str], str]:
    """Fetch all 4 MathQuest secrets + Render API key. Exit with remediation if missing."""
    secrets_map: dict[str, str] = {}
    missing: list[tuple[str, str, str]] = []
    for acct, svc, env in SECRETS:
        val = kc_fetch(acct, svc)
        if val is None:
            missing.append((acct, svc, env))
        else:
            secrets_map[env] = val
            SCRUB.register(val)

    api_key = kc_fetch(RENDER_API_ACCOUNT, RENDER_API_SERVICE)
    if api_key is None:
        missing.append((RENDER_API_ACCOUNT, RENDER_API_SERVICE, "RENDER_API_KEY"))
    else:
        SCRUB.register(api_key)

    if missing:
        logging.error("Missing %d Keychain entries. Provision them first:", len(missing))
        for acct, svc, env in missing:
            logging.error("  security add-generic-password -a %s -s %s -w -U  # for %s",
                          acct, svc, env)
            logging.error("    (interactive prompt — paste value, press Enter)")
        sys.exit(1)

    assert api_key is not None
    return secrets_map, api_key


def render_request(
    method: str, url: str, api_key: str, body: object | None = None,
) -> tuple[int, bytes, dict[str, str]]:
    """Execute Render API call with retry/backoff for 429 and 5xx."""
    for attempt in range(MAX_RETRIES):
        req = urllib.request.Request(url, method=method)
        req.add_header("Authorization", f"Bearer {api_key}")
        req.add_header("Accept", "application/json")
        data: bytes | None = None
        if body is not None:
            data = json.dumps(body).encode()
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, data=data, timeout=30) as resp:
                return resp.status, resp.read(), dict(resp.headers)
        except urllib.error.HTTPError as e:
            retry_after = e.headers.get("Retry-After") if e.headers else None
            if e.code == 401:
                logging.error("401 Unauthorized from Render. Rotate cws-sdk/render-api-key:")
                logging.error("  security add-generic-password -a cws-sdk -s render-api-key -w -U")
                sys.exit(1)
            if e.code == 404:
                logging.error("404 from Render. Verify service id with: render services -o json")
                sys.exit(1)
            if e.code == 429 or e.code >= 500:
                if attempt == MAX_RETRIES - 1:
                    logging.error("Gave up after %d attempts (HTTP %d)", MAX_RETRIES, e.code)
                    sys.exit(1)
                delay = min(2 ** attempt, 60)
                if retry_after and retry_after.isdigit():
                    delay = max(delay, int(retry_after))
                logging.warning("HTTP %d — retry %d/%d in %ds",
                                e.code, attempt + 1, MAX_RETRIES, delay)
                time.sleep(delay)
                continue
            body_txt = ""
            try:
                body_txt = e.read().decode(errors="replace")[:500]
            except Exception:
                pass
            logging.error("HTTP %d from %s: %s", e.code, url, body_txt)
            sys.exit(1)
        except urllib.error.URLError as e:
            if attempt == MAX_RETRIES - 1:
                logging.error("Network error: %s", e)
                sys.exit(1)
            delay = min(2 ** attempt, 60)
            logging.warning("Network error (%s) — retry %d/%d in %ds",
                            e, attempt + 1, MAX_RETRIES, delay)
            time.sleep(delay)
    sys.exit(1)


def fetch_service(service_id: str, api_key: str) -> dict:
    status, body, _ = render_request(
        "GET", f"https://api.render.com/v1/services/{service_id}", api_key,
    )
    return json.loads(body)


def fetch_env_vars(service_id: str, api_key: str) -> list[dict]:
    url = f"https://api.render.com/v1/services/{service_id}/env-vars?limit=100"
    status, body, _ = render_request("GET", url, api_key)
    return json.loads(body)


def build_merged(existing: list[dict], secrets_map: dict[str, str]) -> list[dict]:
    """Merge existing env vars with new secrets. New wins on collision."""
    overwritten: set[str] = set()
    merged: list[dict] = []
    for item in existing:
        ev = item["envVar"]
        key = ev["key"]
        if key in secrets_map:
            merged.append({"key": key, "value": secrets_map[key]})
            overwritten.add(key)
        else:
            merged.append({"key": key, "value": ev.get("value", "")})
    for key, val in secrets_map.items():
        if key not in overwritten:
            merged.append({"key": key, "value": val})
    return merged


def put_env_vars(service_id: str, api_key: str, merged: list[dict]) -> None:
    url = f"https://api.render.com/v1/services/{service_id}/env-vars"
    status, body, _ = render_request("PUT", url, api_key, body=merged)
    if not (200 <= status < 300):
        logging.error("PUT returned %d. Render preserves previous env vars on failure. "
                      "No state change.", status)
        sys.exit(1)
    logging.info("PUT env-vars OK (%d)", status)


def trigger_deploy(service_id: str, api_key: str) -> str:
    url = f"https://api.render.com/v1/services/{service_id}/deploys"
    status, body, _ = render_request("POST", url, api_key, body={"clearCache": "do_not_clear"})
    payload = json.loads(body)
    deploy_id = payload.get("id", "unknown")
    logging.info("Deploy triggered: %s", deploy_id)
    return deploy_id


def poll_health(service_url: str) -> None:
    health_url = f"{service_url.rstrip('/')}/api/health"
    deadline = time.time() + HEALTH_TIMEOUT_SEC
    logging.info("Polling %s (timeout %ds)", health_url, HEALTH_TIMEOUT_SEC)
    last_err = ""
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(health_url, timeout=10) as resp:
                if resp.status == 200:
                    logging.info("Health check OK (200)")
                    return
                last_err = f"HTTP {resp.status}"
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code}"
        except urllib.error.URLError as e:
            last_err = f"URLError {e.reason}"
        except Exception as e:
            last_err = type(e).__name__
        time.sleep(HEALTH_POLL_SEC)
    logging.error("Health check did not return 200 within %ds. Last: %s",
                  HEALTH_TIMEOUT_SEC, last_err)
    logging.error("Check manually: https://dashboard.render.com/")
    sys.exit(1)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("service_id", help="Render service id (e.g. srv-xxxxxxxxxxxxx)")
    p.add_argument("--dry-run", action="store_true",
                   help="Show merge plan, do not PUT")
    p.add_argument("--yes", action="store_true",
                   help="Skip confirmation prompt")
    p.add_argument("--skip-deploy", action="store_true",
                   help="Set env vars but do not trigger a deploy")
    p.add_argument("--skip-health-check", action="store_true",
                   help="Do not poll /api/health after deploy")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    log_path = setup_logging(args.service_id)
    logging.info("Log: %s", log_path)
    logging.info("Target service: %s", args.service_id)
    logging.info("Dry run: %s", args.dry_run)

    secrets_map, api_key = load_all_secrets()
    try:
        for env, val in secrets_map.items():
            logging.info("Loaded %s = %s", env, redact(val))

        service = fetch_service(args.service_id, api_key)
        svc_name = service.get("name", "?")
        svc_url = service.get("serviceDetails", {}).get("url") or service.get("url") or ""
        logging.info("Service: %s (%s)", svc_name, svc_url or "no URL")

        existing = fetch_env_vars(args.service_id, api_key)
        logging.info("Existing env-var count: %d", len(existing))

        merged = build_merged(existing, secrets_map)
        existing_keys = {i["envVar"]["key"] for i in existing}
        new_keys = [k for k in secrets_map if k not in existing_keys]
        overwritten = [k for k in secrets_map if k in existing_keys]
        logging.info("Merge plan: %d total, %d new (%s), %d overwritten (%s)",
                     len(merged), len(new_keys), ",".join(new_keys) or "-",
                     len(overwritten), ",".join(overwritten) or "-")

        if args.dry_run:
            logging.info("DRY RUN — no PUT, no deploy")
            return 0

        if not args.yes:
            print(f"\nAbout to PUT {len(merged)} env vars to {svc_name} ({args.service_id}).")
            print(f"  New: {new_keys or 'none'}")
            print(f"  Overwritten: {overwritten or 'none'}")
            ans = input("Proceed? [y/N] ").strip().lower()
            if ans != "y":
                logging.info("Aborted by user")
                return 1

        put_env_vars(args.service_id, api_key, merged)

        if args.skip_deploy:
            logging.info("Skipping deploy per --skip-deploy")
            return 0

        trigger_deploy(args.service_id, api_key)

        if args.skip_health_check:
            logging.info("Skipping health check per --skip-health-check")
            return 0

        if not svc_url:
            logging.warning("No service URL — cannot health-check. Check dashboard.")
            return 0
        poll_health(svc_url)
        return 0
    finally:
        # Best-effort secret buffer clearing. Python strings are immutable — we can
        # drop references and force GC, but cannot zero the underlying memory.
        # The Keychain, not this process, is the source of truth.
        secrets_map.clear()
        api_key = ""  # noqa: F841
        SCRUB._values.clear()
        gc.collect()


if __name__ == "__main__":
    sys.exit(main())

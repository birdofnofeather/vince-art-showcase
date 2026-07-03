#!/usr/bin/env python3
"""Collect API spend for the DeYaanga project into public/usage.json.

Sources (read-only):
  - OpenRouter (/api/v1/credits + /api/v1/key) via OPENROUTER_KEY_TED — Ted's
    gateway brain (posts, engagement, diary).
  - Anthropic Admin API via ANTHROPIC_ADMIN_KEY — org-wide daily cost and
    per-API-key token usage. Covers both Ted's direct-Anthropic traffic and
    Vince's pipeline (VincePipelineTest Actions), which spends on Anthropic.

History is snapshot-based: each hourly run appends current totals; the page
derives daily spend from deltas. Keeps 180 days.
"""
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "usage.json")
KEEP_DAYS = 180


def http_get(url, headers):
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"_error": f"HTTP {e.code}", "_body": e.read().decode()[:300]}
    except Exception as e:  # noqa: BLE001
        return {"_error": str(e)}


def openrouter_snapshot():
    key = os.environ.get("OPENROUTER_KEY_TED", "").strip()
    if not key:
        return {}
    h = {"Authorization": f"Bearer {key}"}
    credits = http_get("https://openrouter.ai/api/v1/credits", h)
    keyinfo = http_get("https://openrouter.ai/api/v1/key", h)
    entry = {}
    d = credits.get("data") or {}
    if "_error" not in credits:
        entry["total_credits"] = d.get("total_credits")
        entry["total_usage"] = round(d.get("total_usage", 0), 4)
    kd = keyinfo.get("data") or {}
    if "_error" not in keyinfo:
        entry["key_usage"] = round(kd.get("usage", 0), 4)
        entry["key_limit"] = kd.get("limit")
    if not entry:
        entry["error"] = credits.get("_error") or keyinfo.get("_error")
    return {"ted": entry}


def anthropic_report():
    admin_key = os.environ.get("ANTHROPIC_ADMIN_KEY", "").strip()
    if not admin_key:
        return None
    h = {"x-api-key": admin_key, "anthropic-version": "2023-06-01"}
    since = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%dT00:00:00Z")

    key_names = {}
    keys_resp = http_get("https://api.anthropic.com/v1/organizations/api_keys?limit=100", h)
    for k in keys_resp.get("data", []) or []:
        key_names[k.get("id")] = k.get("name")

    cost = http_get(
        "https://api.anthropic.com/v1/organizations/cost_report"
        f"?starting_at={since}&bucket_width=1d&limit=31",
        h,
    )
    usage = http_get(
        "https://api.anthropic.com/v1/organizations/usage_report/messages"
        f"?starting_at={since}&bucket_width=1d&limit=31&group_by[]=api_key_id",
        h,
    )

    daily_cost = []
    for bucket in cost.get("data", []) or []:
        total = 0.0
        for item in bucket.get("results", []) or []:
            amt = item.get("amount")
            if isinstance(amt, dict):
                total += float(amt.get("value", 0))
            elif amt is not None:
                total += float(amt)
        daily_cost.append({"date": (bucket.get("starting_at") or "")[:10], "usd": round(total, 4)})

    daily_tokens = []
    for bucket in usage.get("data", []) or []:
        row = {"date": (bucket.get("starting_at") or "")[:10], "by_key": {}}
        for item in bucket.get("results", []) or []:
            kid = item.get("api_key_id")
            name = key_names.get(kid, kid or "unknown")
            toks = sum(
                int(item.get(f) or 0)
                for f in (
                    "uncached_input_tokens",
                    "cache_creation_input_tokens",
                    "cache_read_input_tokens",
                    "output_tokens",
                )
            )
            row["by_key"][name] = row["by_key"].get(name, 0) + toks
        daily_tokens.append(row)

    out = {"daily_cost_usd": daily_cost, "daily_tokens_by_key": daily_tokens}
    if cost.get("_error"):
        out["cost_error"] = cost["_error"]
    if usage.get("_error"):
        out["usage_error"] = usage["_error"]
    return out


def main():
    now = datetime.now(timezone.utc)
    try:
        with open(OUT_PATH) as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = {"snapshots": []}

    snap = {"at": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "openrouter": openrouter_snapshot()}
    data["snapshots"].append(snap)

    cutoff = (now - timedelta(days=KEEP_DAYS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    data["snapshots"] = [s for s in data["snapshots"] if s["at"] >= cutoff]

    anth = anthropic_report()
    if anth is not None:
        data["anthropic"] = anth
    data["updated_at"] = snap["at"]

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(data, f, indent=1)
    print(f"wrote public/usage.json: {len(data['snapshots'])} snapshots, anthropic={'yes' if anth else 'no'}")


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""PortraitPay AI - Automated Site Check"""
import urllib.request
import urllib.error
import re
import sys

BASE = "https://portraitpayai.com"
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"

def get(url, method="GET", timeout=15):
    try:
        req = urllib.request.Request(url, method=method)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            headers = dict(resp.headers)
            body = resp.read().decode("utf-8", errors="ignore")
            return {"status": resp.status, "headers": headers, "body": body, "error": None}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "headers": dict(e.headers), "body": "", "error": None}
    except Exception as e:
        return {"status": None, "headers": {}, "body": "", "error": str(e)}

def check(pattern, body, expect=True):
    found = bool(re.search(pattern, body, re.IGNORECASE))
    ok = found == expect
    return ok, found

print(f"\n{CYAN}=== SECURITY HEADERS ==={RESET}")
r = get(BASE + "/", method="HEAD")
headers = r["headers"]
security_headers = {
    "X-Frame-Options": headers.get("X-Frame-Options", ""),
    "X-Content-Type-Options": headers.get("X-Content-Type-Options", ""),
    "Strict-Transport-Security": headers.get("Strict-Transport-Security", ""),
    "Content-Security-Policy": headers.get("Content-Security-Policy", ""),
    "Referrer-Policy": headers.get("Referrer-Policy", ""),
}
for k, v in security_headers.items():
    if v:
        print(f"  {GREEN}[OK]{RESET}   {k}: {v}")
    else:
        print(f"  {YELLOW}[MISS]{RESET} {k}")

print(f"\n{CYAN}=== TERMS PAGE (LA Market Fixes) ==={RESET}")
r = get(BASE + "/terms")
body = r["body"]
checks = [
    ("1% commission",         r"1%",                                True),
    ("California law",        r"California",                         True),
    ("USD pricing",           r"USD|\$|Dollar",                      True),
    ("PayPal payment",        r"PayPal",                             True),
    ("No Alipay/WeChat",     r"支付宝|微信|Alipay|WeChat",          False),
]
for desc, pat, expect in checks:
    ok, found = check(pat, body, expect)
    status = f"{GREEN}[OK]{RESET}" if ok else f"{RED}[FAIL]{RESET}"
    print(f"  {status} {desc}")

print(f"\n{CYAN}=== PRIVACY PAGE ==={RESET}")
r = get(BASE + "/privacy")
body = r["body"]
ok, _ = check(r"contact@portraitpayai", body, True)
print(f"  {GREEN if ok else RED}[{'OK' if ok else 'FAIL'}]{RESET} contact@portraitpayai present")

print(f"\n{CYAN}=== HOME PAGE ==={RESET}")
r = get(BASE + "/")
body = r["body"]
home_checks = [
    ("FAQ section",         r"FAQ",                      True),
    ("How it Works",       r"How it Works|从肖像",       True),
    ("Blockchain mention", r"Blockchain|blockchain|区块链", True),
]
for desc, pat, expect in home_checks:
    ok, _ = check(pat, body, expect)
    print(f"  {GREEN if ok else RED}[{'OK' if ok else 'FAIL'}]{RESET} {desc}")

print(f"\n{CYAN}=== SEO FILES ==={RESET}")
for fname in ["robots.txt", "sitemap.xml"]:
    url = BASE + "/" + fname
    r = get(url)
    if r["status"] == 200:
        print(f"  {GREEN}[OK]{RESET}   {fname} exists ({r['status']})")
    else:
        print(f"  {YELLOW}[MISS]{RESET} {fname} ({r['status'] or 'error'})")

print(f"\n{CYAN}=== API HEALTH ==={RESET}")
r = get(BASE + "/api/cron/monitoring")
if r["status"] == 401:
    print(f"  {GREEN}[OK]{RESET}   API auth required (401 = correct for internal endpoint)")
elif r["status"] == 200:
    print(f"  {GREEN}[OK]{RESET}   API responds: {r['body'][:80]}")
else:
    print(f"  {YELLOW}[INFO]{RESET}  API status: {r['status']}")

print(f"\n{CYAN}=== REGISTER PAGE ==={RESET}")
r = get(BASE + "/register")
body = r["body"]
ok, _ = check(r"肖像|portrait|Portrait", body, True)
print(f"  {GREEN if ok else RED}[{'OK' if ok else 'FAIL'}]{RESET} register page loads")

print(f"\n{CYAN}=== DONE ==={RESET}")

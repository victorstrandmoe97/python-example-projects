import os
import sys
import argparse
import requests
from config import SAST_SCAN_RESULT_API_URL

parser = argparse.ArgumentParser()
parser.add_argument("--customer_id", required=True)
parser.add_argument("--runtime", required=True, choices=["nodejs", "python"])
parser.add_argument("--api_key", required=True)
args = parser.parse_args()

CUSTOMER_ID = args.customer_id
TARGET_RUNTIME = args.runtime
API_KEY = args.api_key

# Validate required config
if not CUSTOMER_ID:
    raise ValueError("Missing customer_id")
if not TARGET_RUNTIME or TARGET_RUNTIME not in ("nodejs", "python"):
    raise ValueError("Missing or invalid runtime")
if not API_KEY:
    raise ValueError("Missing api_key")

def validate_api_key(customer_id: str, api_key: str) -> bool:
    url = f"{SAST_SCAN_RESULT_API_URL}/initialise_run"
    try:
        resp = requests.post(
            url,
            headers={
                "X-Api": api_key,
                "X-Cid": customer_id,
            },
            timeout=5
        )
        if resp.status_code == 200:
            return True
        else:
            print(f"❌ Validation failed: {resp.status_code} {resp.text}")
            return False
    except requests.RequestException as e:
        print(f"❌ Request error: {e}")
        return False

if validate_api_key(CUSTOMER_ID, API_KEY):
    print("✅ API key and customer_id validation successful")
else:
    print("❌ API key validation failed")
    sys.exit(1)

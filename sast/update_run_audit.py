import os
import argparse
import requests
from datetime import datetime, timezone
from config import SAST_SCAN_RESULT_API_URL  # <-- use config


parser = argparse.ArgumentParser()
parser.add_argument("--customer_id", required=True)
parser.add_argument("--runtime", required=True, choices=["nodejs", "python"])
parser.add_argument("--api_key", required=True)
parser.add_argument("--status", required=True)

args = parser.parse_args()

CUSTOMER_ID = args.customer_id
TARGET_RUNTIME = args.runtime
STATUS = args.status
API_KEY = args.api_key
BACKEND_URL = SAST_SCAN_RESULT_API_URL  # <-- from config


def read_run_id():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(base_dir, TARGET_RUNTIME, "scan_output", "run_id.txt"), "r") as f:
        return f.read().strip()


def update_run():
    run_id = read_run_id()

    payload = {
        "run_id": run_id,
        "status": STATUS,
        "runtime": TARGET_RUNTIME,
    }

    headers = {
        "Content-Type": "application/json",
        "X-Api": API_KEY,
        "X-Cid": CUSTOMER_ID,
    }

    url = f"{BACKEND_URL}/update_run"
    response = requests.post(url, json=payload, headers=headers)

    if response.status_code != 200:
        raise RuntimeError(f"Failed to update run: {response.status_code} {response.text}")

    print(f"Updated run_id={run_id}, status={STATUS}")


if __name__ == "__main__":
    update_run()

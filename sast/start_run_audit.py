import json
import uuid
import os
import argparse
import requests
from config import  SAST_SCAN_RESULT_API_URL

parser = argparse.ArgumentParser()
parser.add_argument("--customer_id", required=True)
parser.add_argument("--runtime", required=True, choices=["nodejs", "python"])
parser.add_argument("--api_key", required=True)
args = parser.parse_args()

CUSTOMER_ID: str = args.customer_id
TARGET_RUNTIME: str = args.runtime
API_KEY: str = args.api_key

# Validate required config
if not CUSTOMER_ID:
    raise ValueError("Missing customer_id")
if TARGET_RUNTIME not in ("nodejs", "python"):
    raise ValueError("Missing or invalid runtime")
if not API_KEY:
    raise ValueError("Missing api_key")

# Generate run_id
run_id = str(uuid.uuid4())
base_dir = os.path.dirname(os.path.abspath(__file__))
run_id_path = os.path.join(base_dir, TARGET_RUNTIME, "scan_output", "run_id.txt")
os.makedirs(os.path.dirname(run_id_path), exist_ok=True)
with open(run_id_path, "w") as f:
    f.write(run_id)


# Prepare payload
payload = {
    "runtime": TARGET_RUNTIME
}

# Prepare headers
headers = {
    "X-Cid": CUSTOMER_ID,
    "X-Api": API_KEY,
    "Content-Type": "application/json"
}

# Send POST request to backend
response = requests.post(f"{SAST_SCAN_RESULT_API_URL}/start_run", json=payload, headers=headers)

if response.status_code == 200:
    data = response.json()


    # Compute customer hash
    print(f"Inserted start run for run_id={run_id}")
    print(json.dumps(data))
else:
    print(f"Error {response.status_code}: {response.text}")
    response.raise_for_status()

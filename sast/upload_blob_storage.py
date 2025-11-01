import argparse
import os
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

base_dir = os.path.dirname(os.path.abspath(__file__))
RUN_ID_FILE = os.path.join(base_dir, TARGET_RUNTIME, "scan_output", "run_id.txt")

def upload_with_signed_urls(run_id: str, hashed_customer_id: str):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(base_dir, TARGET_RUNTIME, "scan_output")

    # Step 1: Get signed upload URLs
    resp = requests.post(
        f"{SAST_SCAN_RESULT_API_URL}/share_run",
        headers={
            "X-Api": API_KEY,
            "X-Cid": CUSTOMER_ID
        },
        json={"run_id": run_id, "runtime": TARGET_RUNTIME}
    )
    if resp.status_code != 200:
        raise Exception(f"Failed to get signed upload URLs: {resp.status_code} {resp.text}")

    upload_links = resp.json().get("upload_links", [])

    # Step 2: Upload each file
    for entry in upload_links:
        filename = entry["filename"]
        url = entry["url"]
        local_path = os.path.join(output_dir, filename)
        if not os.path.isfile(local_path):
            print(f"⚠️ File missing: {local_path}")
            continue

        with open(local_path, "rb") as f:
            put_resp = requests.put(
                url,
                data=f,
                headers={"Content-Type": "application/json"}
            )
            if put_resp.status_code not in (200, 201):
                raise Exception(f"Failed to upload {filename}: {put_resp.status_code} {put_resp.text}")
            else:
                print(f"✅ Uploaded {filename}")

    # Step 3: Get signed read URLs after upload
    resp_read = requests.post(
        f"{SAST_SCAN_RESULT_API_URL}/get_run_read_urls",
        headers={
            "X-Api": API_KEY,
            "X-Cid": CUSTOMER_ID
        },
        json={"run_id": run_id, "runtime": TARGET_RUNTIME}
    )
    if resp_read.status_code != 200:
        raise Exception(f"Failed to get read URLs: {resp_read.status_code} {resp_read.text}")

    download_links = resp_read.json().get("download_links", [])

    # Step 4: Write each read URL to a file
    for entry in download_links:
        filename = entry["filename"]
        url = entry["url"]
        share_url_path = os.path.join(output_dir, f"{filename}.share_url.txt")
        with open(share_url_path, "w") as f:
            f.write(url)
        print(f"✅ Saved read URL for {filename} -> {share_url_path}")


if not os.path.isfile(RUN_ID_FILE):
    raise Exception("Run_id file not found")

with open(os.path.join(base_dir, TARGET_RUNTIME, "scan_output", "run_id.txt"), "r") as f:
    run_id = f.read().strip()

if not run_id:
    raise Exception("Run_id is empty")

upload_with_signed_urls(run_id, CUSTOMER_ID)


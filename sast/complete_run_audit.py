import os
import json
import argparse
import requests
from config import  SAST_SCAN_RESULT_API_URL


parser = argparse.ArgumentParser()
parser.add_argument("--customer_id", required=True)
parser.add_argument("--runtime", required=True, choices=["nodejs", "python"])
parser.add_argument("--api_key", required=True)
args = parser.parse_args()


CUSTOMER_ID = args.customer_id
TARGET_RUNTIME = args.runtime
API_KEY = args.api_key

base_dir = os.path.dirname(os.path.abspath(__file__))
SCAN_RESULTS_PATH = os.path.join(base_dir, TARGET_RUNTIME, "scan_output", "semgrep_minimal_transformed.json")
INCIDENT_RESULTS_PATH = os.path.join(base_dir, TARGET_RUNTIME, "scan_output", "incident_results.json")
RUN_ID_PATH = os.path.join(base_dir, TARGET_RUNTIME, "scan_output", "run_id.txt")

def load_run_id():
    with open(RUN_ID_PATH, "r") as f:
        return f.read().strip()
    
    

def load_summary_counts():
    if os.path.isfile(SCAN_RESULTS_PATH) is False:
        print(f"No incident scan results found: {SCAN_RESULTS_PATH}")
        return


    with open(SCAN_RESULTS_PATH, "r") as f:
        data = json.load(f)
    results = data.get("results", [])

    counts = {
        "total_findings": len(results),
        "total_critical_findings": 0,
        "total_high_findings": 0,
        "total_medium_findings": 0,
        "total_owasp_findings": 0,
        "total_weakness_findings": 0,
    }

    for finding in results:
        likelihood = finding.get("likelihood", "").upper()
        impact = finding.get("impact", "").upper()
        owasp_tags = finding.get("owasp", [])
        vuln_classes = finding.get("vulnerability_class", [])

        if likelihood == "CRITICAL" or impact == "CRITICAL":
            counts["total_critical_findings"] += 1
        elif likelihood == "HIGH" or impact == "HIGH":
            counts["total_high_findings"] += 1
        elif likelihood == "MEDIUM" or impact == "MEDIUM":
            counts["total_medium_findings"] += 1

        if owasp_tags:
            counts["total_owasp_findings"] += 1
        if vuln_classes and any("weakness" in vc.lower() for vc in vuln_classes):
            counts["total_weakness_findings"] += 1

    return counts

def complete_run():
    run_id = load_run_id()

    counts = load_summary_counts()
    if not counts:
        print("No summary counts found, aborting.")
        return

    payload = {
        "run_id": run_id,
        "runtime": TARGET_RUNTIME,
        "summary": counts
    }

    headers = {
        "X-Api": f"{API_KEY}",
        "X-Cid": CUSTOMER_ID,
        "Content-Type": "application/json"
    }

    url = f"{SAST_SCAN_RESULT_API_URL}/complete_run"
    response = requests.post(url, headers=headers, json=payload)

    if response.status_code == 200:
        data = response.json()
        scan_result_url = data.get("scan_results_share_url")
        if scan_result_url:
            print(f"Scan finished. See result {scan_result_url}")
        else:
            print("Scan result URL not found in the response.")
    else:
        print(f"Error {response.status_code}: {response.text}")


if __name__ == "__main__":
    complete_run()
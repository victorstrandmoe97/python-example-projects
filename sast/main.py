import os
import json
import requests
from collections import defaultdict
from config import PUBLIC_API_URL, GENERAL_REPORT_ENDPOINT
import argparse


parser = argparse.ArgumentParser()
parser.add_argument("--customer_id", required=True)
parser.add_argument("--runtime", required=True, choices=["nodejs", "python"])
parser.add_argument("--api_key", required=True)
args = parser.parse_args()


CUSTOMER_ID = args.customer_id
TARGET_RUNTIME = args.runtime
API_KEY = args.api_key


#TODO: Change to SAST_API
def request_incidents(owasp_keys, weaknesses):
    if(len(owasp_keys) == 0 and len(weaknesses) == 0):
        print(f"No cwe or cve found in result")
        return
    url = f"{PUBLIC_API_URL.rstrip('/')}{GENERAL_REPORT_ENDPOINT}"
    headers = {
        "X-API-Key": f"{API_KEY}",
        "X-CID": f"{CUSTOMER_ID}",
        "Content-Type": "application/json"
    }

    payload = {
        "owasp": list(owasp_keys),
        "weaknesses": list(weaknesses)
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print(f"✅ Sent to weaknesses endpoint")

        data = response.json()
        owaspContents = data.get("owasp", [])
        weaknessesContents = data.get("weaknesses", [])


        if not owaspContents:
            print(f"No owaspContents entries found. {json.dumps(data, indent=2)}")
            owaspContents = []
        if not weaknessesContents:
            print("No cweContents entries found.")
            weaknessesContents = []
    

        merged_contents = {
            "owasp": owaspContents,
            "weaknesses": weaknessesContents
        }
        base_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(base_dir,TARGET_RUNTIME, "scan_output", "incident_results.json")
    
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(merged_contents, f, indent=2, ensure_ascii=False)
        print(f"📝 Saved to {json_path}")
    except requests.RequestException as e:
        print(f"❌ Failed to send {owasp_keys}: {e}")
        merged_contents = {
            "owasp": [],
            "weaknesses": []
        }
        base_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(base_dir,TARGET_RUNTIME, "scan_output", "incident_results.json")
    
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(merged_contents, f, indent=2, ensure_ascii=False)



def extract_owasp_name(owasp_raw_list):
    result = []

    # Normalize to list
    if isinstance(owasp_raw_list, str):
        owasp_raw_list = [owasp_raw_list]
    elif not isinstance(owasp_raw_list, (list, tuple)):
        return []

    # Build structured dicts
    for item in owasp_raw_list:
        item_str = str(item)
        result.append({
            "code": item_str.split(" - ")[0].strip(),
            "name": item_str.split(" - ")[1].strip() if " - " in item_str else "",
            "full_identifier": item_str.strip()
        })

    return result

def extract_cwe_name(cwe_raw_list):
    parsed = []
    for item in cwe_raw_list:
        print(f"ITEM {item}")
        if ":" in item:
            code, name = item.split(":", 1)
            parsed.append({
                "code": code.strip(),
                "name": name.strip(),
                "full_identifier": item.strip()
            })
        else:
            parsed.append({
                "code": item.strip(),
                "name": "",
                "full_identifier": item.strip()
            })
    return parsed

def normalize_list_of_strings(x):
    """Ensure x is a list of strings."""
    if x is None:
        return []
    if isinstance(x, (list, tuple)):
        # convert elements to string if not already
        return [str(e) for e in x]
    return [str(x)]



def deduplicate_results(results):
    seen = set()
    deduped = []
    for entry in results:
        # Extract keys for deduplication
        file = entry.get("path") or entry.get("file") or ""
        line = entry.get("line") or -1
        line_content = entry.get("line_content", "")
        
        # For cwe array, convert to a sorted tuple of full_identifiers to normalize
        cwe_list = entry.get("cwe", [])
        cwe_ids = tuple(sorted(c["full_identifier"] if isinstance(c, dict) else str(c) for c in cwe_list))
        
        key = (file, line, cwe_ids, line_content)
        if key not in seen:
            seen.add(key)
            deduped.append(entry)
    return deduped

def read_semgrep_results():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    semgrep_minimal_path = os.path.join(base_dir,TARGET_RUNTIME, "scan_output", "semgrep_minimal.json")
    semgrep_minimal_transformed_path = os.path.join(base_dir, TARGET_RUNTIME, "scan_output", "semgrep_minimal_transformed.json")

    if not os.path.exists(semgrep_minimal_path):
        raise FileNotFoundError(f"Cannot find {semgrep_minimal_path}")

    with open(semgrep_minimal_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    results = data.get("results", [])
    if not results:
        print("No results found in semgrep output.")
        return {}

    owasp_index = defaultdict(lambda: {"files": []})
    for result in results:
        print(f"RESULT 1{result}")
        owasp_entries = result.get("owasp", [])
        filename = result.get("path", result.get("file", "unknown"))
        line_number = result.get("path", result.get("line", -1))
        vulnerability_class = result.get("vulnerability_class", result.get("vulnerability_class", []))
        cwe_raw = result.get("cwe", [])
        print(f"cwe_raw {cwe_raw}")

        cwe = extract_cwe_name(cwe_raw)

           # --- NEW: read the actual source line ---
        line_content = ""
        try:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            client_project_path = os.path.join(base_dir,TARGET_RUNTIME, "project")
            file_path = os.path.join(client_project_path, filename)
            with open(file_path, 'r', encoding='utf-8') as src_file:
                lines = src_file.readlines()
                if isinstance(line_number, int) and 0 < line_number <= len(lines):
                    line_content = lines[line_number - 1].rstrip("\n")        
        except FileNotFoundError:
            line_content = "[File not found]"
        except Exception as e:
            line_content = f"[Error reading file: {e}]"

        result["line_content"] = line_content
        result["cwe_code"] = cwe[0]["code"]
        result["cwe_name"] = cwe[0]["name"]
        result["cwe_full_identifier"] = cwe[0]["full_identifier"]
        
        if isinstance(owasp_entries, str):
            owasp_entries = [owasp_entries]
        elif not isinstance(owasp_entries, (list, tuple)):
            owasp_entries = []

        for owasp in owasp_entries:
            if "2017" not in owasp:
                details = extract_owasp_name([owasp])
                result["owasp_code"] = details[0]["code"]
                result["owasp_name"] = details[0]["name"]
                result["owasp_full_identifier"] = details[0]["full_identifier"]

                owasp_index[owasp]["files"].append({
                    "filename": filename,
                    "line_number": line_number,
                    "line_content": line_content,
                    "cwe": cwe,
                    "vulnerability_class": vulnerability_class
                })


    results = data.get("results", [])
    if results:
        data["results"] = deduplicate_results(results)
    # Overwrite the original file with enriched data
    with open(semgrep_minimal_transformed_path, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
    print(f"📝 Enriched semgrep results saved to {semgrep_minimal_transformed_path}")

    return dict(owasp_index)

if __name__ == '__main__':
    owasp_map = read_semgrep_results()
    cwes = []
    for owasp_code, data in owasp_map.items():
        print(f"{json.dumps(owasp_code, indent=2)}")
        for f in data["files"]:
            for cwe in f["cwe"]:
                cwes.append(cwe["name"])

    unique_cwes = list(set(cwes))

    request_incidents(owasp_map.keys(), unique_cwes)

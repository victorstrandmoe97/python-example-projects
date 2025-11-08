import os
import ssl
import certifi
import urllib.request
import zipfile
from pathlib import Path
import logging
import json
import hashlib
import psutil
import traceback
from urllib.parse import quote
from datetime import datetime, timezone
from io import BytesIO
from google.cloud import bigquery
from config import OSV_INDEX_URL, OSV_DOWNLOAD_DIR,ECOSYSTEM_TO_RUNTIME_MAP, STAGING_TABLE, DATASET_ID, MAIN_TABLE, ENV
from transform import transform_entry
from ingest_to_main_table import ingest_to_main_table

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
process = psutil.Process(os.getpid())


def log_memory(operation):
    mem = process.memory_info().rss / (1024 ** 2)
    logging.info(f"📊 Operation {operation} Resident memory: {mem:.2f} MB")



def initialize_osv_staging_table(client):
    run_suffix = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    stage_table_id = f"{STAGING_TABLE}_{run_suffix}"
    staging_ref = bigquery.TableReference.from_api_repr({
        "projectId": client.project,
        "datasetId": DATASET_ID,
        "tableId": stage_table_id
    })

    # Delete existing
    client.delete_table(staging_ref, not_found_ok=True)

    # Copy schema
    main_ref = f"{client.project}.{DATASET_ID}.{MAIN_TABLE}"
    schema = client.get_table(main_ref).schema
    client.create_table(bigquery.Table(staging_ref, schema=schema))
    return stage_table_id, staging_ref

def create_osv_bigquery_streamer(client, staging_ref, buffer_limit=1000):
    buffer = []

    def stream(entry):
        buffer.append(entry)
        if ENV == "local":
            threshold = 50
        else:
            threshold = buffer_limit

        if len(buffer) >= threshold:
            flush()

    def flush():
        nonlocal buffer
        if not buffer:
            return
        errors = client.insert_rows_json(staging_ref, buffer)
        if errors:
            raise RuntimeError(f"BigQuery insert errors: {errors}")
        
        buffer.clear()

    return stream, flush


def download_transform_and_insert_staging_osv(flush_to_bigquery, stream_to_bigquery):
    context = ssl.create_default_context(cafile=certifi.where())
    download_path = Path(OSV_DOWNLOAD_DIR)
    download_path.mkdir(parents=True, exist_ok=True)
    count = 0
    unique_count = 0
    
    for ecosystem, runtimes in ECOSYSTEM_TO_RUNTIME_MAP.items():

        for runtime in runtimes:
            transformed_path = download_path / ecosystem / runtime / "vulnerabilities.transformed.jsonl"
            if transformed_path.exists():
                transformed_path.unlink()

        output_folder = download_path / ecosystem
        output_folder.mkdir(parents=True, exist_ok=True)
        source_raw_jsonl_path = output_folder / "vulnerabilities.jsonl"
        

        if source_raw_jsonl_path.exists():
            logging.info(f"♻️ Reusing existing {source_raw_jsonl_path}, regenerating transformed...")
            try:
                with open(source_raw_jsonl_path, "r", encoding="utf-8") as f:
                    records = json.load(f)
            except Exception as e:
                logging.error(f"❌ Failed to load {source_raw_jsonl_path} as JSON array: {e}")
                continue
            
            for record in records:
                try:
                    for runtime, transformed in transform_entry(record, runtimes, ecosystem):
                        stream_to_bigquery(transformed)

                        transformed_jsonl_path = output_folder / runtime /"vulnerabilities.transformed.jsonl"
                        transformed_jsonl_path.parent.mkdir(parents=True, exist_ok=True)
                        with open(transformed_jsonl_path, "a", encoding="utf-8") as xform_out:
                            xform_out.write(json.dumps(transformed, ensure_ascii=False) + "\n")
                            count += 1
                            if count % 50 == 0:
                                log_memory(f"Post-{ecosystem}-write (every 50)")
                except Exception as e:
                    tb = traceback.extract_tb(e.__traceback__)[-1]
                    lineno = tb.lineno
                    filename = tb.filename
                    logging.warning(f"⚠️ Failed to transform record in {ecosystem}: {e}. file: {filename} line_number: {lineno}")

            logging.info(f"✅ Regenerated {count} transformed records for {ecosystem}")
            log_memory(f"Post-{ecosystem}-retransform")
            unique_count += deduplicate_repeated_versions_jsonl(output_folder)
            log_memory(f"Post-{ecosystem}-deduplicate")

            continue

        zip_download_url = f"{OSV_INDEX_URL}{quote(ecosystem)}/all.zip"

        try:
            logging.info(f"📥 Downloading ZIP: {zip_download_url}")
# === MCP FIX START (python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected) ===
# Severity: WARNING
 VULN:  
            with urllib.request.urlopen(zip_download_url, context=context) as response: + 
 
 FIX:  
Fix:
    Use the'requests' library instead of 'urllib' to make HTTP requests. The'requests' library provides a more secure and flexible API for making HTTP requests. Additionally, it supports file:// schemes, making it suitable for handling local file paths.

    Replace:
        with urllib.request.urlopen(zip_download_url, context=context) as response:

    With:
        import requests
        response = requests.get(zip_download_url, verify=False)
        with response: + 
 
# === MCP FIX END ===
                zip_bytes = response.read()
            logging.info(f"✅ Downloaded in-memory: {ecosystem}/all.zip")

            with zipfile.ZipFile(BytesIO(zip_bytes)) as zip_ref:
                for name in zip_ref.namelist():
                    if not name.endswith(".json"):
                        raise Exception("zip output not json: {name}")
                    try:
                        with zip_ref.open(name) as json_file:
                            record = json.load(json_file)

                            with open(source_raw_jsonl_path, "a", encoding="utf-8") as raw_out:
                                raw_out.write(json.dumps(record, ensure_ascii=False, indent=2) + "\n")

                            for runtime, transformed in transform_entry(record, runtimes, ecosystem):
                                stream_to_bigquery(transformed)
                                transformed_jsonl_path = output_folder / runtime / "vulnerabilities.transformed.jsonl"
                                transformed_jsonl_path.parent.mkdir(parents=True, exist_ok=True)

                                with open(transformed_jsonl_path, "a", encoding="utf-8") as xform_out:
                                    xform_out.write(json.dumps(transformed, ensure_ascii=False) + "\n")
                                    count += 1
                                    if count % 50 == 0:
                                        log_memory(f"Post-{ecosystem}-write (every 50)")
                    except Exception as e:
                        logging.warning(f"⚠️ ERROR  {name} in {ecosystem}: {e}")
                        raise Exception()

            logging.info(f"✅ Transformed {count} transformed records for {ecosystem}")


        except Exception as e:
            logging.error(f"❌ Failed to process {ecosystem} ({zip_download_url}): {e}")

        log_memory(f"Post-{ecosystem}-retransform")
        ##TODO: Consider removing.
        unique_count += deduplicate_repeated_versions_jsonl(output_folder)
        log_memory(f"Post-{ecosystem}-deduplicate")


    flush_to_bigquery()
    return unique_count

def hash_key(record: dict) -> str:
    key_data = {
        "library": record["library"],
        "vendor": record["vendor"],
        "runtime": record["runtime"],
        "affected_versions": {
            "introduced": sorted(record.get("affected_versions", {}).get("introduced", [])),
            "fixed": sorted(record.get("affected_versions", {}).get("fixed", [])),
        }
    }
    key_str = json.dumps(key_data, sort_keys=True)
    return hashlib.sha256(key_str.encode("utf-8")).hexdigest()


def deduplicate_repeated_versions_jsonl(output_folder: Path):
    count = 0
    for runtime_dir in output_folder.iterdir():
        if not runtime_dir.is_dir():
            continue
        jsonl_path = runtime_dir / "vulnerabilities.transformed.jsonl"
        if not jsonl_path.exists():
            continue

        seen_index = set()
        tmp_path = jsonl_path.with_suffix(".deduping.tmp")

        with open(jsonl_path, "r", encoding="utf-8") as infile, open(tmp_path, "w", encoding="utf-8") as outfile:
            for line in infile:
                try:
                    record = json.loads(line)
                    key_hash = hash_key(record)

                    if key_hash in seen_index:
                        continue

                    seen_index.add(key_hash)
                    count+= 1
                    outfile.write(json.dumps(record, ensure_ascii=False) + "\n")
                except Exception as e:
                    logging.warning(f"⚠️ Dedup failed on {jsonl_path}: {e}")
                    logging.warning(f"{line.strip()}")
                    raise

        jsonl_path.unlink()
        tmp_path.rename(jsonl_path)
        logging.info(f"🧼 Deduplicated {jsonl_path}")
        return count

if __name__ == '__main__':
    client = bigquery.Client()
    stage_table_id, staging_ref = initialize_osv_staging_table(client)
    stream_to_bigquery, flush_to_bigquery = create_osv_bigquery_streamer(client, staging_ref)
    unique_count = download_transform_and_insert_staging_osv(flush_to_bigquery, stream_to_bigquery)
    

    log_memory("Completed all downloads")

    ingest_to_main_table(unique_count, stage_table_id)


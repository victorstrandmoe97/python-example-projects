import urllib.request
import ssl
import certifi
from time import sleep
import os
from config import NVD_CPE_XML_FILE, DEV_INGESTION_LIMIT, DATASET_ID, STAGING_TABLE,MAIN_TABLE, ENV, NVD_CPE_XML_DOWNLOAD_URL, TEMP_JSONL_PATH
from extract_metadata import extract_metadata
from transform import parse_cpe_dictionary
from ingest_to_main_table import ingest_to_main_table
import zipfile
import urllib.request
import logging
import psutil
from datetime import datetime, timezone

from google.cloud import bigquery

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
process = psutil.Process(os.getpid())

run_suffix = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
RUN_STAGING_TABLE = f"{STAGING_TABLE}-{run_suffix}"


def log_memory(operation):
    mem = process.memory_info().rss / (1024 ** 2)
    logging.info(f"📊 Operation {operation} Resident memory: {mem:.2f} MB")


def download_and_extract_cpe_dictionary():
    zip_path = NVD_CPE_XML_FILE + ".zip"

    logging.info("📥 Downloading CPE dictionary...")

    context = ssl.create_default_context(cafile=certifi.where())
# === MCP FIX START (python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected) ===
    with urllib.request.urlopen(NVD_CPE_XML_DOWNLOAD_URL, context=context) as response, open(zip_path, 'wb') as out_file:
# → Suggested secure fix:
# Corrected line:
    with urllib.request.urlopen(NVD_CPE_XML_DOWNLOAD_URL, context=context) as response, open(zip_path, 'wb') as out_file:
        shutil.copyfileobj(response, out_file)
```

In the corrected line, the
# === MCP FIX END ===
        out_file.write(response.read())

    logging.info("🗜️  Extracting CPE dictionary ZIP...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(os.path.dirname(NVD_CPE_XML_FILE))

    os.remove(zip_path)
    logging.info(f"✅ Extracted XML to {NVD_CPE_XML_FILE}")

def _table_ref(table_name):
    return f"{client.project}.{DATASET_ID}.{table_name}"


client = bigquery.Client()
staging_ref = bigquery.TableReference.from_api_repr({
    "projectId": client.project,
    "datasetId": DATASET_ID,
    "tableId": RUN_STAGING_TABLE
})

stream_buffer = []
total_buffer_flush = 0

def stream_to_bigquery(entry):
    stream_buffer.append(entry)
    if ENV ==  "local":
        buffer_size = DEV_INGESTION_LIMIT
    else: 
        buffer_size = 1000

    if len(stream_buffer) >= buffer_size:
        flush_to_bigquery()


def flush_to_bigquery():
    global stream_buffer
    global total_buffer_flush
    if not stream_buffer:
        return
    errors = client.insert_rows_json(staging_ref, stream_buffer)
    if errors:
        raise RuntimeError(f"BigQuery insert errors: {errors}")
    stream_buffer.clear()
    log_memory("mid-insert memory")
    if total_buffer_flush > 5:
        raise Exception

if __name__ == '__main__':
    if ENV == "local":
        limit = DEV_INGESTION_LIMIT 
        download_xml = False
    elif ENV == "prod":
        limit = None
        download_xml = True
    else:
        raise Exception("Unsupported environment passed")
    
    if limit == 0:
        raise Exception("Not valid limit for given environment: {ENV}")

    if os.path.exists(TEMP_JSONL_PATH):
        os.remove(TEMP_JSONL_PATH)
        logging.info(f"🧹 Removed existing temp file: {TEMP_JSONL_PATH}")

    if download_xml == True:
        download_and_extract_cpe_dictionary()
        log_memory("download_and_extract_cpe_dictionary")

    log_memory("pre parse_cpe_dictionary")

    try:
        client.delete_table(staging_ref, not_found_ok=True)
        logging.info(f"🗑️ Deleted old staging table {STAGING_TABLE}")
    except Exception as e:
        logging.warning(f"⚠️ o staging table to delete {STAGING_TABLE}: {e}")

    try:
        main_table = client.get_table(_table_ref(MAIN_TABLE))
        schema = main_table.schema
        table = bigquery.Table(staging_ref, schema=schema)
        client.create_table(table)
        logging.info(f"✅ Recreated staging table {RUN_STAGING_TABLE} using schema from {MAIN_TABLE}")
    except Exception as e:
        logging.error(f"❌ Failed to create staging table: {e}")
        raise

    for _ in range(15):
        try:
            client.get_table(staging_ref)
            sleep(15)  # Wait for backend consistency
            logging.info("✅ Staging table is now ready")
            break
        except Exception:
            logging.warning("⏳ Waiting for BigQuery table to be ready...")
            sleep(1)
        logging.info(f"✅ Created staging table {RUN_STAGING_TABLE} using schema from {MAIN_TABLE}")


        
    entry_count = parse_cpe_dictionary(limit=limit, stream_callback=stream_to_bigquery)
    flush_to_bigquery()

    log_memory("post parse_cpe_dictionary")

    metadata = extract_metadata()
    ingest_to_main_table(entry_count, metadata, RUN_STAGING_TABLE)
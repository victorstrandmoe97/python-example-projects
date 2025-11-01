import uuid
import json
import datetime
import logging
from google.cloud import bigquery
from config import DATASET_ID, MAIN_TABLE, AUDIT_TABLE, TEMP_JSONL_PATH 

client = bigquery.Client()

def _table_ref(table_name):
    return f"{client.project}.{DATASET_ID}.{table_name}"

def ingest_to_main_table(entry_count, metadata, staging_table_run_name):
    job_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow()

    try:
        # Get schema from staging
        schema = client.get_table(_table_ref(staging_table_run_name)).schema

        # Delete main
        client.delete_table(_table_ref(MAIN_TABLE), not_found_ok=True)

        with open(TEMP_JSONL_PATH, "rb") as f:
            job_config = bigquery.LoadJobConfig(
                source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
                schema=schema,
                write_disposition="WRITE_TRUNCATE"
            )
            job = client.load_table_from_file(f, _table_ref(MAIN_TABLE), job_config=job_config)
            job.result()


        logging.info("📝 Main table loaded")

        client.delete_table(_table_ref(staging_table_run_name), not_found_ok=True)
        logging.info("📝 Staging table deleted")

        logging.info("📝 Inserting audit log entry")
        audit_ref = _table_ref(AUDIT_TABLE)
        audit_entry = [{
            "job_id": job_id,
            "status": "success",
            "entry_count": entry_count,
            "timestamp": timestamp.isoformat(),
            "source": "NVD",
            "error": None,
            "metadata": json.dumps(metadata)
        }]
        audit_config = bigquery.LoadJobConfig(write_disposition="WRITE_APPEND")
        client.load_table_from_json(audit_entry, audit_ref, job_config=audit_config).result()

        logging.info("✅ Audit entry inserted")

    except Exception as e:
        logging.error(f"💥 Ingestion failed: {e}")
        fail_entry = [{
            "job_id": job_id,
            "status": "failed",
            "entry_count": entry_count,
            "timestamp": timestamp.isoformat(),
            "source": "NVD",
            "error": str(e),
            "metadata": json.dumps(metadata)
        }]
        audit_ref = _table_ref(AUDIT_TABLE)
        audit_config = bigquery.LoadJobConfig(write_disposition="WRITE_APPEND")
        client.load_table_from_json(fail_entry, audit_ref, job_config=audit_config).result()

        raise

import uuid
import datetime
import logging
from pathlib import Path
from google.cloud import bigquery
from config import DATASET_ID, MAIN_TABLE, AUDIT_TABLE ,  STAGING_TABLE, ECOSYSTEM_TO_RUNTIME_MAP, OSV_DOWNLOAD_DIR

client = bigquery.Client()

def _table_ref(table_name):
    return f"{client.project}.{DATASET_ID}.{table_name}"


def ingest_to_main_table(entry_count, staging_table_run_name):
    job_id = str(uuid.uuid4())
    timestamp = datetime.datetime.utcnow()

    try:
        schema = client.get_table(_table_ref(staging_table_run_name)).schema

        client.delete_table(_table_ref(MAIN_TABLE), not_found_ok=True)

        # Read and combine all transformed JSONL files across all runtimes
        combined_path = Path("/tmp/combined.transformed.jsonl")
        with open(combined_path, "w", encoding="utf-8") as combined_file:
            for ecosystem, runtimes in ECOSYSTEM_TO_RUNTIME_MAP.items():
                for runtime in runtimes:
                    transformed_jsonl_path = (
                        Path(OSV_DOWNLOAD_DIR) / ecosystem / runtime / "vulnerabilities.transformed.jsonl"
                    )
                    if transformed_jsonl_path.exists():
                        with open(transformed_jsonl_path, "r", encoding="utf-8") as infile:
                            for line in infile:
                                combined_file.write(line)

        with open(combined_path, "rb") as f:
            job_config = bigquery.LoadJobConfig(
                source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
                schema=schema,
                write_disposition="WRITE_TRUNCATE"
            )
            job = client.load_table_from_file(f, _table_ref(MAIN_TABLE), job_config=job_config)
            job.result()

        logging.info("📝 Main table loaded")

        dataset_ref = client.dataset(DATASET_ID)
        prefix = f"{STAGING_TABLE}_"
        for table in client.list_tables(dataset_ref):
            if table.table_id.startswith(prefix):
                client.delete_table(f"{client.project}.{DATASET_ID}.{table.table_id}", not_found_ok=True)
                logging.info(f"🗑️ Deleted staging table: {table.table_id}")

        logging.info("📝 Staging tables cleaned up")

        # Insert audit log
        audit_ref = _table_ref(AUDIT_TABLE)
        audit_entry = [{
            "job_id": job_id,
            "status": "success",
            "entry_count": entry_count,
            "timestamp": timestamp.isoformat(),
            "source": "OSV",
            "error": None,
            "metadata": None,
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
            "error": str(e),
            "source": "OSV",
        }]
        audit_ref = _table_ref(AUDIT_TABLE)
        audit_config = bigquery.LoadJobConfig(write_disposition="WRITE_APPEND")
        client.load_table_from_json(fail_entry, audit_ref, job_config=audit_config).result()
        raise
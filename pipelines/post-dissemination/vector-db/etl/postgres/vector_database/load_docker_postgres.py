import os
import json
import logging
import sys
import numpy as np
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
sys.path.append(str(Path(__file__).resolve().parents[2]))

from config import (
    VECTOR_DB_NAME,
    VECTOR_DB_USER,
    VECTOR_DB_PASSWORD,
    VECTOR_DB_HOST,
    VECTOR_DB_PORT,
)

# Logging setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# Constants

def load_persisted_vectors():
    logging.info("📂 Loading persisted vector data...")
    if not os.path.exists("vectors.npy"):
        raise FileNotFoundError("One or more required files are missing from vector_database/")
    
    vectors = np.load("vectors.npy")
    
    logging.info(f"✅ Loaded {len(vectors)} documents with dim {vectors.shape[1]}")
    return vectors

def load_meta():
    logging.info("📂 Loading meta from vectors_metadata.json...")
    with open("../../vectors_metadata.json", "r", encoding="utf-8") as f:
        raw = json.load(f)

    directives = raw.get("directives", [])
    trends     = raw.get("trends", [])

    meta = []
    for rec in directives:
        meta.append(("directive", rec["directive_id"], rec["summary"]))
    for rec in trends:
        meta.append(("trend", rec["trend_id"], rec["summary"]))

    logging.info(f"✅ Loaded {len(meta)} meta records")
    return meta

def insert_to_postgres(meta, vectors):
    logging.info("🛠 Connecting to Postgres...")

    conn = psycopg2.connect(
        dbname=VECTOR_DB_NAME,
        user=VECTOR_DB_USER,
        password=VECTOR_DB_PASSWORD,
        host=VECTOR_DB_HOST,
        port=VECTOR_DB_PORT,
    )
    cur = conn.cursor()

    logging.info("📥 Inserting document vectors into embedded_vectors...")

    rows = []
    for i in range(len(meta)):
        _, external_id, _ = meta[i]
        vector = vectors[i].tolist()
        rows.append((external_id, vector))

    execute_values(cur, """
        INSERT INTO embedded_vectors (
            external_id,
            embedding
        )
        VALUES %s
        ON CONFLICT (external_id) DO UPDATE SET
            embedding = EXCLUDED.embedding
    """, rows)

    conn.commit()
    cur.close()
    conn.close()
    logging.info("✅ Vector insert completed.")



def main():
    vectors = load_persisted_vectors()
    meta = load_meta()

###DEBUG
    vec_len = len(vectors)
    meta_len = len(meta)
    if vec_len != meta_len:
        logging.error(f"❌ Length mismatch: {vec_len} vectors vs {meta_len} meta records")

        if meta_len > vec_len:
            logging.error("🔍 Extra meta entries (not embedded):")
            for i in range(vec_len, meta_len):
                kind, eid, summary = meta[i]
                logging.error(f"  {i}. {kind} {eid} — \"{summary[:100]}...\"")
            raise ValueError("More meta records than vectors — likely due to filtering during embedding.")
        
        else:  # vec_len > meta_len
            logging.error("🔍 Extra vectors (no matching meta):")
            for i in range(meta_len, vec_len):
                logging.error(f"  {i}. Vector: {vectors[i][:5]}...")  # Just show a preview
            raise ValueError("More vectors than meta — likely due to stale vector dump.")
###END-DEBUG

    insert_to_postgres(meta, vectors)

if __name__ == "__main__":
    logging.info("Starting ETL for post-dissemination.")
    main()
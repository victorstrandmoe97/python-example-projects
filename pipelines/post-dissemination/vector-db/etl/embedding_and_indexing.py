

import json
import os
import numpy as np
import faiss
import logging
import tiktoken
from openai import OpenAI
from datetime import datetime
from config import OPENAI_API_KEY

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

API_KEY     = OPENAI_API_KEY
client      = OpenAI(api_key=API_KEY)
MODEL       = "text-embedding-3-large"
DIM         = 3072
BATCH_SIZE  = 100
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FAISS_ENGINE_DIR = os.path.abspath(
    os.path.join(BASE_DIR, "..", "..", "..","..","..", "microservices", "faiss-engine", "data")
)

LOCAL_TAXONOMY_INDEX_PATH =  os.path.join(BASE_DIR, "taxonomy_index.idx")
LOCAL_VECTOR_PATH = os.path.join(BASE_DIR, "taxonomy_vectors.npy")
LOCAL_METADATA_PATH = os.path.join(BASE_DIR, "vectors_metadata.json")

COST_PER_1K = 0.00013

def load_extracted_reports():
    """
    Load the data from the JSON file, returning a dict with the expected keys.
    Handles both a single dict or a list of dicts at the top level.
    """
    with open("extracted_reports.json", "r", encoding="utf-8") as f:
        raw = json.load(f)

    # Prepare accumulators
    reports = []

    with open("extracted_reports.json", "r", encoding="utf-8") as f:
        reports = json.load(f)

    return reports

def find_summary_for_cluster_from_reports(eid, reports):
    """
    Read the summary from the reports dict.
    """

    for report in reports:
        for directive in report["directives"]:
            if directive["cluster_id"] == eid:
                return directive["summary"]
        for trend in report["trends"]:
            if trend["cluster_id"] == eid:
                return trend["summary"]
    logging.warning(f"🛑 No summary found for {eid}")    
    return None

def load_data():
    """
    Load the data from the JSON file, returning a dict with the expected keys.
    Handles both a single dict or a list of dicts at the top level.
    """
    with open("transformed_reports.json", "r", encoding="utf-8") as f:
        raw = json.load(f)

    # Prepare accumulators
    directives = []
    trends = []
    directive_labels = []
    trend_labels = []

    # If we got a list, iterate over it; if a dict, wrap it in a list
    items = raw if isinstance(raw, list) else [raw]

    for item in items:
        # guard with .get to avoid KeyErrors
        directives       .extend(item.get("directives"))
        trends           .extend(item.get("trends"))
        directive_labels .extend(item.get("directive_labels"))
        trend_labels     .extend(item.get("trend_labels"))

    return {
        "directives":       directives,
        "trends":           trends,
        "directive_labels": directive_labels,
        "trend_labels":     trend_labels
    }


def build_documents(data):
    # flatten directives+trends into docs
    docs = []
    # same label‐map builder as before
    def build_map(rows):
        m = {}
        for eid, lt, lv in rows:
            m.setdefault(eid, {}).setdefault(lt, []).append(lv)
        return m
    dmap = build_map(data.get('directive_labels', []))
    tmap = build_map(data.get('trend_labels', []))

    for rec in data.get('directives', []):
        docs.append(('directive', rec['directive_id'], rec['summary'], dmap.get(rec['directive_id'], {}), rec['follow_up_sources']))
    for rec in data.get('trends', []):
        docs.append(('trend', rec['trend_id'], rec['summary'], tmap.get(rec['trend_id'], {}), rec['follow_up_sources']))
    return docs

def embed_texts_with_cost(texts, tokenizer):
    """
    Embed a list of `texts` with OpenAI, returning:
      - embeddings: np.ndarray of shape (len(texts), DIM)
      - cost: float, estimated $ cost for the embedding calls

    It logs token counts and per‑batch cost, then returns the stacked vectors.
    """
    token_count = sum(len(tokenizer.encode(t)) for t in texts)
    cost = (token_count / 1000) * COST_PER_1K
    logging.info(f"Embedding {len(texts)} texts → {token_count} tokens, estimated cost ${cost:.6f}")

    embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        logging.info(f"Embedding batch {i // BATCH_SIZE + 1} of {len(texts) // BATCH_SIZE + 1}")
        try:
            resp = client.embeddings.create(model=MODEL, input=batch)
            batch_embeddings = [d.embedding for d in resp.data]
            if len(batch_embeddings) != len(batch):
                logging.error(f"🛑 Batch mismatch: expected {len(batch)} embeddings, got {len(batch_embeddings)}")
                for j, text in enumerate(batch):
                    logging.error(f"⚠️ Batch input {j}: {text[:120]!r}")
                raise ValueError("Batch size mismatch — OpenAI dropped an input.")

            embeddings.extend([d.embedding for d in resp.data])
        except Exception as e:
            logging.error(f"Batch {i} failed: {e}")
            for j in range(len(batch)):
                logging.error(f"Batch {i + j}: {batch[j]}")
            raise
    return np.array(embeddings, dtype="float32"), cost

def embed_and_index_dual(data, extracted_reports):
    tokenizer = tiktoken.get_encoding("cl100k_base")
    docs = build_documents(data)

    # Extract fields
    summaries = [summary for _, _, summary, _, _ in docs]
    label_texts = [
        "This cluster is labeled with: " + 
        "; ".join(f"{lt}: {', '.join(vals)}" for lt, vals in labels.items() if vals)
        for _, _, _, labels, _ in docs
    ]
    meta = [(kind, eid, summary, labels, follow_up_sources) for kind, eid, summary, labels, follow_up_sources in docs]

    # === Taxonomy Index ===
    label_vecs, _ = embed_texts_with_cost(label_texts, tokenizer)
    label_vecs /= np.linalg.norm(label_vecs, axis=1, keepdims=True)

    taxonomy_index = faiss.IndexFlatIP(DIM)
    taxonomy_index.add(label_vecs)

    faiss.write_index(taxonomy_index, os.path.join(FAISS_ENGINE_DIR, "taxonomy_index.idx"))
    faiss.write_index(taxonomy_index, LOCAL_TAXONOMY_INDEX_PATH)
    np.save(os.path.join(FAISS_ENGINE_DIR, "taxonomy_vectors.npy"), label_vecs)
    np.save(LOCAL_VECTOR_PATH, label_vecs)

    # # === Semantic Index ===
    # sum_vecs, _ = embed_texts_with_cost(summaries, tokenizer)
    # sum_vecs /= np.linalg.norm(sum_vecs, axis=1, keepdims=True)

    # semantic_index = faiss.IndexFlatIP(DIM)
    # semantic_index.add(sum_vecs)

    # faiss.write_index(semantic_index, os.path.join(FAISS_ENGINE_DIR, "semantic_index.idx"))
    # faiss.write_index(semantic_index, os.path.join(BASE_DIR, "semantic_index.idx"))
    # np.save(os.path.join(FAISS_ENGINE_DIR, "semantic_vectors.npy"), sum_vecs)
    # np.save(os.path.join(BASE_DIR, "semantic_vectors.npy"), label_vecs)

    # === Save metadata ===
    with open(os.path.join(FAISS_ENGINE_DIR, "vectors_metadata.json"), "w", encoding="utf-8") as f:
        json.dump([
            {
                "kind": kind,
                "external_id": eid,
                "summary": summary,
                "full_summary": find_summary_for_cluster_from_reports(eid, extracted_reports),
                "labels": labels,
                "follow_up_sources": follow_up_sources
            }
            for kind, eid, summary, labels, follow_up_sources in meta
        ], f, ensure_ascii=False, indent=2)
    
    with open(LOCAL_METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump([
            {
                "kind": kind,
                "external_id": eid,
                "summary": summary,
                "full_summary": find_summary_for_cluster_from_reports(eid, extracted_reports),
                "labels": labels,
                "follow_up_sources": follow_up_sources
            }
            for kind, eid, summary, labels, follow_up_sources in meta
        ], f, ensure_ascii=False, indent=2)

    # Return full structure
    return {
        "taxonomy": {
            "index": taxonomy_index,
            "meta": meta,
            "doc_vecs": label_vecs,
            "summaries": summaries
        },
        # "semantic": {
        #     "index": semantic_index,
        #     "meta": meta,
        #     "doc_vecs": sum_vecs,
        #     "summaries": summaries
        # }
    }



def embed_and_index(data, extracted_reports):
    tokenizer = tiktoken.get_encoding("cl100k_base")
    docs = build_documents(data)
    meta = [(kind, eid, summary, labels, follow_up_sources) for kind, eid, summary, labels, follow_up_sources in docs]

    summaries  = [summary for _, _, summary, _,_ in docs]
    label_texts = [
        ', '.join(f"{lt}:{v}" for lt, vals in labels.items() for v in vals)
        for _, _, _, labels,_ in docs
    ]

    empty_idxs = [i for i, txt in enumerate(label_texts) if not txt.strip()]
    if empty_idxs:
        now = datetime.now()
        date_formatted = now.strftime("%B %d, %Y – %H:%M")
        with open("empty_labels.txt", "w") as f:
            f.write(f"{date_formatted}\n")
        
        for i in empty_idxs:
            kind, eid, summary, labels, follow_up_sources = docs[i]
            logging.warning(f"🛑 Doc {i} ({kind} {eid}) has no labels: {labels!r}")
            with open("empty_labels.txt", "a") as f:
                f.write(f"{kind} {eid} has no labels—summary: {summary!r}\n")

            # FIX DOWNSTREAM ISSUES and Clean from raw `data`
            if kind == "trend":
                data["trends"] = [t for t in data.get("trends", []) if t["trend_id"] != eid]
                data["trend_labels"] = [l for l in data.get("trend_labels", []) if l[0] != eid]
                data["report_trends"] = [rt for rt in data.get("report_trends", []) if rt["trend_id"] != eid]
            elif kind == "directive":
                data["directives"] = [d for d in data.get("directives", []) if d["directive_id"] != eid]
                data["directive_labels"] = [l for l in data.get("directive_labels", []) if l[0] != eid]
                data["report_directives"] = [rd for rd in data.get("report_directives", []) if rd["directive_id"] != eid]
            with open(os.path.join(BASE_DIR, "transformed_reports.json"), "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logging.info(f"💾 Pruned transformed_reports.json saved without empty-label docs.")

    # 1.1) Remove empty labels from docs, summaries, and label_texts
    keep = [i for i in range(len(docs)) if i not in empty_idxs]
    docs        = [docs[i]        for i in keep]
    summaries   = [summaries[i]   for i in keep]
    label_texts = [label_texts[i] for i in keep]
    
    # 2) 
   # sum_vecs, _   = embed_texts_with_cost(summaries,  tokenizer)
    label_vecs, _ = embed_texts_with_cost(label_texts, tokenizer)

    # 3) Apply a weight and combine
   # label_weight = 2
   # label_vecs *= label_weight
    
  #  doc_vecs = sum_vecs + label_vecs
    doc_vecs = label_vecs

    # 4) L2‑normalize so inner Product == cosine similarity [–1,1]
    norms    = np.linalg.norm(doc_vecs, axis=1, keepdims=True)
    doc_vecs = doc_vecs / norms

    # print mismatcb
    if len(doc_vecs) != len(docs):
        mismatch_log = os.path.join(BASE_DIR, "postgres/vector_database", "mismatch_vectors_to_meta.json")
        with open(mismatch_log, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "expected_docs": len(docs),
                    "generated_vectors": len(doc_vecs),
                    "mismatched_docs": [
                        {
                            "index": i,
                            "kind": docs[i][0],
                            "external_id": docs[i][1],
                            "summary": docs[i][2]
                        }
                        for i in range(len(docs))
                        if i >= len(doc_vecs)
                    ]
                },
                f,
                indent=2
            )

    # 5) Build & persist FAISS index
    index = faiss.IndexFlatIP(DIM)
    index.add(doc_vecs)

    id_to_index   = {eid: i            for i, (_, eid, _,_,_) in enumerate(meta)}
    id_to_summary = {eid: summary      for _, eid, summary,_,_ in meta}

    INDEX_FILE = os.path.join(FAISS_ENGINE_DIR, "faiss.idx")
    LOCAL_INDEX_FILE = os.path.join(BASE_DIR, "faiss.idx")
    faiss.write_index(index, f"{INDEX_FILE}")
    faiss.write_index(index, f"{LOCAL_INDEX_FILE}")
    logging.info(f"Index saved to {INDEX_FILE}.idx")
    logging.info(f"Index saved to {LOCAL_INDEX_FILE}.idx")

    VECTORS_FILE = os.path.join(FAISS_ENGINE_DIR, "vectors.npy")
    LOCAL_VECTORS_FILE = os.path.join(BASE_DIR, "vectors.npy")
    np.save(VECTORS_FILE, doc_vecs)
    np.save(LOCAL_VECTORS_FILE, doc_vecs)
    logging.info(f"Vectors saved to {VECTORS_FILE}.idx")
    logging.info(f"Vectors saved to {LOCAL_VECTORS_FILE}.idx")

    VECTORS_METADATA_FILE = os.path.join(FAISS_ENGINE_DIR, "vectors_metadata.json")
    with open(VECTORS_METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump([
            {
                "kind":     kind,
                "external_id": eid,
                "summary":  summary,
                "full_summary": find_summary_for_cluster_from_reports(eid, extracted_reports),
                "labels":   labels,
                "follow_up_sources": fus
            }
            for kind, eid, summary, labels, fus in meta
        ], f, ensure_ascii=False, indent=2)
    logging.info(f"Metadata saved to {VECTORS_METADATA_FILE}.idx")
    

    LOCAL_VECTORS_METADATA_FILE = os.path.join(BASE_DIR, "vectors_metadata.json")
    with open(LOCAL_VECTORS_METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump([
            {
                "kind":     kind,
                "external_id": eid,
                "summary":  summary,
                "full_summary": find_summary_for_cluster_from_reports(eid, extracted_reports),
                "labels":   labels,
                "follow_up_sources": fus
            }
            for kind, eid, summary, labels, fus in meta
        ], f, ensure_ascii=False, indent=2)
    logging.info(f"Metadata saved to {LOCAL_VECTORS_METADATA_FILE}.idx")
    

    return index, meta, doc_vecs, summaries

if __name__ == "__main__":
    data = load_data()
    extracted_data = load_extracted_reports()
    print(f"Loaded {len(data['directives'])} directives and {len(data['trends'])} trends")
    print(f"Loaded {len(data['directive_labels'])} directive labels and {len(data['trend_labels'])} trend labels")
    if os.path.exists(LOCAL_TAXONOMY_INDEX_PATH) and os.path.exists(LOCAL_VECTOR_PATH) and os.path.exists(LOCAL_METADATA_PATH):
        logging.info("🧠 Loading FAISS index and vectors from disk (taxonomy)...")
        index = faiss.read_index(LOCAL_TAXONOMY_INDEX_PATH)
        vectors = np.load(LOCAL_VECTOR_PATH)
        with open(LOCAL_METADATA_PATH, "r", encoding="utf-8") as f:
            meta_json = json.load(f)

        meta = [
            (entry["kind"], entry["external_id"], entry["summary"], entry["labels"], entry["follow_up_sources"])
            for entry in meta_json
        ]
        summaries = [entry["summary"] for entry in meta_json]

        results = {
            "taxonomy": {
                "index": index,
                "meta": meta,
                "doc_vecs": vectors,
                "summaries": summaries
            }
        }
    else: 
        results = embed_and_index_dual(data, extracted_data)
      
    taxonomy = results["taxonomy"]
   # semantic = results["semantic"]

    for i in range(len(taxonomy["doc_vecs"])):
        D, I = taxonomy["index"].search(taxonomy["doc_vecs"][i:i+1], k=4)
        # skip self‑hit (I[0][0] == i), take next 3
        hits = [(float(D[0][j]), I[0][j]) for j in range(1,4)]
        print(f"\nStory {i}: “{ taxonomy["meta"][i][2]}”")
        print("Top 3 related:")
        for rank, (score, idx) in enumerate(hits, start=1):
            kind, eid, summ, labels, follow_up_sources =  taxonomy["meta"][idx]
            print(f"  {rank}. score {score:.3f} ({kind} {eid}) “{summ}”")




    # # Example user query
    query = "Sql injection"
    print(f'\nQuery: "{query}"')

    # 1) embed the query
    resp = client.embeddings.create(model=MODEL, input=[query])
    q_vec = np.array(resp.data[0].embedding, dtype="float32").reshape(1, -1)

    # 2) search the index for top 3
    Dq, Iq = taxonomy["index"].search(q_vec, k=15)

    # 3) print UUID + summary for each hit
    print("Query Top 3 summaries (UUID → score → summary):")
    for rank, (idx, score) in enumerate(zip(Iq[0], Dq[0]), start=1):
        kind, eid, summ, labels, follow_up_sources = taxonomy["meta"][idx]
        summary = taxonomy["summaries"][idx]
        print(f"  {rank}. {eid}  (score={score:.4f})  \"{summary}\"")

      # # Example user query
    query = "CSRF"
    print(f'\nQuery: "{query}"')

    # 1) embed the query
    resp = client.embeddings.create(model=MODEL, input=[query])
    q_vec = np.array(resp.data[0].embedding, dtype="float32").reshape(1, -1)

    # 2) search the index for top 3
    Dq, Iq = taxonomy["index"].search(q_vec, k=15)

    # 3) print UUID + summary for each hit
    print("Query Top 3 summaries (UUID → score → summary):")
    for rank, (idx, score) in enumerate(zip(Iq[0], Dq[0]), start=1):
        kind, eid, summ, labels, follow_up_sources = taxonomy["meta"][idx]
        summary = taxonomy["summaries"][idx]
        print(f"  {rank}. {eid}  (score={score:.4f})  \"{summary}\"")



   # # Example user query
    query = "Broken Access Control"
    print(f'\nQuery: "{query}"')

    # 1) embed the query
    resp = client.embeddings.create(model=MODEL, input=[query])
    q_vec = np.array(resp.data[0].embedding, dtype="float32").reshape(1, -1)

    # 2) search the index for top 3
    Dq, Iq = taxonomy["index"].search(q_vec, k=15)

    # 3) print UUID + summary for each hit
    print("Query Top 3 summaries (UUID → score → summary):")
    for rank, (idx, score) in enumerate(zip(Iq[0], Dq[0]), start=1):
        kind, eid, summ, labels, follow_up_sources = taxonomy["meta"][idx]
        summary = taxonomy["summaries"][idx]
        print(f"  {rank}. {eid}  (score={score:.4f})  \"{summary}\"")


   # # Example user query
    query = "OS Command Injection"
    print(f'\nQuery: "{query}"')

    # 1) embed the query
    resp = client.embeddings.create(model=MODEL, input=[query])
    q_vec = np.array(resp.data[0].embedding, dtype="float32").reshape(1, -1)

    # 2) search the index for top 3
    Dq, Iq = taxonomy["index"].search(q_vec, k=15)

    # 3) print UUID + summary for each hit
    print("Query Top 3 summaries (UUID → score → summary):")
    for rank, (idx, score) in enumerate(zip(Iq[0], Dq[0]), start=1):
        kind, eid, summ, labels, follow_up_sources = taxonomy["meta"][idx]
        summary = taxonomy["summaries"][idx]
        print(f"  {rank}. {eid}  (score={score:.4f})  \"{summary}\"")

   # # Example user query
    query = "Remote code execution"
    print(f'\nQuery: "{query}"')

    # 1) embed the query
    resp = client.embeddings.create(model=MODEL, input=[query])
    q_vec = np.array(resp.data[0].embedding, dtype="float32").reshape(1, -1)

    # 2) search the index for top 3
    Dq, Iq = taxonomy["index"].search(q_vec, k=15)

    # 3) print UUID + summary for each hit
    print("Query Top 3 summaries (UUID → score → summary):")
    for rank, (idx, score) in enumerate(zip(Iq[0], Dq[0]), start=1):
        kind, eid, summ, labels, follow_up_sources = taxonomy["meta"][idx]
        summary = taxonomy["summaries"][idx]
        print(f"  {rank}. {eid}  (score={score:.4f})  \"{summary}\"") 

   # # Example user query
    query = "Insecure Direct Object Reference"
    print(f'\nQuery: "{query}"')

    # 1) embed the query
    resp = client.embeddings.create(model=MODEL, input=[query])
    q_vec = np.array(resp.data[0].embedding, dtype="float32").reshape(1, -1)

    # 2) search the index for top 3
    Dq, Iq = taxonomy["index"].search(q_vec, k=3)

    # 3) print UUID + summary for each hit
    print("Query Top 3 summaries (UUID → score → summary):")
    for rank, (idx, score) in enumerate(zip(Iq[0], Dq[0]), start=1):
        kind, eid, summ, labels, follow_up_sources = taxonomy["meta"][idx]
        summary = taxonomy["summaries"][idx]
        print(f"  {rank}. {eid}  (score={score:.4f})  \"{summary}\"")  
   
    # query = "idor"
    # print(f"\nQuery: \"{query}\"")
    # resp = client.embeddings.create(model=MODEL, input=[query])
    # q_vec = np.array(resp.data[0].embedding, dtype="float32").reshape(1, -1)
    # Dq, Iq = index.search(q_vec, k=3)
    # print("Query Top 3 summaries:")
    # for rank, (idx, score) in enumerate(zip(Iq[0], Dq[0]), start=1):
    #     print(f"  {rank}. (score={score:.4f})  \"{summaries[idx]}\"")
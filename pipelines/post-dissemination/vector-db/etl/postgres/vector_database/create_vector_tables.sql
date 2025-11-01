CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embedded_vectors (
  external_id UUID PRIMARY KEY,
  embedding VECTOR(3072)
);


CREATE TABLE faiss_index_info (
  version INT PRIMARY KEY DEFAULT 1,
  built_at TIMESTAMP DEFAULT NOW(),
  doc_count INT NOT NULL,
  embedding_dim INT NOT NULL,
  label_weight FLOAT DEFAULT 1.2
);
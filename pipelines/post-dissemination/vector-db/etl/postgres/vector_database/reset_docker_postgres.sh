
echo "🚫 Stopping and removing existing vector DB container..."
docker stop vectordb 2>/dev/null || true
docker rm vectordb 2>/dev/null || true

echo "🧹 Removing old vector volume..."
docker volume rm pgdata_vector 2>/dev/null || true

echo "🚀 Starting fresh vector DB container..."
docker run --name vectordb \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=vector \
  -p 5433:5432 \
  -v pgdata_vector:/var/lib/postgresql/data \
  -d ankane/pgvector

echo "⏳ Waiting for vectordb to boot..."
sleep 5

echo "🛠 Running vector DB initialization SQL..."
docker exec -i \
  vectordb \
  bash -c "PGPASSWORD=postgres psql -U postgres -d vector" \
  < create_vector_tables.sql

echo "✅ Vector DB setup complete and listening on port 5433."
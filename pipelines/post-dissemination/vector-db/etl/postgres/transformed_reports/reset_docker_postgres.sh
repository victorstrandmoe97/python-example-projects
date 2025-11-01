set -e

echo "Stopping and removing containers..."
docker stop postgres pgadmin 2>/dev/null || true
docker rm postgres pgadmin 2>/dev/null || true

echo "Removing volume..."
docker volume rm pgdata 2>/dev/null || true

echo "Starting fresh PostgreSQL container..."
docker run --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  -d postgres:latest

echo "Waiting for PostgreSQL to start..."
sleep 5

echo "Running initialization SQL..."
docker exec -i \
  postgres \
  bash -c "PGPASSWORD=postgres psql -U postgres -d postgres" \
  < create_transformed_reports_tables.sql

echo "Starting pgAdmin..."
docker run --name pgadmin \
  --link postgres:postgres \
  -p 8080:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@admin.com \
  -e PGADMIN_DEFAULT_PASSWORD=postgres \
  -d dpage/pgadmin4

echo "✅ PostgreSQL and pgAdmin reset complete."

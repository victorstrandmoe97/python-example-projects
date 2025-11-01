FROM python:3.11-slim

WORKDIR /app

# Copy app code and env config from project root
COPY ../main.py .
COPY ../config.py .
COPY ../transform.py .
COPY ../ingest_to_main_table.py .
COPY ../requirements.txt .
COPY ../.env .
COPY docker/entrypoint.sh .

RUN pip install --no-cache-dir -r requirements.txt

RUN chmod +x entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]

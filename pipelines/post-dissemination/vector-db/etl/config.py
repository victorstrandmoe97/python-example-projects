import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
BIGQUERY_DATASET = os.getenv("BIGQUERY_DATASET", "security_stories")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

VECTOR_DB_HOST = os.getenv("VECTOR_DB_HOST")
VECTOR_DB_PORT = os.getenv("VECTOR_DB_PORT")
VECTOR_DB_NAME = os.getenv("VECTOR_DB_NAME")
VECTOR_DB_USER = os.getenv("VECTOR_DB_USER")
VECTOR_DB_PASSWORD = os.getenv("VECTOR_DB_PASSWORD")
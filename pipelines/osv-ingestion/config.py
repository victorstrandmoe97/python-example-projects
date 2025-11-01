import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

OSV_INDEX_URL = os.getenv("OSV_INDEX_URL")
OSV_DOWNLOAD_DIR = os.getenv("OSV_DOWNLOAD_DIR")
ECOSYSTEM_TO_RUNTIME_MAP = {
    "PyPI":[ "python"],
    "npm": ["nodejs"],
    "JavaScript": ["javascript"],
    "NuGet": ["dotnet"],
    "Maven": ["java"],
    "OSS-Fuzz": ["java", "spring", "other", "python"],
    "GitHub Actions": ["github_actions"],
}

DATASET_ID= os.getenv("DATASET_ID")
MAIN_TABLE= os.getenv("MAIN_TABLE")
STAGING_TABLE= os.getenv("STAGING_TABLE")
AUDIT_TABLE= os.getenv("AUDIT_TABLE")
BASE_DIR = Path("run")
ENV = os.getenv("ENV")
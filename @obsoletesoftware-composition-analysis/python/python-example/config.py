import os
from dotenv import load_dotenv

load_dotenv()

DEV_INGESTION_LIMIT = int(os.getenv("DEV_INGESTION_LIMIT") or 0)

NVD_CPE_XML_FILE = os.getenv("NVD_CPE_XML_FILE")
NVD_CPE_XML_DOWNLOAD_URL= os.getenv("NVD_CPE_XML_DOWNLOAD_URL")

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))


DATASET_ID = os.getenv("DATASET_ID")
MAIN_TABLE = os.getenv("MAIN_TABLE")
STAGING_TABLE = os.getenv("STAGING_TABLE")
AUDIT_TABLE = os.getenv("AUDIT_TABLE")

TEMP_JSONL_PATH = os.getenv("TEMP_JSONL_PATH")

ENV = os.getenv("ENV")

SUPPORTED_SOURCE_PLATFORMS = [
    #runtimes
    "javascript",
    "npmjs",
    "node.js",
    "python",
    ".net",
    "asp.net",
    "nuget",
    "asp",
    "java",
    "oracle",
    "spring_cloud",
    # #OS
    # "iphone_os",
    # "windows",
    # "macos",
    # #browser
    # "chrome",
    # "firefox",
    # "edge",
    # #mobile
    # "expo",
    # "react-native",
    # #VPN
    # "paloaltonetworks",
    # "fortinet",
    # "sonicwall",
    # "juniper",
    #"cisco_ios",
    #"cisco"
]
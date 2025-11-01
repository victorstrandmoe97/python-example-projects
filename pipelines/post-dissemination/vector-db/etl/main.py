import os  
import logging
import json
from extract import extract_all_weekly_reports
from transform import transform_weekly_reports

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s"
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def extract():
    if os.path.exists("extracted_reports.json"):
        logging.info(f"Cache hit – reading reports from extracted_reports.json")
        with open("extracted_reports.json", "r", encoding="utf-8") as f:
            return json.load(f)
    else:
        extracted_reports = extract_all_weekly_reports()
        with open("extracted_reports.json", "w", encoding="utf-8") as f:
            json.dump(extracted_reports, f, indent=2, ensure_ascii=False, default=str)
        return extracted_reports

def transform(reports):
    """
    Transform the extracted reports into the desired format.
    """
    transformed_dataset = transform_weekly_reports(reports)
    with open("transformed_reports.json", "w", encoding="utf-8") as f:
        json.dump(transformed_dataset, f, indent=2, ensure_ascii=False,  default=str)

    return transformed_dataset

def main():
    extracted_reports = extract()
    logging.info(f"Extracted {len(extracted_reports)} reports with story labels")

    transformed_reports = transform(extracted_reports)
    logging.info(f"Transformed {len(transformed_reports['reports'])} reports")


if __name__ == "__main__":
    logging.info("Starting ETL for post-dissemination. vector-db")
    main()
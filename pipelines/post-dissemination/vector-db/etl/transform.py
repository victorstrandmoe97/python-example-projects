import json
import logging
from LabelNormalizer import LabelNormalizer
from SummaryNormalizer import SummaryNormalizer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s"
)

def remove_duplicates_for_report_entry(labels):
    """
    Normalize labels by removing duplicates across label types.

    :param labels: A dict with keys 'technologies' and 'affiliated_organizations'
    :return: Dict with deduplicated lists under same keys
    """
    return {
        "technologies": list(set(labels["technologies"])),
        "affiliated_organizations": list(set(labels["affiliated_organizations"])),
        "industries": list(set(labels["industries"])),
        "vulnerabilities": list(set(labels["vulnerabilities"])),
        "owasp_top_ten": list(set(labels["owasp_top_ten"])),
        "timeline_classification": list(set(labels["timeline_classification"])),
        "types": list(set(labels["types"])),
    }

def transform_weekly_reports(reports):
    label_normalizer = LabelNormalizer()
    summary_normalizer = SummaryNormalizer()
    transformed_reports = {}
    directives = []
    trends = []
    directive_labels = []
    trend_labels = []
    report_rows = []
    report_directives = []
    report_trends = []

    sorted_reports = sorted(reports, key=lambda r: int(r["week"]))
    
    for report in sorted_reports:
        report_id = report["report_id"]
        week = int(report["week"])
        year = int(report["year"])
        report_rows.append({
            "report_id": report_id,
            "week": week,
            "year": year
        })

        for directive in report["directives"]:
            directive_id = directive["cluster_id"]

            summary = summary_normalizer.normalize(directive["summary"])
            
            directives.append({
                "directive_id": directive_id,
                "summary": summary,
                "follow_up_sources": directive["follow_up_sources"]
            })

            report_directives.append({
                "report_id": report_id,
                "directive_id": directive_id
            })

          #  logging.info(f"Processing directive labels {json.dumps(directive, indent=2)}")
            unique_labels = remove_duplicates_for_report_entry(directive["labels"])
            labels = label_normalizer.normalize(unique_labels)

            for tech in labels["technologies"]:
                directive_labels.append((directive_id, "technology", tech))
            
            for vuln in labels["vulnerabilities"]:
                directive_labels.append((directive_id, "vulnerabilities", vuln))
            for owasp_top_ten in labels["owasp_top_ten"]:
                directive_labels.append((directive_id, "owasp_top_ten", owasp_top_ten))
            for types in labels["types"]:
                directive_labels.append((directive_id, "types", types))
            for timeline_classification in labels["timeline_classification"]:
                directive_labels.append((directive_id, "timeline_classification", timeline_classification))
            # for org in labels["affiliated_organizations"]:
            #     directive_labels.append((directive_id, "affiliated_organization", org))
            # for industry in labels["industries"]:
            #     directive_labels.append((directive_id, "industry", industry))
            
        for trend in report["trends"]:
            trend_id = trend["cluster_id"]
            summary = summary_normalizer.normalize(trend["summary"])

            trends.append({
                "trend_id": trend_id,
                "summary": summary,
                "follow_up_sources": trend["follow_up_sources"]
            })
            
            report_trends.append({
                "report_id": report_id,
                "trend_id": trend_id
            })

          #  logging.info(f"Processing trend labels {json.dumps(trend, indent=2)}")
            unique_labels = remove_duplicates_for_report_entry(trend["labels"])
            labels = label_normalizer.normalize(unique_labels)
            
            for tech in labels["technologies"]:
                trend_labels.append((trend_id, "technology", tech))
            for vuln in labels["vulnerabilities"]:
                trend_labels.append((trend_id, "vulnerabilities", vuln))
            for owasp_top_ten in labels["owasp_top_ten"]:
                trend_labels.append((trend_id, "owasp_top_ten", owasp_top_ten))
            for types in labels["types"]:
                trend_labels.append((trend_id, "types", types))
            for timeline_classification in labels["timeline_classification"]:
                trend_labels.append((trend_id, "timeline_classification", timeline_classification))
          #  for org in labels["affiliated_organizations"]:
           #     trend_labels.append((trend_id, "affiliated_organization", org))
            # for industry in labels["industries"]:
            #     trend_labels.append((trend_id, "industry", industry))

    transformed_reports = {
        "reports": report_rows,
        "directives": directives,
        "directive_labels": directive_labels,
        "report_directives": report_directives,
        "trends": trends,
        "trend_labels": trend_labels,
        "report_trends": report_trends
    }


    return transformed_reports

import os
from typing import List, Dict 
import logging
from google.cloud import bigquery
from config import GOOGLE_CLOUD_PROJECT, BIGQUERY_DATASET

client = bigquery.Client(project=GOOGLE_CLOUD_PROJECT)


##TODO: dont make seperat request to bigquery for each la
# bel, instead fetch all labels for the stories in the cluster
# current oslution  is to keep oversight of which stories  are viable or not 
def extract_all_weekly_reports():
    """
    Get all reports
    """

    logging.info("Fetching all weekly reports from BigQuery.")

    """Fetch email IDs within the specified date range."""
    reportsQuery = f"""
    SELECT *
    FROM `{GOOGLE_CLOUD_PROJECT}.{BIGQUERY_DATASET}.weekly_newsletter_for_operatives`
    """
    reports: List[Dict] = [dict(row.items()) for row in client.query(reportsQuery).result()]

    for report in reports:
        print(f"<<<<<<<<Processing report for report {report['week']}-{report['year']}  ID: {report['report_id']}>>>>>>>\n")
        # ---- Combine directives & trends in one loop ----------------------
        for section in ("directives", "trends"):
            for item in report[section]:
                item["labels"] = {
                    "technologies": [],
                    "industries": [],
                    "affiliated_organizations": [],
                    "types": [],
                    "timeline_classification": []
                }

                cluster_id = item["cluster_id"]
                labels = get_stories_labels_for_cluster(cluster_id)
                if not labels:
                    logging.info(f"No label data found for cluster ID: {cluster_id}")
                    continue

                item["labels"]["technologies"].extend(labels["technologies"])
                item["labels"]["industries"].extend(labels["industries"])
                item["labels"]["affiliated_organizations"].extend(
                    labels["affiliated_organizations"]
                )
                item["labels"]["types"].extend(labels["types"])
                item["labels"]["timeline_classification"].extend(labels["timeline_classification"])

                #dedupe the labels
                for key in item["labels"]:
                    item["labels"][key] = list(set(item["labels"][key]))

    return reports

def get_labels_for_story(story_id):
    """
    Fetch story labels for a given story ID.
    """
    query = f"""
    SELECT story_id, headline, technologies, industries, affiliated_organizations, types, timeline_classification
    FROM `{GOOGLE_CLOUD_PROJECT}.{BIGQUERY_DATASET}.story_labels`
    WHERE story_id = '{story_id}'
    """


    labelRows = list(client.query(query).result())
    if not labelRows:
        logging.info(f"No label data found for story_id: {story_id}")
        return None 

    return labelRows[0]

def get_stories_labels_for_cluster(cluster_id):
    """
    Fetch stories for a given cluster ID.
    """
    cluster_query = f"""
    SELECT *
    FROM `{GOOGLE_CLOUD_PROJECT}.{BIGQUERY_DATASET}.weekly_trending_stories`
    WHERE cluster_id = '{cluster_id}'
    """
    print(f"Fetching cluster data for cluster ID: {cluster_id}")
    cluster = list(client.query(cluster_query).result())
    if not cluster:
        logging.info(f"No data found for cluster ID: {cluster_id}")
        return None
    cluster = cluster[0]

    story_ids = [ref["story_id"] for ref in cluster["story_refs"]]

    query = """
    SELECT
        story_id,
        technologies,
        industries,
        affiliated_organizations,
        types,
        timeline_classification
    FROM
        `{}.{}.story_labels`
    WHERE
        story_id IN UNNEST(@story_ids)
    """.format(GOOGLE_CLOUD_PROJECT, BIGQUERY_DATASET)

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ArrayQueryParameter("story_ids", "STRING", story_ids)
        ]
    )

    rows = client.query(query, job_config=job_config).result()

    # rows is an iterable of Row(story_id, technologies, industries, affiliated_organizations)
    labels = {
        "technologies": [],
        "industries": [],
        "affiliated_organizations": [],
        "timeline_classification": [],
        "types": []
    }
    for row in rows:
        labels["technologies"].extend(row.technologies or [])
        labels["industries"].extend(row.industries or [])
        labels["affiliated_organizations"].extend(row.affiliated_organizations or [])
        labels["types"].extend(row.types or [])
        if row.timeline_classification:
            labels["timeline_classification"].append(row.timeline_classification)

    return labels
import uuid
from typing import Any, Dict, List, Optional, Tuple
from cvss import CVSS3
from datetime import datetime, timezone
from urllib.parse import urlparse
from collections import defaultdict
import re
import psutil
import os
import logging

process = psutil.Process(os.getpid())

def log_memory(operation):
    mem = process.memory_info().rss / (1024 ** 2)
    logging.info(f"📊 Operation {operation} Resident memory: {mem:.2f} MB")

def build_version_ranges(affected: List[Dict[str, Any]]) -> List[str]:
    ranges = []
    for a in affected:
        for r in a.get("ranges", []):
            if r.get("type") != "SEMVER":
                continue
            introduced, fixed = None, None
            for ev in r.get("events", []):
                if "introduced" in ev:
                    introduced = ev["introduced"]
                if "fixed" in ev:
                    fixed = ev["fixed"]
            if introduced and fixed:
                ranges.append(f">={introduced},<{fixed}")
            elif introduced:
                ranges.append(f">={introduced}")
    return ranges


def extract_cvss(entry: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
    sev = entry.get("severity") or entry.get("cvss") or []
    if not isinstance(sev, list):
        sev = [sev]

    primary = None
    others = []

    for s in sev:
        if not isinstance(s, dict):
            continue

        stype = s.get("type", "")
        vector = s.get("score")
        if not stype or not vector:
            continue

        if stype.startswith("CVSS") and primary is None:
            if stype == "CVSS_V4":
                try:
                    fallback_score = float(vector.split("/")[-1].split(":")[-1])
                    primary = {
                        "type": stype,
                        "score": fallback_score,
                    }
                except Exception:
                    continue
            else:
                try:
                    primary = {
                        "type": stype,
                        "score": CVSS3(vector).scores()[0],
                    }
                except Exception:
                    continue
        else:
            try:
                # generic numeric fallback for others
                score_val = float(vector.split("/")[-1].split(":")[-1])
                others.append({
                    "type": stype,
                    "score": score_val
                })
            except Exception:
                continue

    return primary, others


def extract_references_and_library_url(refs: List[Dict[str, str]]) -> Tuple[Dict[str, List[str]], str]:
    out = {
        "CVE": [],
        "GHSA": [],
        "WEB": [],
    }
    library_url = None

    for ref in refs:
        url = ref.get("url", "")
        ref_type = ref.get("type", "")

        if ref_type == "PACKAGE":
            library_url = url
        elif "nvd.nist.gov" in url or "cve.mitre.org" in url:
            out["CVE"].append(url)
        elif "github.com" in url and "advisories/GHSA-" in url:
            out["GHSA"].append(url)
        else:
            out["WEB"].append(url)
            

    return out, library_url


def extract_affected_versions(affected: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    introduced_versions = []
    fixed_versions = []

    for a in affected:
        for r in a.get("ranges", []):
            if r.get("type") not in ("SEMVER", "ECOSYSTEM"):
                continue
            for ev in r.get("events", []):
                if "introduced" in ev:
                    introduced_versions.append(ev["introduced"])
                if "fixed" in ev:
                    fixed_versions.append(ev["fixed"])

    return {
        "introduced": introduced_versions,
        "fixed": fixed_versions
    }


def extract_external_ids(aliases: List[str], id: str, references: List[Dict[str, str]]) -> Dict[str, List[str]]:
    categorized = defaultdict(set)

    CVE_PATTERN = re.compile(r"\bCVE-\d{4}-\d{4,7}\b")
    GHSA_PATTERN = re.compile(r"\bGHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}\b")

    # From aliases
    for alias in aliases:
        if alias.startswith("CVE-"):
            categorized["CVE"].add(alias)
        elif alias.startswith("GHSA-"):
            categorized["GHSA"].add(alias)
        else:
            categorized["OTHER"].add(alias)

    # From ID itself
    if id.startswith("OSV-"):
        categorized["OSV"].add(id)
    elif id.startswith("GHSA-"):
        categorized["GHSA"].add(id)
    elif id.startswith("CVE-"):
        categorized["CVE"].add(id)

    # From references
    for ref in references:
        url = ref.get("url", "")
        for match in CVE_PATTERN.findall(url):
            categorized["CVE"].add(match)
        for match in GHSA_PATTERN.findall(url):
            categorized["GHSA"].add(match)

    return {k: sorted(list(v)) for k, v in categorized.items()}


def extract_vuln_score(entry: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
    sev = entry.get("severity") or entry.get("cvss") or []
    if not isinstance(sev, list):
        sev = [sev]

    primary = None
    others = []

    for s in sev:
        if not isinstance(s, dict):
            continue
        score = s.get("score")
        stype = s.get("type")
        if not stype or not score:
            continue

        if stype.startswith("CVSS") and primary is None:
            primary = {
                "type": stype,
                "score": None,
            }
            try:
                primary["score"] = CVSS3(score).scores()[0]
            except Exception:
                primary["score"] = None
        else:
            try:
                parsed_score = float(score) if isinstance(score, (int, float)) else float(score.strip("CVSS:"))
                others.append({
                    "type": stype,
                    "score": str(parsed_score)
                })
            except Exception:
                continue

    return primary, others

def extract_ambiguous_vuln_score(affected:Dict[str, Any], existing_other_scores: List[Dict[str, Any]]):
    ecosystem_specific = affected.get("ecosystem_specific")
    if ecosystem_specific is not None:
        existing_other_scores.append({
            "type": "ambiguous",
            "score": ecosystem_specific.get("severity")
        })
    return existing_other_scores

def infer_runtimes(pkg_name: str, versions: List[str], summary: str, candidate_runtimes: List[str], ecosystem: str) -> List[str]:
    text_blob = f"{pkg_name} {summary} {' '.join(versions)}".lower()
    matched = []

    for runtime in candidate_runtimes:
        if runtime.lower() in text_blob:
            matched.append(runtime)

    return matched or (["other"] if "other" in candidate_runtimes else [candidate_runtimes[0]])


def infer_vendor(pkg_name: str, library_url: str = None) -> str:
    # 1) Try to infer from the URL, if provided
    if library_url:
        parts = urlparse(library_url).path.split("/")
        if len(parts) > 1 and parts[1]:
            return parts[1].lstrip("@")

    #Fallback to pkg_name
    if "/" in pkg_name:
        vendor = pkg_name.split("/", 1)[0]
    else:
        vendor = pkg_name

    return vendor.split("-", 1)[0]


def transform_entry(source_entry: Dict[str, Any], possible_runtimes: List[str], ecosystem: str) -> List[Tuple[str, Any]]:
    affected = source_entry.get("affected", [])
    transformed_records: List[Tuple[str, Any]] = []
    source_id = source_entry.get("id")
    published = source_entry.get("published")
    modified = source_entry.get("modified")
    summary = source_entry.get("summary")
    references = source_entry.get("references", [])
    created_date = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f UTC")
    cvss_primary, other_scores = extract_vuln_score(source_entry)
    filtered_references, library_url = extract_references_and_library_url(references)
    external_ids = extract_external_ids(source_entry.get("aliases", []), source_id, references)

    for a in affected:
        pkg_info = a.get("package", {})
        pkg_name = pkg_info.get("name", "unknown")
        inferred_vendor = infer_vendor(pkg_name, library_url)
        versions = a.get("versions", [])
        other_scores = extract_ambiguous_vuln_score(a, other_scores)

        if len(possible_runtimes) > 0:
            runtimes = infer_runtimes(pkg_name, versions,summary, possible_runtimes, ecosystem)
        else:
            runtimes = possible_runtimes
        
        for r in runtimes:
            record = {
                "id": str(uuid.uuid4()),
                "library": pkg_name,
                "runtime": r,
                "summary": summary,
                "vendor": inferred_vendor,
                "external_ids": external_ids,
                "affected_versions": extract_affected_versions([a]),
                "references": filtered_references,
                "library_url": library_url,
                "cvss": cvss_primary,
                "other_vuln_score": other_scores,
                "published": published,
                "modified": modified,
                "created_date": created_date
            }

            transformed_records.append((r, record))

    return transformed_records


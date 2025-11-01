import xml.etree.ElementTree as ET
import uuid
import logging
import re
import json
from itertools import zip_longest
from config import TEMP_JSONL_PATH, SUPPORTED_SOURCE_PLATFORMS, NVD_CPE_XML_FILE

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")



def parse_cpe23_uri(cpe23_name: str) -> dict:
    """
    Parse a CPE 2.3 URI (e.g. "cpe:2.3:a:vendor:product:version:update:edition:language:sw_edition:target_sw:other:revision")
    into a dict with the standard CPE 2.3 field names.  Pads missing fields with ''.
    """
    parts = cpe23_name.split(':')

    field_names = [
        "prefix",      # "cpe"
        "binding",     # "2.3"
        "part",        # a, o, h
        "vendor",      # index 3
        "product",     # index 4
        "version",     # index 5
        "update",      # index 6
        "edition",     # index 7
        "language",    # index 8
        "sw_edition",  # index 9
        "target_sw",   # index 10
        "other",       # index 11
        "revision"     # index 12
    ]

    padded = [p for _, p in zip_longest(field_names, parts, fillvalue='')]
    return dict(zip(field_names, padded))

def stream_to_jsonl(entry):
    with open(TEMP_JSONL_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

def parse_cpe_dictionary(limit=None, stream_callback=None):

    ns = {
        'cpe': 'http://cpe.mitre.org/dictionary/2.0',
        'cpe23': 'http://scap.nist.gov/schema/cpe-extension/2.3'
    }

    count = 0
    context = ET.iterparse(NVD_CPE_XML_FILE, events=("end",))
    for event, elem in context:
        if elem.tag.endswith("cpe-item"):
            if limit is not None and count >= limit:
                break

            if elem.get('deprecated') == 'true':
                elem.clear()
                continue

            cpe23_elem = elem.find('cpe23:cpe23-item', ns)
            if cpe23_elem is None:
                elem.clear()
                continue

            mitr22_name = elem.get('name', '')
            cpe23_name = cpe23_elem.get('name')
            parsed = parse_cpe23_uri(cpe23_name)
            vendor = parsed["vendor"]
            product = parsed["product"]
            version = parsed["version"]
            target_sw = parsed["target_sw"]

            # --- RUNTIME INFERENCE ---
            runtime = ''
            candidates = [target_sw, vendor, product]
            for candidate in candidates:
                candidate_lower = candidate.lower()
                for supported in SUPPORTED_SOURCE_PLATFORMS:
                    if supported in candidate_lower:
                        runtime = supported
                        break
                if runtime:
                    break
            if not runtime:
                runtime_pattern = re.compile(r'~~~([^~]+)~~')
                plat_fallback_match = runtime_pattern.search(mitr22_name)
                if plat_fallback_match:
                    candidate_fallback = plat_fallback_match.group(1).lower()
                    if candidate_fallback in SUPPORTED_SOURCE_PLATFORMS:
                        runtime = candidate_fallback

            ##MATCH OSV_INGESTION ECOsYSTEM_RUNTIME_MAP
            if runtime.lower() == "npmjs" or runtime.lower() == "node.js":
                runtime = "nodejs"
            if runtime.lower() == "nuget":
                runtime == "dotnet"

            if not runtime:
                elem.clear()
                continue
            
            cves = []
            advisory_urls = []
            reference_paths = [
                'references/reference',                      
                'cpe:references/cpe:reference'               
            ]

            for path in reference_paths:
                for ref in elem.findall(path, namespaces=ns): 
                    href = ref.get('href', '')
                    if href:
                        cve_pattern = re.compile(r'CVE-\d{4}-\d{4,7}', re.IGNORECASE)
                        found_cves = cve_pattern.findall(href)
                        if found_cves:
                            cves.extend(found_cves)
                            advisory_urls.append(href)

            cves = sorted(set(cves))
            entry = {
                'id': str(uuid.uuid4()),
                'mitre_code_2_0': mitr22_name,
                'nist_code_2_3': cpe23_name,
                'cves': cves,
                'vendor': vendor.replace('\\', '').capitalize(),
                'runtime': runtime.replace('\\', ''),
                'version': version.replace('\\', ''),
                'library': product.replace('\\', ''),
            }

            if advisory_urls:
                entry['cve_codes_advisories'] = sorted(set(advisory_urls))

            if stream_callback:
                count += 1
                stream_to_jsonl(entry)
                stream_callback(entry)
            else:
                raise Exception("Streaming mode is required")

            
            elem.clear()

    logging.info(f"Finished parsing cpe_dictionary. Entries streamed: {count}")
    return count
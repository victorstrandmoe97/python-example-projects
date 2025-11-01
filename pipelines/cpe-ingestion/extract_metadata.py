import xml.etree.ElementTree as ET
import re
from config import NVD_CPE_XML_FILE

def extract_metadata():
    with open(NVD_CPE_XML_FILE, 'r', encoding='utf-8') as f:
        head_block = ""
        for _ in range(10): 
            line = f.readline()
            if "<cpe-list" in line:
                head_block = line
                break

    cpe_list_tag = re.search(r'<cpe-list\s([^>]*)>', head_block)
    xmlns_block = cpe_list_tag.group(1) if cpe_list_tag else ""

    xmlns_attribs = {}
    for match in re.finditer(r'(xmlns:[\w\-]+|xmlns|xsi:schemaLocation)="([^"]+)"', xmlns_block):
        key, value = match.groups()
        xmlns_attribs[key.replace("xlmns:", "")] = value

    context = ET.iterparse(NVD_CPE_XML_FILE, events=("end",))
    generator_data = {}
    for event, elem in context:
        if elem.tag.endswith("generator"):
            for child in elem:
                tag = child.tag.split('}')[-1]
                generator_data[tag] = child.text
            break

    return {
        'product_name': generator_data.get('product_name'),
        'product_version': generator_data.get('product_version'),
        'schema_version': generator_data.get('schema_version'),
        'timestamp': generator_data.get('timestamp'),
        'xmlns': xmlns_attribs
    }

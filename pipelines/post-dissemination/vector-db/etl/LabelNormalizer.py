import re
from LabelNormalizationAction import LabelNormalizationAction

##TODO -> dont need it now
##- Add Split
## arbitrary remote code execution
## "ACE", "Code injection"]
## Remote code execution
##  ["RCE", "Code injection"]

class LabelNormalizer:
    def __init__(self):
        self.actions: list[LabelNormalizationAction] = [
            LabelNormalizationAction(
                name="remove 'products'",
                operation_type="replace",
                pattern_rule=(r"\bproducts\b", "")
            ),
            LabelNormalizationAction(
                name="replace 'Ddos attack with Ddos'",
                operation_type="replace",
                pattern_rule=(r"\bddos attacks?\b", "Ddos")
            ),
            LabelNormalizationAction(
                name="collapse whitespace with explicit mapping",
                operation_type="replace",
                explicit_mapping={
                    "Black Basta": "BlackBasta",
                    "Kerio Control": "Keriocontrol",
                    "Gfi": "Gfi KerioControl",
                },
                pattern_rule=(r"\s{2,}", " ")
            ),
            LabelNormalizationAction(
                name="remove extraneaous text with explicit mapping",
                operation_type="replace",
                explicit_mapping={
                    "fortinet forticlient ems": "Fortinet EMS",
                    "Israeli spyware company Paragon Solutions": "Paragon Solutions",
                    "Oracle Cloud Infrastructure (Oci)": "Oracle Cloud Infrastructure",
                    "Law/Regulation": "Regulation",
                    "Vw Group": "Volkswagen",
                    "CVEs": "CVE",
                    "Cross-Site Request Forgery (Csrf)": "CSRF",
                    "Cross Site Request Forgery": "CSRF",
                    "Ci/Cd Workflows": "Ci/Cd",
                    "Cybersecurity And Infrastructure Security Agency": "CISA",
                    "U.S. CISA": "CISA",
                    "Financial Services": "Finance",
                    "Generative Artificial Intelligence (Genai)": "Generative AI",
                    "Windows Systems": "Windows",
                    "Rce Security": "Code Injection",
                    "Blind Sql Injection": "Sql Injection",
                    "Insecure Direct Object Reference": "IDOR",
                    "Insecure Direct Object References": "IDOR",
                    "Abapp code Injection": "Code Injection",
                    "RCE": "Code Injection",
                    "Zero-day Vulnerability": "Zero-Day",
                    "Zero-day Exploit": "Zero-Day",
                    "Common Vulnerabilities And Exposures (Cve) Program": "CVE Program",
                    "Cve Database": "CVE Program",
                    "Remote Code Execution": "Code Injection",
                    "Microsoft Azure": "Azure",
                    "Russian Operatives": "Russia",
                }
            ),
            # LabelNormalizationAction(
            #     name="split labels with explicit mapping",
            #     operation_type="split",
            #     explicit_mapping={
            #         "Adobe Coldfusion": {
            #             "technologies": ["Adobe ColdFusion"],
            #             "affiliated_organizations": ["Adobe"]
            #         },
            #         "Apple iOS":{
            #             "technologies": ["iOS"],
            #             "affiliated_organizations":[ "Apple"]
            #         },
            #         "Apple Icloud": {
            #             "technologies": ["iCloud"],
            #             "affiliated_organizations": ["Apple"]
            #         },
            #         "Apple Watchos": {
            #             "technologies": ["WatchOS"],
            #             "affiliated_organizations": ["Apple"]
            #         },
            #         "Palo Alto Networks": {
            #             "technologies":[],
            #             "affiliated_organizations": ["Palo Alto Networks"]
            #         },
            #         "Gfi Keriocontrol Firewalls": {
            #             "technologies": ["Firewall"],
            #             "affiliated_organizations": ["GFI KerioControl"]
            #         },
            #         "Microsoft Cloud Services": {
            #             "technologies": ["Microsoft Cloud Services"],
            #             "affiliated_organizations": ["Microsoft"]
            #         },
            #         "Microsoft Windows": {
            #             "technologies": ["Windows"],
            #             "affiliated_organizations": ["Microsoft"]
            #         },
            #         "Microsoft .Net Framework": {
            #             "technologies": [".Net Framework"],
            #             "affiliated_organizations": ["Microsoft"]
            #         },
            #         "Microsoft Services": {
            #             "technologies": [],
            #             "affiliated_organizations": ["Microsoft"]
            #         },
            #         "Mongoose Object Data Modeling (Odm) Library": {
            #             "technologies": ["Mongoose ODM"],
            #             "affiliated_organizations": []
            #         },
            #         "Medusa Ransomware": {
            #             "technologies": ["Ransomware"],
            #             "affiliated_organizations": ["Medusa"]
            #         },
            #         "Blind Sql Injection": {
            #             "technologies": ["Blind Sql Injection", "Sql Injection"],
            #             "affiliated_organizations": []
            #         },
            #         "Known Exploited Vulnerabilities (Kev) Catalog": {
            #             "technologies": ["KEV Catalog"],
            #             "affiliated_organizations": ["CISA"]
            #         },
            #         "Blackbasta Ransomware": {
            #             "technologies": ["Ransomware"],
            #             "affiliated_organizations": ["BlackBasta"]
            #         },
            #         "Lockbit Ransomware": {
            #             "technologies": ["Ransomware"],
            #             "affiliated_organizations": ["Lockbit"]
            #         },
            #         "Paragon Spyware": {
            #             "technologies": ["Spyware"],
            #             "affiliated_organizations": ["Paragon"]
            #         }
            ##- Add Split
            ## arbitrary remote code execution
            ## "ACE", "Code injection"]
            ## Remote code execution
            ##  ["RCE", "Code injection"]
            #     },
            # ),
            # LabelNormalizationAction(
            #     name="switch technologies to affiliated_organizations",
            #     operation_type="switch",
            #     explicit_mapping={
            #         "Gfi Keriocontrol": {
            #             "technologies":[],
            #             "affiliated_organizations": ["GFI KerioControl"]
            #         }
            #     }
            # )
        ]

    def normalize_string(self, label: str) -> str:
        original = label
        current = label.strip().lower()

        for action in self.actions:
            current, applied = action.apply(current)
           # print(f"[normalize_string] Applied '{applied}' → '{original}' → '{current}'")

       # print(f"[CURRENT] {current}'")

        return current.title()

    def normalize(self, labels: dict) -> dict:
        result = {
            "technologies": set(),
            "affiliated_organizations": set(),
            "industries": set(),
            "owasp_top_ten": set(),
            "vulnerabilities": set(),
            "timeline_classification": set(),
            "types": set()
        }

        for category, items in labels.items():
            for label in items:
                # Handle split operations first
                # split_applied = False
                # for action in self.actions:
                #     if action.operation_type == "split":
                #         mapping, applied = action.apply(label)
                #         if applied and isinstance(mapping, dict):
                #             for cat, values in mapping.items():
                #                 result[cat].update(values)
                #             split_applied = True
                #             break
                # if split_applied:
                #     continue

                # switch_applied = False
                # for action in self.actions:
                #     if action.operation_type == "switch":
                #         mapping, applied = action.apply(label)
                #         if applied and isinstance(mapping, dict):
                #             for cat, values in mapping.items():
                #                 result[cat].update(values)
                #             switch_applied = True
                #             break
                # if switch_applied:
                #     continue

                normed = self.normalize_string(label)
                result[category].add(normed)

        # Convert sets back to lists
        return {k: list(v) for k, v in result.items()}

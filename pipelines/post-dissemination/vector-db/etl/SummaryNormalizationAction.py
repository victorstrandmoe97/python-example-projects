import re
from typing import Optional


class SummaryNormalizationAction:
    def __init__(
        self,
        name: str,
        operation_type: str,
        explicit_mapping: Optional[dict] = None,
        pattern_rule: Optional[tuple] = None,
    ):
        """
        :param operation_type: 'replace'
        """
        self.name = name
        self.operation_type = operation_type
        # Lowercase keys for case-insensitive matching
        self.explicit_mapping = {k.lower(): v for k, v in (explicit_mapping or {}).items()}
        self.explicit_mapping_output = explicit_mapping or {}
        self.pattern_rule = pattern_rule

    def apply(self, summary: str) -> tuple[str, Optional[str]]:
        result = summary
        if self.name == "remove or replace phrases" and self.explicit_mapping:
            for pattern, replacement in self.explicit_mapping.items():
                new_result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
                result = new_result
        if self.name == "remove words" and self.explicit_mapping:
            for pattern, replacement in self.explicit_mapping.items():
                regex = rf'\b{re.escape(pattern)}\b'
                new_result = re.sub(regex, replacement, result, flags=re.IGNORECASE)
                result = new_result.strip()

        return result, self.operation_type
import re
from typing import Optional


class LabelNormalizationAction:
    def __init__(
        self,
        name: str,
        operation_type: str,
        explicit_mapping: Optional[dict] = None,
        pattern_rule: Optional[tuple] = None,
    ):
        """
        :param name: Name of the action, for logging/debugging.
        :param explicit_mapping: Dict of input → output mappings.
            - For 'replace', values are str.
            - For 'split', values are dict mapping category → list[str].
        :param pattern_rule: Tuple (pattern, replacement) for regex normalization.
        :param operation_type: 'replace' or 'split'.
        """
        self.name = name
        # Lowercase keys for case-insensitive matching
        self.explicit_mapping = {k.lower(): v for k, v in (explicit_mapping or {}).items()}
        self.explicit_mapping_output = explicit_mapping or {}
        self.pattern_rule = pattern_rule
        self.operation_type = operation_type

    def apply(self, label: str) -> tuple[str, Optional[str]]:
        stripped = label.strip()
        lookup = stripped.lower()

        if self.operation_type == "replace":
            # 1) Regex with explicit mapping rule
            if self.pattern_rule and self.explicit_mapping:
                # replace any occurrence of an explicit‐mapping key (case‑insensitive)
                for old, new in self.explicit_mapping.items():
                    if re.search(re.escape(old), stripped, flags=re.IGNORECASE):
                        replaced = re.sub(re.escape(old), new, stripped, flags=re.IGNORECASE)
                        return replaced, self.name
            # 2) Explicit mapping
            if lookup in self.explicit_mapping:
                return self.explicit_mapping[lookup], self.name
            # 3) Regex rule
            if self.pattern_rule:
                pattern, repl = self.pattern_rule
                new_lbl = re.sub(pattern, repl, stripped, flags=re.IGNORECASE)
                if new_lbl != stripped:
                    return new_lbl, self.name
            return stripped, None
        elif self.operation_type == "split":
            if lookup in self.explicit_mapping:
                return self.explicit_mapping[lookup], self.name
            return stripped, None
        # elif self.operation_type == "switch":
        #     if lookup in self.explicit_mapping:
        #         return self.explicit_mapping[lookup], self.name
        #     return stripped, None

        # Fallback: no change
        return stripped, None
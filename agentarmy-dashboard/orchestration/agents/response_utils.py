from __future__ import annotations

import json
from typing import Any


def isolate_untrusted_context(value: Any) -> str:
    """
    Serialize untrusted payloads so they can be passed as data, not instructions.
    """
    return json.dumps(value, ensure_ascii=True, default=str)


def extract_json_payload(text: str) -> Any:
    """
    Parse JSON from an LLM response that may include code fences or wrapper text.
    Raises json.JSONDecodeError if no valid JSON object/array can be parsed.
    """
    candidate = text.strip()

    if "```json" in candidate:
        candidate = candidate.split("```json", 1)[1].split("```", 1)[0].strip()
        return json.loads(candidate)

    if "```" in candidate:
        candidate = candidate.split("```", 1)[1].split("```", 1)[0].strip()
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    for opening, closing in (("{", "}"), ("[", "]")):
        start = candidate.find(opening)
        if start == -1:
            continue
        depth = 0
        for idx in range(start, len(candidate)):
            ch = candidate[idx]
            if ch == opening:
                depth += 1
            elif ch == closing:
                depth -= 1
                if depth == 0:
                    snippet = candidate[start : idx + 1]
                    return json.loads(snippet)

    return json.loads(candidate)

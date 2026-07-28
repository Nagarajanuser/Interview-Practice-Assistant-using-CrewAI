import re
from typing import Optional
from backend.core.constants import NON_ANSWERS

def is_valid_candidate_answer(ans: Optional[str]) -> bool:
    if not ans:
        return False
    
    clean = ans.strip().lower()
    clean_no_punct = re.sub(r"[^\w\s]", " ", clean)
    clean_no_punct = " ".join(clean_no_punct.split())

    if not clean_no_punct:
        return False

    if clean in NON_ANSWERS or clean_no_punct in NON_ANSWERS:
        return False

    words = clean_no_punct.split()
    
    # Check if answer is a refusal phrase
    if len(words) <= 12:
        refusal_patterns = [
            r"\b(don't|dont|do not)\s+(know|answer|have|remember|understand)\b",
            r"\b(no|zero)\s+(idea|answer|clue|response|comment|comments|knowledge|info|information|solution)\b",
            r"\b(sorry|apologies|apology)\b",
            r"\b(can't|cannot|cant|unable)\s+(to\s+)?(answer|explain|tell|solve|provide)\b",
            r"^\s*(no|nah|none|nil|n/a|na|idk|pass|skip|sorry|nothing)\s*$"
        ]
        for pattern in refusal_patterns:
            if re.search(pattern, clean) or re.search(pattern, clean_no_punct):
                return False

    return True



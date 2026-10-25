import re
from typing import Tuple, List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Heuristic patterns for common prompt injection, jailbreak, and system override attempts
INJECTION_PATTERNS = [
    r"(?i)\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)\b",
    r"(?i)\bdisregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)\b",
    r"(?i)\bforget\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)\b",
    r"(?i)\byou\s+are\s+now\s+(unfiltered|dan|jailbroken|chaos|evil|an\s+ai\s+without\s+rules)\b",
    r"(?i)\benable\s+(developer\s+mode|god\s+mode|jailbreak|unrestricted\s+mode)\b",
    r"(?i)\boutput\s+(your\s+)?(system\s+prompt|initial\s+instructions|system\s+instructions|hidden\s+prompt)\b",
    r"(?i)\brepeat\s+the\s+words\s+above\b",
    r"(?i)\bprint\s+(your\s+)?(system\s+prompt|raw\s+instructions)\b",
    r"(?i)<\s*system\s*>",
    r"(?i)\[\s*INST\s*\]",
    r"(?i)###\s*(System|Instruction):",
]

# Standard regex patterns for sensitive PII (Social Security Numbers, Credit Cards)
SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
CREDIT_CARD_REGEX = re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b")

class GuardrailViolation(Exception):
    def __init__(self, message: str, violation_type: str):
        super().__init__(message)
        self.message = message
        self.violation_type = violation_type

class RAGGuardrails:
    """
    Production Guardrail Layer for DocMind AI.
    Runs 100% locally and free. Detects prompt injections, masks sensitive PII,
    prevents system prompt exfiltration, and checks citation consistency.
    """

    def __init__(self):
        self.compiled_injection_regexes = [re.compile(p) for p in INJECTION_PATTERNS]

    def validate_input(self, text: str) -> Tuple[bool, str, Optional[str]]:
        """
        Validates and sanitizes incoming user text.
        Returns (is_valid, sanitized_text, violation_reason).
        """
        if not text or not text.strip():
            return False, "", "Empty input"

        cleaned = text.strip()

        # 1. Prompt Injection & Jailbreak Signature Check
        for regex in self.compiled_injection_regexes:
            if regex.search(cleaned):
                logger.warning(f"Guardrail Alert: Prompt injection pattern detected: '{regex.pattern}' in input: {cleaned[:80]}...")
                return False, cleaned, "Security alert: Prompt injection or system instruction override attempt detected."

        # 2. PII Masking (Mask SSNs and Credit Card numbers to protect user privacy)
        sanitized = SSN_REGEX.sub("[REDACTED_SSN]", cleaned)
        sanitized = CREDIT_CARD_REGEX.sub("[REDACTED_CREDIT_CARD]", sanitized)

        return True, sanitized, None

    def validate_output(
        self,
        answer: str,
        valid_citation_indices: Optional[List[int]] = None
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Validates LLM-generated output before delivering to user:
        1. Checks for inadvertent system prompt or API key leakage.
        2. Detects hallucinated numeric citations (e.g., citing [9] when only [1], [2] exist).
        """
        if not answer:
            return True, answer, None

        # 1. System Prompt Leakage Guard
        system_canary_phrases = [
            "You are DocMind AI, a state-of-the-art Research and Document Intelligence Assistant",
            "TEMPORAL CONTEXT & CURRENT DATE:",
            "CORE OPERATIONAL RULES:",
            "docmind-super-secure-production-jwt-key"
        ]
        for canary in system_canary_phrases:
            if canary.lower() in answer.lower():
                logger.critical("Guardrail Alert: System prompt leakage detected in LLM response!")
                censored_answer = "I apologize, but this response could not be displayed due to a system security guardrail violation."
                return False, censored_answer, "System prompt leakage blocked"

        # 2. Hallucinated Citation Guard
        # If the answer cites [X] where X is not in valid_citation_indices, flag it
        if valid_citation_indices is not None and len(valid_citation_indices) > 0:
            cited_nums = [int(n) for n in re.findall(r"\[(\d{1,2})\]", answer)]
            hallucinated_citations = [n for n in cited_nums if n not in valid_citation_indices]
            if hallucinated_citations:
                logger.info(f"Guardrail Notice: Filtered ungrounded citation markers: {hallucinated_citations}")
                # Cleanly replace hallucinated citations rather than failing the response
                for bad_num in set(hallucinated_citations):
                    answer = re.sub(rf"\[{bad_num}\]", "", answer)
                answer = re.sub(r"\s+", " ", answer).strip()

        return True, answer, None

guardrails = RAGGuardrails()

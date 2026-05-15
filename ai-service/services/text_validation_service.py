from __future__ import annotations

import math
import re
import unicodedata
from dataclasses import asdict, dataclass, field
from typing import Any


LETTER_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿĞÜŞİÖÇğüşıöç]+")
URL_RE = re.compile(r"https?://|www\.|t\.me/|bit\.ly|tinyurl|discord\.gg", re.IGNORECASE)
EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b", re.IGNORECASE)
PHONE_RE = re.compile(r"\+?\d[\d\s().-]{7,}\d")
ZERO_WIDTH_RE = re.compile(r"[\u200B-\u200D\uFEFF]")

TURKISH_VOWELS = set("aeıioöuü")
ENGLISH_VOWELS = set("aeiou")
ALL_VOWELS = TURKISH_VOWELS | ENGLISH_VOWELS

KEYBOARD_PATTERNS = (
    "asd",
    "asdf",
    "asdasd",
    "sdfg",
    "dfgh",
    "qwe",
    "qwer",
    "qwerty",
    "wert",
    "zxc",
    "zxcv",
    "xcvb",
    "hjkl",
    "jkl",
    "jklş",
    "1234",
    "0000",
)

PROMPT_INJECTION_PATTERNS = (
    "ignore previous instructions",
    "ignore all previous",
    "forget your instructions",
    "reveal your prompt",
    "show your system prompt",
    "system prompt",
    "developer message",
    "act as system",
    "jailbreak",
    "bypass safety",
    "talimatları yok say",
    "önceki talimatları",
    "sistem prompt",
    "sistem mesajı",
    "promptunu göster",
    "kuralları unut",
    "artık sen",
)

SPAM_PATTERNS = (
    "buy now",
    "free money",
    "promo code",
    "discount",
    "click here",
    "subscribe",
    "takip et",
    "abone ol",
    "indirim",
    "bedava",
    "kampanya",
    "kazanmak için",
    "hemen tıkla",
    "whatsapp",
    "telegram",
)

PERSONAL_MARKERS = (
    "ben",
    "beni",
    "bana",
    "benim",
    "kendimi",
    "i",
    "me",
    "my",
    "myself",
    "feel",
    "feeling",
    "felt",
    "hissed",
    "hisset",
    "yaşad",
    "yasad",
    "bugün",
    "bugun",
    "dün",
    "dun",
    "şimdi",
    "simdi",
    "içim",
    "icim",
    "canım",
    "canim",
)

MEANING_MARKERS = (
    "mutlu",
    "üzgün",
    "uzgun",
    "kötü",
    "kotu",
    "iyi",
    "moral",
    "yorgun",
    "stres",
    "sinir",
    "öfke",
    "ofke",
    "kork",
    "kayg",
    "endiş",
    "endis",
    "yalnız",
    "yalniz",
    "bunald",
    "sıkıl",
    "sikil",
    "umutsuz",
    "umutlu",
    "sevind",
    "heyecan",
    "motive",
    "özled",
    "ozled",
    "ağla",
    "agla",
    "bilmiyorum",
    "of ya",
    "daral",
    "rahat",
    "calm",
    "happy",
    "sad",
    "angry",
    "anxious",
    "tired",
    "stressed",
    "overwhelmed",
    "excited",
    "hopeful",
    "lonely",
    "afraid",
    "hurt",
    "nervous",
)

CRISIS_MARKERS = (
    "intihar",
    "kendime zarar",
    "yaşamak istemiyorum",
    "yasamak istemiyorum",
    "ölmek istiyorum",
    "olmek istiyorum",
    "canıma kıymak",
    "canima kiymak",
    "self harm",
    "suicide",
    "kill myself",
    "do not want to live",
)


@dataclass(frozen=True)
class TextValidationResult:
    valid: bool
    status: str
    code: str
    reason: str
    warning: str
    quality_score: float
    normalized_text: str
    needs_ai_review: bool = False
    risk_flags: list[str] = field(default_factory=list)
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["quality_score"] = round(float(self.quality_score), 3)
        return payload


def validate_text_locally(user_text: str, language: str = "en") -> dict[str, Any]:
    normalized_language = _normalize_language(language)
    normalized_text = normalize_user_text(user_text)
    warning = _default_warning(normalized_language)
    lowered = _fold(normalized_text)
    words = LETTER_RE.findall(normalized_text)
    folded_words = [_fold(word) for word in words]
    letters = [char for char in lowered if char.isalpha()]
    compact_letters = "".join(letters)
    compact_all = re.sub(r"\s+", "", lowered)
    risk_flags = _risk_flags(lowered)
    has_crisis_signal = bool(risk_flags)
    has_personal_signal = _contains_any(lowered, PERSONAL_MARKERS)
    has_meaning_signal = _contains_any(lowered, MEANING_MARKERS)
    url_count = len(URL_RE.findall(normalized_text))
    email_count = len(EMAIL_RE.findall(normalized_text))
    phone_count = len(PHONE_RE.findall(normalized_text))
    spam_signal = _contains_any(lowered, SPAM_PATTERNS)
    prompt_injection = _contains_any(lowered, PROMPT_INJECTION_PATTERNS)

    details = {
        "word_count": len(words),
        "letter_count": len(letters),
        "unique_letter_ratio": _safe_ratio(len(set(compact_letters)), len(compact_letters)),
        "vowel_ratio": _safe_ratio(sum(1 for char in compact_letters if char in ALL_VOWELS), len(compact_letters)),
        "repetition_ratio": _repetition_ratio(compact_all),
        "gibberish_ratio": _gibberish_ratio(folded_words),
        "url_count": url_count,
        "email_count": email_count,
        "phone_count": phone_count,
        "has_personal_signal": has_personal_signal,
        "has_meaning_signal": has_meaning_signal,
        "has_crisis_signal": has_crisis_signal,
    }

    if not normalized_text:
        return _reject("EMPTY_TEXT", "empty_text", warning, 0.0, normalized_text, risk_flags, details)

    if len(normalized_text) < 10:
        return _reject("TEXT_TOO_SHORT", "text_too_short", warning, 0.12, normalized_text, risk_flags, details)

    if len(normalized_text) > 1000:
        return _reject("TEXT_TOO_LONG", "text_too_long", warning, 0.2, normalized_text, risk_flags, details)

    if len(letters) < 4:
        return _reject("NO_LANGUAGE_SIGNAL", "not_enough_language_signal", warning, 0.1, normalized_text, risk_flags, details)

    if prompt_injection:
        return _reject("PROMPT_INJECTION", "prompt_injection_or_ai_command", _prompt_warning(normalized_language), 0.05, normalized_text, risk_flags, details)

    if (url_count + email_count + phone_count) > 0 and len(words) <= 4:
        return _reject("SPAM_OR_LINK_ONLY", "link_or_contact_only_text", _spam_warning(normalized_language), 0.08, normalized_text, risk_flags, details)

    if spam_signal and not (has_personal_signal or has_meaning_signal or has_crisis_signal):
        return _reject("SPAM", "promotional_or_spam_text", _spam_warning(normalized_language), 0.12, normalized_text, risk_flags, details)

    repeated_pattern = _is_repeated_pattern(compact_all)
    keyboard_mash = _is_keyboard_mash(compact_all, folded_words)
    low_variety = len(compact_letters) >= 8 and details["unique_letter_ratio"] <= 0.22
    no_vowel_signal = len(compact_letters) >= 10 and details["vowel_ratio"] <= 0.10
    gibberish_heavy = details["gibberish_ratio"] >= 0.67
    gibberish_moderate = details["gibberish_ratio"] >= 0.40

    if not has_crisis_signal and not has_meaning_signal:
        if repeated_pattern:
            return _reject("TOO_REPETITIVE", "repeated_short_pattern", warning, 0.08, normalized_text, risk_flags, details)
        if low_variety:
            return _reject("TOO_REPETITIVE", "low_character_variety", warning, 0.12, normalized_text, risk_flags, details)
        if keyboard_mash:
            return _reject("KEYBOARD_MASH", "keyboard_mashing", warning, 0.14, normalized_text, risk_flags, details)
        if no_vowel_signal:
            return _reject("GIBBERISH", "no_vowel_language_signal", warning, 0.16, normalized_text, risk_flags, details)
        if gibberish_heavy:
            return _reject("GIBBERISH", "mostly_random_tokens", warning, 0.18, normalized_text, risk_flags, details)

    quality_score = _quality_score(
        details,
        has_personal_signal=has_personal_signal,
        has_meaning_signal=has_meaning_signal,
        has_crisis_signal=has_crisis_signal,
        spam_signal=spam_signal,
        prompt_injection=prompt_injection,
    )

    if has_crisis_signal:
        return _accept("OK", "crisis_or_self_harm_signal_kept_for_analysis", normalized_text, max(quality_score, 0.72), risk_flags, details)

    if quality_score < 0.32 and not (has_personal_signal or has_meaning_signal):
        return _reject("LOW_TEXT_QUALITY", "insufficient_meaningful_signal", warning, quality_score, normalized_text, risk_flags, details)

    if quality_score < 0.56 or gibberish_moderate or not (has_personal_signal or has_meaning_signal):
        return _review(
            "NEEDS_TEXT_REVIEW",
            "borderline_text_quality",
            warning,
            quality_score,
            normalized_text,
            risk_flags,
            details,
        )

    return _accept("OK", "meaningful_text_signal", normalized_text, quality_score, risk_flags, details)


def normalize_user_text(user_text: str | None) -> str:
    text = unicodedata.normalize("NFC", str(user_text or ""))
    text = ZERO_WIDTH_RE.sub("", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text.encode("utf-8", errors="ignore").decode("utf-8", errors="ignore")


def _normalize_language(language: str | None) -> str:
    normalized = (language or "en").strip().lower()
    return "tr" if normalized.startswith("tr") else "en"


def _fold(text: str) -> str:
    lowered = text.lower()
    translation = str.maketrans("çğıöşüâîû", "cgiosuaiu")
    return lowered.translate(translation)


def _default_warning(language: str) -> str:
    if language == "tr":
        return "Metin duygu analizi için yeterince anlamlı görünmüyor. Lütfen ne yaşadığını ya da nasıl hissettiğini birkaç net cümleyle yaz."
    return "The text does not look clear enough for emotion analysis. Please write a few meaningful words about what happened or how you feel."


def _spam_warning(language: str) -> str:
    if language == "tr":
        return "Bu metin bağlantı, reklam veya spam gibi görünüyor. Duygu analizi için kendi durumunu anlatan kısa bir metin yaz."
    return "This text looks like a link, promotion, or spam. Please describe your own situation or feeling instead."


def _prompt_warning(language: str) -> str:
    if language == "tr":
        return "Bu metin duygu analizi yerine yapay zekaya komut vermeye çalışıyor gibi görünüyor. Lütfen sadece duygu durumunu veya yaşadığın olayı yaz."
    return "This text looks like an instruction to the AI rather than an emotional description. Please write only about your situation or feeling."


def _contains_any(text: str, markers: tuple[str, ...]) -> bool:
    return any(_fold(marker) in text for marker in markers)


def _risk_flags(text: str) -> list[str]:
    flags = []
    if _contains_any(text, CRISIS_MARKERS):
        flags.append("self_harm_or_crisis_signal")
    return flags


def _safe_ratio(numerator: int | float, denominator: int | float) -> float:
    if not denominator:
        return 0.0
    return float(numerator) / float(denominator)


def _is_repeated_pattern(compact_text: str) -> bool:
    if len(compact_text) < 8:
        return False

    if re.fullmatch(r"(.)\1{7,}", compact_text):
        return True

    for chunk_size in range(2, min(8, len(compact_text) // 2 + 1)):
        if len(compact_text) % chunk_size == 0:
            chunk = compact_text[:chunk_size]
            if chunk * (len(compact_text) // chunk_size) == compact_text:
                return True

    return False


def _repetition_ratio(compact_text: str) -> float:
    if len(compact_text) < 8:
        return 0.0

    best = 0.0
    for ngram_size in range(2, 6):
        if len(compact_text) < ngram_size * 2:
            continue
        ngrams = [compact_text[i : i + ngram_size] for i in range(0, len(compact_text) - ngram_size + 1)]
        if not ngrams:
            continue
        counts: dict[str, int] = {}
        for ngram in ngrams:
            counts[ngram] = counts.get(ngram, 0) + 1
        repeated = sum(count for count in counts.values() if count > 1)
        best = max(best, repeated / len(ngrams))
    return best


def _is_keyboard_mash(compact_text: str, words: list[str]) -> bool:
    if len(compact_text) < 8:
        return False

    pattern_hits = sum(1 for pattern in KEYBOARD_PATTERNS if pattern in compact_text)
    if pattern_hits >= 1 and _gibberish_ratio(words) >= 0.5:
        return True

    return pattern_hits >= 2


def _gibberish_ratio(words: list[str]) -> float:
    candidate_words = [word for word in words if len(word) >= 4]
    if not candidate_words:
        return 0.0

    gibberish_count = sum(1 for word in candidate_words if _looks_gibberish_word(word))
    return gibberish_count / len(candidate_words)


def _looks_gibberish_word(word: str) -> bool:
    if any(marker in word for marker in MEANING_MARKERS + PERSONAL_MARKERS + CRISIS_MARKERS):
        return False

    vowel_count = sum(1 for char in word if char in ALL_VOWELS)
    vowel_ratio = _safe_ratio(vowel_count, len(word))
    consonant_run = _max_consonant_run(word)
    unique_ratio = _safe_ratio(len(set(word)), len(word))

    if len(word) >= 7 and any(pattern in word for pattern in KEYBOARD_PATTERNS):
        return True
    if len(word) >= 7 and vowel_ratio <= 0.18 and consonant_run >= 4:
        return True
    if len(word) >= 10 and vowel_ratio <= 0.24 and consonant_run >= 5:
        return True
    if len(word) >= 8 and unique_ratio <= 0.28:
        return True
    if len(word) >= 12 and _repetition_ratio(word) >= 0.35:
        return True

    return False


def _max_consonant_run(word: str) -> int:
    best = 0
    current = 0
    for char in word:
        if char.isalpha() and char not in ALL_VOWELS:
            current += 1
            best = max(best, current)
        else:
            current = 0
    return best


def _quality_score(
    details: dict[str, Any],
    *,
    has_personal_signal: bool,
    has_meaning_signal: bool,
    has_crisis_signal: bool,
    spam_signal: bool,
    prompt_injection: bool,
) -> float:
    score = 0.82
    word_count = int(details["word_count"])
    letter_count = int(details["letter_count"])

    if word_count < 2:
        score -= 0.24
    elif word_count < 4:
        score -= 0.08

    if letter_count < 12:
        score -= 0.12

    score -= min(0.34, float(details["repetition_ratio"]) * 0.42)
    score -= min(0.40, float(details["gibberish_ratio"]) * 0.55)

    if float(details["unique_letter_ratio"]) < 0.26:
        score -= 0.18
    if float(details["vowel_ratio"]) < 0.16:
        score -= 0.16
    if details["url_count"] or details["email_count"] or details["phone_count"]:
        score -= 0.18
    if spam_signal:
        score -= 0.20
    if prompt_injection:
        score -= 0.65

    if has_personal_signal:
        score += 0.10
    if has_meaning_signal:
        score += 0.14
    if has_crisis_signal:
        score += 0.22

    if math.isnan(score):
        return 0.0

    return max(0.0, min(1.0, score))


def _reject(
    code: str,
    reason: str,
    warning: str,
    quality_score: float,
    normalized_text: str,
    risk_flags: list[str],
    details: dict[str, Any],
) -> dict[str, Any]:
    return TextValidationResult(
        valid=False,
        status="invalid",
        code=code,
        reason=reason,
        warning=warning,
        quality_score=quality_score,
        normalized_text=normalized_text,
        needs_ai_review=False,
        risk_flags=risk_flags,
        details=details,
    ).to_dict()


def _review(
    code: str,
    reason: str,
    warning: str,
    quality_score: float,
    normalized_text: str,
    risk_flags: list[str],
    details: dict[str, Any],
) -> dict[str, Any]:
    return TextValidationResult(
        valid=True,
        status="suspicious",
        code=code,
        reason=reason,
        warning=warning,
        quality_score=quality_score,
        normalized_text=normalized_text,
        needs_ai_review=True,
        risk_flags=risk_flags,
        details=details,
    ).to_dict()


def _accept(
    code: str,
    reason: str,
    normalized_text: str,
    quality_score: float,
    risk_flags: list[str],
    details: dict[str, Any],
) -> dict[str, Any]:
    return TextValidationResult(
        valid=True,
        status="valid",
        code=code,
        reason=reason,
        warning="",
        quality_score=quality_score,
        normalized_text=normalized_text,
        needs_ai_review=False,
        risk_flags=risk_flags,
        details=details,
    ).to_dict()

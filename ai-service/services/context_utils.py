import re

STOPWORDS = {
    "the",
    "and",
    "that",
    "with",
    "have",
    "this",
    "from",
    "your",
    "about",
    "just",
    "very",
    "feel",
    "feeling",
    "because",
    "after",
    "into",
    "been",
    "today",
    "like",
    "what",
    "when",
    "they",
    "them",
    "then",
    "were",
    "would",
    "could",
    "should",
    "really",
    "over",
    "under",
    "there",
    "here",
    "i",
    "me",
    "my",
    "we",
    "our",
    "you",
    "but",
    "for",
    "are",
    "was",
    "bir",
    "ve",
    "gibi",
    "icin",
    "bana",
    "beni",
    "bunu",
    "cok",
    "daha",
    "yuzden",
    "cunku",
    "simdi",
    "bugun",
    "boyle",
    "olan",
    "olarak",
    "kadar",
    "hisset",
    "hissediyorum",
}


def extract_query_terms(text: str | None, limit: int = 4) -> list[str]:
    if not text:
        return []

    words = re.findall(r"[^\W\d_]{3,}", text.lower(), flags=re.UNICODE)
    selected = []
    for word in words:
        if word in STOPWORDS:
            continue

        if word not in selected:
            selected.append(word)

        if len(selected) >= limit:
            break

    return selected


def append_context_to_query(base_query: str, context: str | None, limit: int = 3) -> str:
    terms = extract_query_terms(context, limit)
    if not terms:
        return base_query

    return f"{base_query} {' '.join(terms)}"

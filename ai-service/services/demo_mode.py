import os

from services.emotion_catalog import NEGATIVE_EMOTIONS, VALID_EMOTIONS, normalize_emotion_key

REASON_MARKERS = {
    "because",
    "because of",
    "due to",
    "since",
    "after",
    "neden",
    "sebep",
    "cunku",
    "yuzunden",
    "dolayi",
}

EMOTION_KEYWORDS = {
    "happy": ["happy", "joy", "great", "good", "mutlu", "sevinc", "keyifli", "guzel"],
    "sad": ["sad", "down", "hurt", "cry", "uzgun", "kirgin", "aglamak", "mutsuz"],
    "angry": ["angry", "mad", "furious", "annoyed", "ofkeli", "sinirli", "kizgin"],
    "anxious": ["anxious", "nervous", "worried", "panic", "endiseli", "kaygili", "gergin"],
    "excited": ["excited", "thrilled", "can not wait", "heyecanli", "sabirsiz", "cok mutlu"],
    "calm": ["calm", "peaceful", "steady", "sakin", "huzurlu", "dingin"],
    "tired": ["tired", "sleepy", "drained", "exhausted", "yorgun", "bitkin", "uykulu"],
    "stressed": ["stressed", "overloaded", "pressure", "bunaldim", "stresli", "baski"],
    "nostalgic": ["nostalgic", "miss", "old days", "nostaljik", "ozledim", "eskiler"],
    "motivated": ["motivated", "focused", "ready", "productive", "motive", "hazirim", "hedef"],
    "hopeful": ["hopeful", "optimistic", "better", "umutlu", "iyi olacak", "isaret", "yeniden"],
    "overwhelmed": ["overwhelmed", "too much", "can not cope", "bunalmis", "yetisemiyorum", "cok fazla", "dagildim"],
}

EMOTION_COPY = {
    "happy": {
        "tr": "Pozitif bir enerji goruluyor. Demo modunda metnindeki olumlu vurguya gore bu duygu secildi.",
        "en": "A positive tone stands out. In demo mode this emotion was selected from the upbeat cues in your text.",
    },
    "sad": {
        "tr": "Metninde daha dusuk ve zorlayici bir ton var. Demo modunda uzgunluk eksenine yakin gorundun.",
        "en": "Your text carries a lower and heavier tone. In demo mode it maps closest to sadness.",
    },
    "angry": {
        "tr": "Metinde sertlik ve gerilim sinyalleri var. Demo modunda ofke ekseni secildi.",
        "en": "Your text shows sharper tension signals. In demo mode it maps closest to anger.",
    },
    "anxious": {
        "tr": "Belirsizlik ve kaygi tonu baskin. Demo modunda endise ekseni secildi.",
        "en": "Uncertainty and worry are prominent. In demo mode it maps closest to anxiety.",
    },
    "excited": {
        "tr": "Yuksek enerji ve beklenti hissi one cikiyor. Demo modunda heyecan ekseni secildi.",
        "en": "High energy and anticipation stand out. In demo mode it maps closest to excitement.",
    },
    "calm": {
        "tr": "Daha dengeli ve yumusak bir ton var. Demo modunda sakin ekseni secildi.",
        "en": "A more balanced and gentle tone appears. In demo mode it maps closest to calm.",
    },
    "tired": {
        "tr": "Enerjinin dustugunu anlatan ifadeler var. Demo modunda yorgunluk ekseni secildi.",
        "en": "Your words suggest low energy. In demo mode it maps closest to tiredness.",
    },
    "stressed": {
        "tr": "Baski ve yuk hissi belirgin. Demo modunda stres ekseni secildi.",
        "en": "Pressure and overload are noticeable. In demo mode it maps closest to stress.",
    },
    "nostalgic": {
        "tr": "Gecmise donuk duygusal bir ton var. Demo modunda nostalji ekseni secildi.",
        "en": "There is an emotional look back toward the past. In demo mode it maps closest to nostalgia.",
    },
    "motivated": {
        "tr": "Ilerleme ve hareket istegi belirgin. Demo modunda motivasyon ekseni secildi.",
        "en": "A desire to move forward is clear. In demo mode it maps closest to motivation.",
    },
    "hopeful": {
        "tr": "Ileriye donuk daha aydinlik bir ton var. Demo modunda umut ekseni secildi.",
        "en": "There is a more forward-looking and brighter tone. In demo mode it maps closest to hopefulness.",
    },
    "overwhelmed": {
        "tr": "Yuk ve daginiklik hissi belirgin. Demo modunda bunalmislik ekseni secildi.",
        "en": "A sense of overload and scattered energy is clear. In demo mode it maps closest to overwhelm.",
    },
}

MUSIC_DATA = {
    "happy": [("Good Day Motion", "City Lights"), ("Sunny Pulse", "Mira Vale"), ("Open Window", "North Harbor")],
    "sad": [("Blue Room", "Lena Hart"), ("Slow Weather", "Evan June"), ("Quiet Rain", "Paper Roads")],
    "angry": [("Break the Static", "Iron Echo"), ("Red Signal", "Storm District"), ("Push Forward", "Atlas Noise")],
    "anxious": [("Soft Corners", "Luma Bay"), ("Breathing Space", "Still Field"), ("Low Tide", "Moss Harbor")],
    "excited": [("Launch Day", "Nova Parade"), ("Fast Glow", "Silver Arcade"), ("Neon Weekend", "Orbit Run")],
    "calm": [("Late Afternoon", "Meadow Line"), ("Sea Glass", "Arbor Sky"), ("Quiet Horizon", "Blue Cedar")],
    "tired": [("Dim Lamp", "Juniper Hall"), ("Rest Stop", "River Note"), ("Slow Morning", "Aster Vale")],
    "stressed": [("Reset Button", "Lina Grove"), ("Clear Desk", "Harbor State"), ("Step Outside", "Willow Park")],
    "nostalgic": [("Old Streets", "Golden Frame"), ("Polaroid Hearts", "Mason June"), ("Back Then", "Velvet Station")],
    "motivated": [("Next Step", "North Peak"), ("Momentum", "Pulse Engine"), ("Climb Again", "Horizon Crew")],
    "hopeful": [("Morning Window", "Luna Harbor"), ("New Light", "River Bloom"), ("After Rain", "North Avenue")],
    "overwhelmed": [("One Small Thing", "Quiet Atlas"), ("Room to Breathe", "Willow Fade"), ("Soft Reset", "Cinder Vale")],
}

MOVIE_DATA = {
    "happy": [("Chef", "Warm and uplifting comfort story."), ("Paddington 2", "Gentle optimism and kindness."), ("Sing Street", "Youthful joy and music.")],
    "sad": [("Little Miss Sunshine", "A messy family healing journey."), ("About Time", "Tender perspective on ordinary life."), ("The Secret Life of Walter Mitty", "Soft encouragement and change.")],
    "angry": [("Creed", "Focused energy and discipline."), ("Mad Max: Fury Road", "Intense motion with momentum."), ("The Dark Knight", "High-stakes tension and control.")],
    "anxious": [("My Neighbor Totoro", "Safe, soothing atmosphere."), ("Kiki's Delivery Service", "Gentle reassurance and growth."), ("Julie & Julia", "Light routine and comfort.")],
    "excited": [("Spider-Man: Into the Spider-Verse", "Bright, kinetic confidence."), ("Guardians of the Galaxy", "Fast, playful adventure."), ("Free Guy", "High-energy feel-good action.")],
    "calm": [("Paterson", "Quiet observation and balance."), ("The Secret Garden", "Soft restorative mood."), ("Nomadland", "Stillness and reflection.")],
    "tired": [("The Intern", "Warm, easygoing rhythm."), ("Marcel the Shell with Shoes On", "Small, kind and restorative."), ("Begin Again", "Gentle musical reset.")],
    "stressed": [("The Peanut Butter Falcon", "Simple heart and forward motion."), ("Chef", "Creative reset and warmth."), ("Yes Day", "Light release and humor.")],
    "nostalgic": [("Cinema Paradiso", "Memory and affection."), ("Midnight in Paris", "Romantic longing for another time."), ("The Way Way Back", "Bittersweet coming-of-age nostalgia.")],
    "motivated": [("The Martian", "Problem-solving and persistence."), ("Hidden Figures", "Steady excellence under pressure."), ("Rocky", "Classic drive and comeback energy.")],
    "hopeful": [("The Pursuit of Happyness", "Resilience with a forward-looking heart."), ("Soul", "Gentle perspective and renewed meaning."), ("Brooklyn", "Warm change and possibility.")],
    "overwhelmed": [("Inside Out", "Naming feelings creates breathing room."), ("Julie & Julia", "Small routines help when life feels full."), ("The Secret Life of Walter Mitty", "A soft reset into motion.")],
}

BOOK_DATA = {
    "happy": [("The Happiness Project", "Gretchen Rubin"), ("The Book of Delights", "Ross Gay"), ("Big Magic", "Elizabeth Gilbert")],
    "sad": [("Maybe You Should Talk to Someone", "Lori Gottlieb"), ("Tiny Beautiful Things", "Cheryl Strayed"), ("Reasons to Stay Alive", "Matt Haig")],
    "angry": [("Atomic Habits", "James Clear"), ("The Obstacle Is the Way", "Ryan Holiday"), ("Deep Work", "Cal Newport")],
    "anxious": [("The Comfort Book", "Matt Haig"), ("Wherever You Go, There You Are", "Jon Kabat-Zinn"), ("Untangle Your Anxiety", "Joshua Fletcher")],
    "excited": [("The Power of Moments", "Chip Heath"), ("Show Your Work!", "Austin Kleon"), ("Steal Like an Artist", "Austin Kleon")],
    "calm": [("Stillness Is the Key", "Ryan Holiday"), ("Wintering", "Katherine May"), ("The Art of Rest", "Claudia Hammond")],
    "tired": [("Rest Is Resistance", "Tricia Hersey"), ("How to Do Nothing", "Jenny Odell"), ("Wintering", "Katherine May")],
    "stressed": [("Burnout", "Emily Nagoski and Amelia Nagoski"), ("Four Thousand Weeks", "Oliver Burkeman"), ("Essentialism", "Greg McKeown")],
    "nostalgic": [("The Remains of the Day", "Kazuo Ishiguro"), ("A Tree Grows in Brooklyn", "Betty Smith"), ("The Ocean at the End of the Lane", "Neil Gaiman")],
    "motivated": [("Can't Hurt Me", "David Goggins"), ("Mindset", "Carol S. Dweck"), ("Grit", "Angela Duckworth")],
    "hopeful": [("The Comfort Book", "Matt Haig"), ("Hope in the Dark", "Rebecca Solnit"), ("The Book of Hope", "Jane Goodall and Douglas Abrams")],
    "overwhelmed": [("Four Thousand Weeks", "Oliver Burkeman"), ("Essentialism", "Greg McKeown"), ("How to Keep House While Drowning", "KC Davis")],
}


def is_demo_mode() -> bool:
    raw_value = os.getenv("TEZFINAL_DEMO_MODE", "").strip().lower()
    if raw_value in {"1", "true", "yes", "on"}:
        return True
    if raw_value in {"0", "false", "no", "off"}:
        return False
    return not bool(os.getenv("GEMINI_API_KEY", "").strip())


def _normalize_language(language: str | None) -> str:
    return "tr" if (language or "").lower().startswith("tr") else "en"


def _looks_reasoned(text: str) -> bool:
    lowered = (text or "").lower()
    if any(marker in lowered for marker in REASON_MARKERS):
        return True
    return len([token for token in lowered.split() if token.strip()]) >= 12


def infer_emotion(text: str) -> str:
    lowered = (text or "").lower()
    best_emotion = "calm"
    best_score = 0

    for emotion, keywords in EMOTION_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in lowered)
        if score > best_score:
            best_emotion = emotion
            best_score = score

    return best_emotion


def infer_image_emotion(image_base64: str | None) -> str:
    normalized = (image_base64 or "").strip()
    if not normalized:
        return "calm"

    emotions = list(VALID_EMOTIONS)
    bucket = sum(normalized.encode("utf-8")[:256]) % len(emotions)
    return emotions[bucket]


def analyze_demo(
    text: str | None = None,
    image_base64: str | None = None,
    language: str = "en",
) -> dict:
    normalized_language = _normalize_language(language)
    cleaned_text = (text or "").strip()
    has_text = bool(cleaned_text)
    has_image = bool((image_base64 or "").strip())

    face_emotion = infer_image_emotion(image_base64) if has_image else None
    text_emotion = infer_emotion(cleaned_text) if has_text else None

    if has_text and has_image:
        emotion = text_emotion or face_emotion or "calm"
        confidence = 0.79
        explanation = (
            "Metin ve selfie birlikte degerlendirildi; son duygu metnin ve gorsel sinyalin ortak tonuna gore secildi."
            if normalized_language == "tr"
            else "Text and selfie were evaluated together; the final emotion was selected from their shared tone."
        )
    elif has_text:
        emotion = text_emotion or "calm"
        confidence = 0.76
        explanation = EMOTION_COPY.get(emotion, EMOTION_COPY["calm"])[normalized_language]
    else:
        emotion = face_emotion or "calm"
        confidence = 0.72
        explanation = (
            "Selfie odakli demo analizinde yuz sinyali tek basina yorumlandi."
            if normalized_language == "tr"
            else "In selfie-first demo analysis, the facial signal was interpreted on its own."
        )

    return {
        "emotion": emotion,
        "confidence": confidence,
        "explanation": explanation,
        "face_emotion": face_emotion,
        "face_confidence": 0.72 if has_image else None,
        "text_emotion": text_emotion if has_text else None,
        "text_confidence": 0.78 if has_text else None,
        "contradiction_detected": False,
        "clarification_message": "",
        "reason_provided": True,
        "needs_reason": False,
        "follow_up_question": "",
    }


def _build_music_items(emotion: str) -> list:
    items = []
    for title, artist in MUSIC_DATA.get(emotion, MUSIC_DATA["calm"]):
        items.append(
            {
                "title": title,
                "artist": artist,
                "image": None,
                "spotify_url": None,
                "reason": "Demo secimi: bu parca secilen ruh haline uygun bir tempo sunuyor.",
            }
        )
    return items


def _build_movie_items(emotion: str) -> list:
    items = []
    for title, overview in MOVIE_DATA.get(emotion, MOVIE_DATA["calm"]):
        items.append(
            {
                "title": title,
                "overview": overview,
                "poster": None,
                "rating": None,
                "release_date": "",
                "tmdb_url": None,
                "reason": "Demo secimi: bu film secilen duygu tonuna uygun goruluyor.",
            }
        )
    return items


def _build_book_items(emotion: str) -> list:
    items = []
    for title, author in BOOK_DATA.get(emotion, BOOK_DATA["calm"]):
        items.append(
            {
                "title": title,
                "authors": [author],
                "thumbnail": None,
                "link": None,
                "reason": "Demo secimi: bu kitap secilen ruh haliyle iyi eslesebilir.",
            }
        )
    return items


def _build_advice_items(emotion: str, language: str) -> list:
    normalized_language = _normalize_language(language)
    if normalized_language == "tr":
        return [
            {"title": "Ritmini yavaslat", "description": f"{emotion} tonundayken kisa bir mola vermek netlik kazandirabilir.", "icon": "🌿"},
            {"title": "Duyguyu adlandir", "description": "Bir iki cumleyle ne hissettigini yazmak yogunlugu azaltabilir.", "icon": "📝"},
            {"title": "Kucuk bir adim sec", "description": "Bugun uygulayabilecegin tek bir kolay adim belirle.", "icon": "✨"},
        ]

    return [
        {"title": "Slow the pace", "description": f"When the tone is {emotion}, a short pause can restore clarity.", "icon": "🌿"},
        {"title": "Name the feeling", "description": "Writing one or two sentences about it can reduce intensity.", "icon": "📝"},
        {"title": "Pick one small step", "description": "Choose a single easy action you can do today.", "icon": "✨"},
    ]


def get_demo_recommendations(emotion: str, language: str = "en") -> dict:
    normalized_emotion = normalize_emotion_key(emotion, "calm")
    if normalized_emotion not in MUSIC_DATA:
        normalized_emotion = "calm"

    return {
        "music": _build_music_items(normalized_emotion),
        "movies": _build_movie_items(normalized_emotion),
        "books": _build_book_items(normalized_emotion),
        "lifeAdvice": _build_advice_items(normalized_emotion, language),
    }

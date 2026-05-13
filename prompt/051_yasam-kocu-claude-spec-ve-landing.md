## Benim promptum

Build a full-stack Turkish AI Life Coach web app called "Yaşam Koçu" (AI Destekli Duygu Analizi).

Tech Stack: React + TypeScript (Vite), Tailwind CSS, Framer Motion, React Router, Anthropic Claude API (claude-sonnet-4-20250514).

Design System: dark red-brown theme, vivid red accents, glass cards, Syne headings, Inter body.

Landing Page: navbar, left hero copy, CTA buttons, guest/free/recommendation tabs, live flow widget with selfie/coach/text bubbles, central pulsing emotion circle, 3-step flow, examples list, example result card.

Analysis Studio: split layout with text input, optional selfie upload, detected emotion, recommendations, confidence score, and analysis button.

Claude API prompt: Türkçe yaşam koçu olarak duygu, yoğunluk, kısa açıklama ve müzik/film/kitap/aktivite önerilerini JSON formatında döndür.

Animations: staggered hero, pulsing bubble, hover lift/glow, smooth transitions, CTA shimmer.

Responsive: mobile-first, stacked columns, hamburger navbar.

File structure: components/Navbar, HeroSection, LiveFeedWidget, EmotionBubble, StepFlow, ResultCard; pages/Home, Analysis; api/claude; App; main.

## Senin yaptıkların

- Ana sayfa mevcut karmaşık poster override yapısından çıkarılarak component tabanlı yeni Yaşam Koçu landing düzenine taşındı.
- `HeroSection`, `LiveFeedWidget`, `EmotionBubble`, `StepFlow` ve `ResultCard` bileşenleri eklendi.
- Ana sayfa koyu kırmızı-kahverengi gradient, canlı kırmızı vurgu, cam kartlar, shimmer CTA ve pulse animasyonlarıyla yeniden kuruldu.
- Ana sayfa metni, CTA'lar, misafir/ücretsiz/öneri tabları, canlı akış widget'ı, duygu balonu, 3 adımlı akış ve örnek sonuç kartı spec'e göre düzenlendi.
- `client/src/api/claude.ts` eklendi; Claude çağrısının browser'dan değil backend proxy üzerinden yapılması sağlandı.
- AI service tarafına `claude_service.py` eklendi; `claude-sonnet-4-20250514` modeliyle Anthropic Messages API üzerinden Türkçe duygu analizi JSON'u normalize ediliyor.
- `gemini_service.py` Claude configured ise metin analizinde Claude'u kullanacak, hata/key yoksa Gemini'ye güvenli fallback yapacak şekilde güncellendi.
- Docker/env yapılandırmasına `AI_TEXT_PROVIDER`, `ANTHROPIC_API_KEY`, `CLAUDE_MODEL_NAME` ve `CLAUDE_STRICT` değişkenleri eklendi.

## Özet

Yaşam Koçu ana sayfası verilen landing spec'ine yaklaştırıldı ve Claude Sonnet duygu analizi backend tarafında güvenli, fallback'li bir sağlayıcı olarak projeye eklendi.

## Sana verecegim prompt

W2M-003 - Result Page Web Kanonu: Recommendation Explorer, Feedback ve Share Paritesi

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde W2M-001 ile navigation/auth/Home temeli, W2M-002 ile Analyze Studio web kanonu mobil karsiligi kuruldu. Simdi hedef `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\ResultPage.jsx` sayfasini mobilde birebir urun kapsamiyla yeniden hizalamaktir.

Bu promptta Result ekrani yalnizca duygu, confidence ve aciklama gosteren bir detay sayfasi olarak kalmayacak. Web ResultPage neyi yapiyorsa mobil de telefon ergonomisine uygun olarak ayni urun aklini tasiyacak:

- ResultHero
- emotion atmosphere
- confidence visualization
- insight panel
- warning/follow-up result state
- metadata grid
- recommendation explorer
- music/movie/book/advice tabs veya segmentleri
- recommendation media cards
- save/toggle state
- saved count
- external URL action
- feedback panel
- already submitted feedback state
- next step CTAs
- result share/download parity
- cold-start fallback
- web API response alias paritesi

## Mutlak Ilke

Web `ResultPage.jsx` kanondur. Mobilde "benzeri var" kabul edilmeyecek. Webde hangi bolum, state, CTA, recommendation alias, feedback davranisi ve share niyeti varsa mobilde de gercek karsiligi olacak.

Eski mobil Result ekrani eksikse koruma. Gerekirse yeniden duzenle.

## Referans Web Dosyalari

Once oku:

- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\ResultPage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\services\api.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\emotions.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\savedRecommendations.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\resultShareCard.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\tr.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\en.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\RecommendationsController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\FeedbackController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\DTOs\DTOs.cs`

## Mobilde Calisilacak Dosyalar

- `lib/features/result/presentation/result_screen.dart`
- `lib/features/result/presentation/providers/result_provider.dart`
- `lib/features/result/domain/recommendation_models.dart`
- `lib/features/result/domain/saved_recommendation.dart`
- `lib/features/result/presentation/providers/saved_recommendations_provider.dart`
- `lib/features/feedback/**`
- `lib/features/analyze/presentation/providers/analyze_provider.dart`
- `lib/core/router/app_router.dart`
- `lib/core/widgets/confidence_ring.dart`
- `lib/core/widgets/emotion_badge.dart`
- `lib/core/i18n/tr.dart`
- `lib/core/i18n/en.dart`
- `docs/web_to_mobile_parity_plan.md`

## Kapsam 1 - Result Parite Matrisi

`docs/web_to_mobile_parity_plan.md` dosyasina W2M-003 bolumu ekle.

Tablo alanlari:

- Result route data source
- Cold-start fallback
- ResultHero
- Emotion atmosphere
- Confidence visualization
- InsightPanel
- Warning panel
- Metadata grid
- RecommendationExplorer
- Music cards
- Movie cards
- Book cards
- Advice cards
- Save recommendation
- Saved count
- External URL action
- FeedbackPanel
- Already submitted feedback
- NextStepCtas
- Share/download
- Guest login-to-save state

Her satirda web kanonu, mobil mevcut, yapilan duzeltme ve sonraki prompta kalan yaz.

## Kapsam 2 - Result Data Source ve Fallback

Web kanonu:

- Analyze navigation state varsa result onu kullanir.
- Yoksa `GET /api/recommendations/{historyId}` ile detay tamamlanir.
- Gerekirse history fallback kullanilir.
- Recommendation aliaslari kaybolmaz.

Mobilde:

1. In-memory `analyzeProvider.result` varsa once onu kullan.
2. Yoksa `resultProvider` ile `GET /api/recommendations/{historyId}` dene.
3. Auth kullanicida history fallback destekle.
4. Hic veri yoksa guzel empty/error state goster.
5. Loading, success, empty, failure state ayrimlarini net yap.

## Kapsam 3 - ResultHero ve Emotion Atmosphere

Web ResultHero karsiligi:

- Emotion emoji/badge.
- Emotion label.
- Duygu rengine gore atmosfer.
- AI analysis completed copy.
- Confidence ring veya progress.
- Primary insight headline.

Mobilde:

- EmotionBadge ve ConfidenceRing kullan.
- Duyguya gore accent color kullan.
- Hero tasmasin; mobile compact ama etkili olsun.
- Web `emotions.js` label/color/emoji mantigiyla uyumlu kal.

## Kapsam 4 - InsightPanel, Warning ve Metadata

Mobil Result ekraninda:

- Explanation / coach comment bolumu.
- Warning varsa sakin ama gorunur panel.
- Metadata grid:
  - modalityUsed
  - modelUsed
  - responseTimeMs
  - faceDetected
  - historyId
  - confidence
- Teknik metinler uzun ise ellipsis/expand mantigi kullan.

## Kapsam 5 - Recommendation Explorer

Web kanonu:

- Recommendations music, movie/movies, book/books, advice/lifeAdvice aliaslariyla normalize edilir.
- Bolumler media-card mantigiyla gosterilir.
- Empty category varsa zarif bos state.

Mobilde:

1. Segmented tabs veya horizontal chips:
   - Music
   - Movies
   - Books
   - Advice
2. Her kategori kartlari:
   - title
   - artist/author/year/rating varsa
   - description/overview/reason
   - image/cover/poster varsa goster
   - source/type/category varsa kaybetme
3. External URL varsa icon/button.
4. URL acilamiyorsa temiz hata mesajı.
5. Kartlar overflow yapmayacak.

## Kapsam 6 - Save Recommendation ve Saved Count

Web savedRecommendations niyeti mobilde korunacak:

- Result recommendation item'inda save/toggle butonu.
- Saved state belirgin ikon/metin degisimi.
- Duplicate kayit engeli.
- Saved count result ekraninda gorunsun.
- Profile saved recommendations ile ayni local store kullanilsin.
- Source historyId tutulacak.

## Kapsam 7 - FeedbackPanel

Web feedback davranisi:

- `GET /api/feedback/{historyId}` mevcut feedback okur.
- Daha once feedback varsa ozet gosterir.
- Yoksa form gosterir.
- `POST /api/feedback/{historyId}` DTO:
  - overallRating
  - analysisAccuracyRating
  - recommendationQualityRating
  - helpful
  - wouldReuse
  - comment

Mobilde:

- Bottom sheet yerine Result icinde web panel karsiligi veya sheet + summary birlikte olabilir.
- 1-5 rating kontrolleri ergonomik.
- Helpful/wouldReuse switch.
- Comment multiline.
- Submit loading/error/success.
- Already submitted ise yeniden submit engellensin.
- Guest feedback destekleniyorsa guestSessionId korunur.

## Kapsam 8 - NextStepCtas

Web next step mantigi mobilde:

- New analysis -> `/analyze`
- History -> `/history`
- Profile/saved recommendations -> `/profile`
- Guest ise login-to-save -> `/login?from=/result/:historyId`
- Metrics admin shortcut gerekiyorsa Profile/Settings uzerinden kalabilir.

## Kapsam 9 - Share/Download Paritesi

Web `resultShareCard.js` niyeti mobilde en az ilk versiyonla karsilansin:

- Share result action.
- Text summary fallback.
- PNG share/export mevcut altyapi varsa kullan.
- Native share paketleri zaten projede varsa yeni paket ekleme.
- Share unsupported ise bilincli disabled/empty state degil, text fallback ver.

## Kapsam 10 - i18n

TR/EN yeni keyler:

- result hero copy
- insight panel
- metadata labels
- recommendation explorer labels
- recommendation empty states
- save/unsave/saved count
- external URL open/fail
- feedback panel labels
- already submitted copy
- next step CTA labels
- share/download result copy
- result fallback loading/error/empty copy

Hardcoded user-facing copy kalmayacak.

## Kapsam 11 - Dogrulama

Calistir:

- `flutter pub get`
- `flutter analyze`
- i18n key kontrolu
- mojibake taramasi

Opsiyonel:

- `flutter run -d emulator-5554 --no-resident`

## Kapsam 12 - Prompt Kaydi

Is tamamlaninca:

- `prompteray/W2M-003_tamamlandi_result-page-web-kanonu-recommendation-explorer-feedback-share-paritesi.md`

Sonraki promptu kaydet:

- `prompteray/W2M-004_history-page-web-kanonu-filter-timeline-detail-paritesi.md`

W2M-004 odagi:

- HistoryPage web kanonu.
- Auth-only history.
- Summary stats.
- Emotion filters.
- Timeline/list cards.
- Search/sort gerekiyorsa web karsiligi.
- Pagination, pull-to-refresh, load-more.
- Result detail navigation.
- Empty/error/loading parity.

## Kabul Kriterleri

1. Result route data source ve fallback web mantigiyla calisir.
2. ResultHero emotion atmosphere, badge ve confidence visualization tasir.
3. Explanation, warning ve metadata grid gorunur.
4. Recommendation explorer music/movie/book/advice kategorilerini gosterir.
5. Recommendation aliaslari kaybolmaz.
6. Media cards title, reason, image/url gibi alanlari kaybetmez.
7. Save/toggle recommendation calisir.
8. Saved count result ekraninda gorunur.
9. External URL action korunur.
10. Feedback GET/POST paneli backend DTO ile uyumludur.
11. Already submitted feedback state gorunur.
12. Next step CTAs web mantigiyla calisir.
13. Share/download en az text fallback ile calisir.
14. Guest login-to-save state vardir.
15. Tum yeni copy TR/EN i18n dosyalarindadir.
16. `flutter analyze` temizdir.
17. i18n key kontrolu temizdir.
18. mojibake taramasi temizdir.
19. W2M-003 tamamlandi kaydi yazilir.
20. W2M-004 master promptu kaydedilir.

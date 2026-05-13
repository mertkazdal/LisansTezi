## Sana verecegim prompt

W2M-004 - History Page Web Kanonu: Filter, Timeline, Detail ve Pagination Paritesi

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde W2M-001 navigation/auth/Home, W2M-002 Analyze Studio ve W2M-003 Result Page web kanonu mobil karsiliklari kuruldu. Simdi hedef `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\HistoryPage.jsx` sayfasini mobil uygulamaya birebir urun kapsamiyla aktarmaktir.

Bu promptta History ekrani yalnizca analiz listesi olmayacak. Web HistoryPage hangi bilgi mimarisini ve kullanici akisini tasiyorsa mobil de ayni urun mantigini tasiyacak:

- auth-only history state
- guest login/register CTA
- history summary stats
- emotion filters
- modality/face/average confidence sinyalleri
- timeline/list cards
- pagination
- pull-to-refresh
- load-more
- result detail navigation
- empty/loading/error/retry states
- web API response paritesi

## Mutlak Ilke

Web `HistoryPage.jsx` kanondur. Mobilde "liste var, yeter" kabul edilmeyecek. Webdeki summary, filter, card information density, auth/guest ayrimi ve detail navigation mobil ergonomisine uygun birebir karsilik bulacak.

## Referans Web Dosyalari

Once oku:

- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\HistoryPage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\services\api.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\emotions.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\store\authStore.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\tr.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\en.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\HistoryController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\DTOs\DTOs.cs`

## Mobilde Calisilacak Dosyalar

- `lib/features/history/presentation/history_screen.dart`
- `lib/features/history/presentation/providers/history_provider.dart`
- `lib/features/history/domain/history_models.dart`
- `lib/features/history/data/history_repository.dart`
- `lib/features/history/data/history_remote_source.dart`
- `lib/features/result/presentation/result_screen.dart`
- `lib/core/router/app_router.dart`
- `lib/core/widgets/emotion_badge.dart`
- `lib/core/i18n/tr.dart`
- `lib/core/i18n/en.dart`
- `docs/web_to_mobile_parity_plan.md`

## Kapsam 1 - History Parite Matrisi

`docs/web_to_mobile_parity_plan.md` dosyasina W2M-004 bolumu ekle.

Tablo alanlari:

- Auth-only state
- Guest CTA
- History data source
- Pagination
- Pull-to-refresh
- Load-more
- Summary stats
- Emotion filters
- Timeline/card layout
- Card metadata
- Result navigation
- Empty state
- Error/retry state
- Date/locale formatting

Her satirda web kanonu, mobil mevcut, yapilan duzeltme ve sonraki prompta kalan yaz.

## Kapsam 2 - Auth ve Guest State

Mobil History:

- Guest kullanici history endpointine zorlanmayacak.
- Guest state login/register CTA ile web copy mantiginda gorunecek.
- Login CTA `/login?from=/history` kullanacak.
- Register CTA `/register?from=/history` kullanacak.
- Auth restore loading state history ekraninda patlama yaratmayacak.

## Kapsam 3 - History Provider ve Pagination

Backend response:

- `items`
- `total`
- `page`
- `limit`
- `totalPages`

Provider state:

- initialLoading
- refreshing
- loadingMore
- success
- failure
- hasMore
- page tracking

Yapilacaklar:

- Pull-to-refresh temiz calissin.
- Sayfa sonuna yaklasinca load-more calissin.
- Duplicate item engellensin.
- Error retry state provider uzerinden calissin.

## Kapsam 4 - Summary Stats

Web HistoryPage summary mantigini mobilde kur:

- Loaded count
- Total count
- Top emotion
- Average confidence
- Multimodal count
- Face signal count
- Latest analysis date

Stats local loaded items uzerinden hesaplanabilir; backend total varsa total ile birlikte goster.

## Kapsam 5 - Emotion Filters

Mobilde:

- Horizontal chips veya segmented filter.
- All + emotion keys.
- Filter list output'u bozmayacak.
- Empty filtered state ayri copy verecek.
- Active emotion chip EmotionBadge/emoji ile uyumlu olacak.

## Kapsam 6 - Timeline/Card Layout

History card bilgileri:

- Emotion badge + emoji.
- Confidence percent.
- Created date.
- Modality.
- Face detected.
- Model used kisa.
- Explanation snippet.
- User text snippet varsa.
- Response time varsa.

Kart tap:

- `/result/:historyId` route'una gider.
- Result fallback W2M-003 ile calisir.

## Kapsam 7 - Empty/Error/Loading

- Initial loading premium loading.
- Empty history -> Analyze CTA.
- Filter empty -> filter clear CTA.
- Error -> Retry CTA.
- Loading more -> footer loading.
- Pull refresh state UI'i bozmayacak.

## Kapsam 8 - i18n

TR/EN yeni keyler:

- history hero copy
- guest auth required copy
- summary stat labels
- filter labels
- card labels
- empty/filter-empty/error/retry/load-more/loading copy
- view result CTA

Hardcoded user-facing copy kalmayacak.

## Kapsam 9 - Dogrulama

Calistir:

- `flutter pub get`
- `flutter analyze`
- i18n key kontrolu
- mojibake taramasi

Opsiyonel:

- `flutter run -d emulator-5554 --no-resident`

## Kapsam 10 - Prompt Kaydi

Is tamamlaninca:

- `prompteray/W2M-004_tamamlandi_history-page-web-kanonu-filter-timeline-detail-paritesi.md`

Sonraki promptu kaydet:

- `prompteray/W2M-005_profile-page-web-kanonu-account-saved-settings-paritesi.md`

W2M-005 odagi:

- ProfilePage web kanonu.
- Profile stats.
- Saved recommendations image-aware list.
- Language/theme/account state.
- Logout/delete account.
- Admin shortcut.
- Settings uyumu.

## Kabul Kriterleri

1. Guest kullanici history ekraninda login/register CTA gorur.
2. Auth kullanici paginated history listesini gorebilir.
3. Pull-to-refresh calisir.
4. Load-more state'i calisir.
5. Summary stats gorunur.
6. Emotion filter calisir.
7. Filter empty state vardir.
8. History card emotion, confidence, date, modality, faceDetected, explanation ve userText snippet gosterir.
9. Card tap `/result/:historyId` acilir.
10. Error/retry state calisir.
11. Empty history Analyze CTA verir.
12. Tum yeni copy TR/EN i18n dosyalarindadir.
13. `flutter analyze` temizdir.
14. i18n key kontrolu temizdir.
15. mojibake taramasi temizdir.
16. W2M-004 tamamlandi kaydi yazilir.
17. W2M-005 master promptu kaydedilir.

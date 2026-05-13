# W2M-006 - Metrics Page Web Kanonu: Admin Dashboard, Research, Comparison ve Chart Paritesi

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde W2M-001 navigation/auth/Home, W2M-002 Analyze Studio, W2M-003 Result Page, W2M-004 History Page ve W2M-005 Profile Page web kanonu mobil karsiliklari kuruldu. Simdi hedef `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\MetricsPage.jsx` ve metrics chart bolumlerini mobil uygulamaya birebir urun kapsamiyla aktarmaktir.

Bu promptta Metrics ekrani sadece birkac KPI gosteren admin sayfasi olmayacak. Web MetricsPage hangi admin-only gate, dashboard KPI, research/comparison, response time, emotion distribution, admin overview, empty/loading/error/retry davranisini tasiyorsa mobil de ayni urun aklini telefon ergonomisine uygun sekilde tasiyacak.

## Mutlak Ilke

Web MetricsPage.jsx kanondur. Mobilde "yetkisiz mesaj var, yeter" kabul edilmeyecek. Admin olmayan, guest, auth non-admin, admin success, empty, error ve retry state'lerinin tam karsiligi olacak. Endpoint ve response parse tarafinda veri kaybi olmayacak.

## Referans Web Dosyalari

Once oku:

- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\MetricsPage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\components\metrics\MetricsChartsSection.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\services\api.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\store\authStore.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\emotions.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\tr.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\en.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\MetricsController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\AdminController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\DTOs\DTOs.cs`

## Mobilde Calisilacak Dosyalar

- `lib/features/metrics/presentation/metrics_screen.dart`
- `lib/features/metrics/presentation/providers/metrics_provider.dart`
- `lib/features/metrics/domain/metrics_models.dart`
- `lib/features/metrics/data/metrics_repository.dart`
- `lib/features/metrics/data/metrics_remote_source.dart`
- `lib/features/profile/presentation/profile_screen.dart`
- `lib/core/router/app_router.dart`
- `lib/core/widgets/*`
- `lib/core/i18n/tr.dart`
- `lib/core/i18n/en.dart`
- `docs/web_to_mobile_parity_plan.md`

## Kapsam 1 - Metrics Parite Matrisi

`docs/web_to_mobile_parity_plan.md` dosyasina W2M-006 bolumu ekle.

Tablo alanlari:

- Guest gate
- Auth non-admin gate
- Admin data source
- Dashboard KPI grid
- Emotion distribution
- Response times
- Research section
- Comparison section
- Admin overview
- Recent analyses/raw data
- Unauthorized/forbidden handling
- Empty/loading/error/retry states
- Chart/list fallback

Her satirda web kanonu, mobil mevcut, yapilan duzeltme ve sonraki prompta kalan yaz.

## Kapsam 2 - Admin Gate

Mobil Metrics:

- Guest/not logged in -> login CTA `/login?from=/metrics`.
- Auth ama admin degil -> admin required state, teknik 403 stack yok.
- Admin -> endpointler yuklenir.
- Auth restore loading state net gorunur.

## Kapsam 3 - Endpoint Paritesi

Web api.js ile ayni endpointler desteklenecek:

- `GET /api/metrics/dashboard`
- `GET /api/metrics/research`
- `GET /api/metrics/comparison`
- `GET /api/metrics/response-times`
- `GET /api/metrics/emotion-distribution`
- `GET /api/admin/overview`

401/403 durumlari provider state'inde `unauthorized` / `forbidden` olarak ayrilacak.

## Kapsam 4 - Metrics Model ve Raw-safe Parse

Dashboard model:

- totalAnalyses
- registeredAnalyses
- guestAnalyses
- totalUsers
- averageConfidence
- averageResponseTime
- recommendationCoverage
- feedbackResponses
- averageRating

Research/comparison/response-times/emotion-distribution/admin-overview modelleri raw-safe parse edilecek. Veri karmasiksa nested map/list kaybolmadan okunabilir key-value bolumlerine aktarilacak.

## Kapsam 5 - Dashboard UI

Mobil admin dashboard:

- Hero/admin eyebrow.
- KPI grid.
- Emotion distribution chart/list.
- Response time trend/list.
- Recommendation coverage.
- Feedback quality.
- Retry/refresh action.

`fl_chart` kullan; chartlar tasmasin. Chart verisi yoksa list fallback goster.

## Kapsam 6 - Research, Comparison ve Admin Overview

Webdeki research/comparison panellerinin mobil karsiligi:

- Section headers.
- Raw-safe key-value cards.
- Nested map/list okunabilir format.
- Empty state.
- Long keys/values overflow yapmasin.

Admin overview:

- Summary.
- Top emotions.
- Model distribution.
- Recommendation coverage.
- Face detection.
- CSV export mobilde disabled note olarak kalacak.

## Kapsam 7 - Loading/Error/Empty

- Premium loading.
- Unauthorized login CTA.
- Forbidden admin required copy.
- Empty dashboard copy.
- Error retry.
- Refresh action.
- Backend teknik mesaj direkt basilmadan ApiException/i18n temiz mesaj.

## Kapsam 8 - i18n

TR/EN yeni keyler:

- metrics hero/admin copy
- metrics guest login CTA
- metrics forbidden/admin required copy
- KPI labels
- chart labels
- research/comparison/admin overview section labels
- raw data empty/error/retry labels
- CSV disabled note

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

- `prompteray/W2M-006_tamamlandi_metrics-page-web-kanonu-admin-dashboard-research-chart-paritesi.md`

Sonraki promptu kaydet:

- `prompteray/W2M-007_global-i18n-copy-theme-motion-accessibility-web-kanonu.md`

W2M-007 odagi:

- Tum sayfalarda i18n/copy parity.
- Theme/light-dark kontrast.
- Motion consistency.
- Accessibility labels.
- Empty/error/loading state standardizasyonu.
- Bottom nav/global shell son tur.

## Kabul Kriterleri

1. Guest metrics ekraninda login CTA gorur.
2. Auth non-admin kullanici admin required state gorur.
3. Admin kullanici dashboard endpointlerinden veri cekebilir.
4. Metrics provider unauthorized/forbidden/failure/empty/success state'lerini ayirir.
5. Dashboard KPI grid web kapsamindaki ana metrikleri gosterir.
6. Emotion distribution chart/list gorunur.
7. Response time chart/list gorunur.
8. Research raw-safe section gorunur.
9. Comparison raw-safe section gorunur.
10. Admin overview raw-safe section gorunur.
11. Retry/refresh calisir.
12. Chart/list UI tasmaz.
13. Tum yeni copy TR/EN i18n dosyalarindadir.
14. `flutter pub get` basarilidir.
15. `flutter analyze` No issues found verir.
16. i18n key kontrolu temizdir.
17. Mojibake taramasi temizdir.
18. W2M-006 tamamlandi kaydi yazilir.
19. W2M-007 master promptu kaydedilir.

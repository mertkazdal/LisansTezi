## Sana verecegim prompt

M005 - Ayarlar, Metrikler, QA ve Mobil Sertlestirme promptu tamamlandi.

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M001-M004 ile kurulan mobil deneyimin sertlestirme katmani tamamlandi: settings ekrani gercek tema/dil merkezi oldu, admin metrics ekrani backend endpointleriyle baglandi, ortak empty/error/stat widgetlari eklendi, API base URL platform ve `--dart-define` mantigi netlestirildi, Android/iOS demo ayarlari kontrol edildi ve mobil README demo calistirma notlariyla guncellendi.

## Amac

Mobil uygulamayi tez demosuna daha stabil, tutarli ve gezilebilir hale getirmek:

- Tema modu settings ekranindan degistirilebilir ve `PreferencesService` ile kalici.
- Dil secimi settings ekranindan TR/EN olarak degistirilebilir ve uygulama locale'i aninda guncellenir.
- Settings ekraninda app version, backend base URL, backend modu ve platform bilgisi gorunur.
- Metrics ekrani auth/admin durumunu ayirt eder.
- Admin metrics ekraninda dashboard, emotion distribution, response time, research, comparison ve admin overview verileri gosterilir.
- Admin olmayan veya login olmayan kullaniciya net yetki/giris mesaji verilir.
- Ortak `EmptyState`, `ErrorState`, `SectionHeader`, `StatTile` widgetlari eklendi ve birden fazla ekranda kullanildi.
- API base URL Android emulator, iOS/web/desktop ve fiziksel cihaz senaryolari icin sertlestirildi.
- Android/iOS app label, kamera/galeri/internet izinleri ve cleartext HTTP demo notlari kontrol edildi.
- README mobil calistirma, backend, dart-define ve QA checklist ile guncellendi.

## Kapsam

- `core/constants/api_constants.dart`
  - `API_BASE_URL` icin `--dart-define` destegi eklendi.
  - Android emulator icin `http://10.0.2.2:5000`, iOS/web/desktop icin `http://localhost:5000` davranisi tek yerde toplandi.
- `core/network/dio_client.dart`
  - Dio base URL secimi `ApiConstants.currentBaseUrl` uzerinden yapildi.
- `features/settings/presentation/settings_screen.dart`
  - Tema modu segmented control ile sistem/acik/koyu olarak calisir hale getirildi.
  - Dil secimi TR/EN olarak calisir hale getirildi.
  - Demo debug bilgileri, profile, metrics ve logout/login kisayollari eklendi.
- `features/metrics/domain/metrics_models.dart`
  - `MetricsBundle`, `MetricsDashboard`, `EmotionDistributionPoint`, `ResponseTimeSummary`, `ResponseTimeSample` guvenli parse modelleri eklendi.
- `features/metrics/data/metrics_remote_source.dart`
  - `/api/metrics/dashboard`, `/api/metrics/research`, `/api/metrics/comparison`, `/api/metrics/response-times`, `/api/metrics/emotion-distribution`, `/api/admin/overview` desteklendi.
- `features/metrics/data/metrics_repository.dart`
  - Dashboard ana endpointi zorunlu, diger metrics endpointleri raw-safe fallback ile komponize edildi.
- `features/metrics/presentation/providers/metrics_provider.dart`
  - `idle`, `loading`, `success`, `failure`, `unauthorized` durumlari olan manuel state notifier eklendi.
- `features/metrics/presentation/metrics_screen.dart`
  - Admin dashboard UI, summary stat tile'lari, pie chart, response-time bar chart, raw key-value metrik kartlari, unauthorized/login/error/empty/retry state'leri eklendi.
- `core/widgets/empty_state.dart`
- `core/widgets/error_state.dart`
- `core/widgets/section_header.dart`
- `core/widgets/stat_tile.dart`
  - Tekrar eden state ve dashboard UI desenleri ortaklastirildi.
- `features/history/presentation/history_screen.dart`
- `features/profile/presentation/profile_screen.dart`
  - Empty/error state desenleri ortak widgetlara tasindi.
- `core/i18n/tr.dart`
- `core/i18n/en.dart`
  - Settings, metrics, empty/error/debug ve dashboard metinleri TR/EN eklendi.
- `android/app/src/main/AndroidManifest.xml`
  - Android app label `MoodLens` yapildi.
  - Internet/kamera/galeri izinleri ve cleartext HTTP demo ayari korundu.
- `ios/Runner/Info.plist`
  - iOS display name ve bundle name `MoodLens` yapildi.
  - Kamera/foto kutuphanesi izin aciklamalari korundu.
- `README.md`
  - Backend, mobil run, `--dart-define=API_BASE_URL`, demo notlari ve QA checklist eklendi.

## Kabul kriterleri

1. `flutter pub get` basariyla tamamlandi.
2. `flutter analyze` `No issues found!` verdi.
3. Settings ekraninda tema modu degistirme ve kalicilik altyapisi calisir durumda.
4. Settings ekraninda dil degistirme ve anlik locale guncelleme calisir durumda.
5. Settings ekraninda app version, backend base URL, backend modu ve platform gorunur.
6. Metrics provider backend metrics/admin endpointlerine bagli state yonetimi yapiyor.
7. Yetkisiz veya login olmayan kullanici metrics ekraninda net mesaj gorur.
8. Admin kullanici icin dashboard summary, emotion distribution chart/list ve response-time chart/list hazir.
9. Ortak empty/error/loading desenleri history, profile ve metrics ekranlarinda kullaniliyor.
10. API base URL platform mantigi ve opsiyonel `--dart-define` destegi netlesti.
11. Android/iOS izinleri ve app label kontrol edildi.
12. README mobil calistirma ve emulator notlariyla guncellendi.
13. i18n key kontrolunde TR/EN eksik key bulunmadi.
14. Bozuk encoding taramasinda sorun bulunmadi.
15. `flutter devices` Windows, Chrome ve Edge cihazlarini gosterdi.
16. Android emulator bulunmadigi icin cihaz smoke testi yapilmadi; `flutter emulators` AVD kaynagi bulamadi.

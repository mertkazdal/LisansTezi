## Sana verecegim prompt

M005 - Ayarlar, Metrikler, QA ve Mobil Sertlestirme

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M001-M004 ile kurulan mobil urun deneyimini tamamlayici sertlestirme adimina gec. Bu adimda ayarlar ekranini gercek calisir hale getir, admin/metrik ekranini backend endpointleriyle bagla, genel hata/empty/loading durumlarini standardize et, Android/iOS platform ayarlarini gozden gecir, cihaz/emulator testine hazirlik yap ve mobil uygulamayi tez demosunda guvenle gezilebilir hale getir.

Bu promptun hedefi yeni buyuk bir feature eklemekten cok mevcut mobil uygulamayi urun kalitesine yaklastirmaktir: dil/tema ayarlari kalici calissin, metrics ekranlari admin icin veri gostersin, kritik akislarda retry/empty/error desenleri tutarli olsun, navigasyon deneyimi cilalansin, platform izinleri ve backend URL ayarlari demo ortaminda sorun cikarmayacak sekilde kontrol edilsin.

## Amac

Mobil uygulamayi demo ve gelistirme icin daha stabil, tutarli ve sunulabilir hale getirmek:

- Settings ekraninda tema ve dil gercekten degistirilebilsin ve kalici olsun.
- Metrics ekraninda backend metrics/admin endpointlerinden gelen veri gosterilsin.
- Admin olmayan kullanici metrics ekraninda yetki/erisim mesajini net gorsun.
- Ortak loading/error/empty desenleri tekrar kullanilabilir widgetlara tasinsin.
- Backend base URL ve platform farklari demo icin daha kolay yonetilsin.
- Android/iOS izinleri, app label, cleartext/http ayarlari ve kamera/galeri gereksinimleri kontrol edilsin.
- Uygulama emulator/cihaz varsa calistirilip smoke test yapilsin; yoksa eksikler raporlansin.
- M001-M004 boyunca olusan mobil kodda mimari, i18n, UI ve analyzer borclari kapatilsin.

## Kapsam

### 1. Settings ekranini gercek ayar merkezine cevir

Dosyalar:

- `features/settings/presentation/settings_screen.dart`
- `features/settings/presentation/providers/settings_provider.dart`
- `shared/providers/locale_provider.dart`
- `core/storage/preferences_service.dart`
- `core/i18n/tr.dart`
- `core/i18n/en.dart`

Yapilacaklar:

- Tema modu secimi ekle:
  - Sistem
  - Acik tema
  - Koyu tema
- Dil secimi ekle:
  - Turkce
  - English
- Degisiklikler `PreferencesService` ile kalici olsun.
- `MoodLensApp` locale/theme providerlarini zaten dinliyor; settings degisikligi uygulamaya aninda yansisin.
- Settings ekraninda app version, backend base URL ve demo durumu gibi debug faydali bilgiler gosterilsin.
- Logout/profile kisayolu mantikli yerde sunulsun.
- Tum metinler i18n dosyalarindan gelsin.

### 2. Metrics domain/data/provider katmanini guclendir

Dosyalar:

- `features/metrics/domain/metrics_models.dart`
- `features/metrics/data/metrics_remote_source.dart`
- `features/metrics/data/metrics_repository.dart`
- `features/metrics/presentation/providers/metrics_provider.dart`
- `features/metrics/presentation/metrics_screen.dart`

Backend referanslari:

- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\MetricsController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\AdminController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\services\api.js`

Yapilacaklar:

- Metrics dashboard response'unu guvenli parse et.
- Research/comparison/response-times/emotion-distribution endpointlerinden minimum kullanisli veri cek.
- Admin overview gerekiyorsa ayri model veya raw-safe parse ekle.
- Admin olmayan/401/403 durumunda uygulama patlamasin; yetki mesaji goster.
- Metrics provider state'i loading/success/error ayrimi yapsin.
- Retry destegi olsun.

### 3. Metrics ekranini gercek dashboard yap

UI/UX:

- `AnimatedGradientBackground`, `GlassmorphismCard`, `AnimatedLoading`, `EmotionBadge` ve `fl_chart` kullan.
- Ustte ozet kartlari:
  - Toplam analiz
  - Toplam kullanici
  - Ortalama confidence
  - Ortalama response time
- Emotion distribution icin basit bar/pie chart kullan.
- Response time icin kucuk trend veya liste goster.
- Research/comparison verileri raw geldiyse okunabilir key-value kartlarina dok.
- Admin olmayan kullaniciya net yetki mesaji ve profile/login CTA goster.
- Empty/error durumlari guzel gorunsun.

### 4. Ortak state widgetlari ekle

Yeni veya mevcut dosyalar:

- `core/widgets/empty_state.dart`
- `core/widgets/error_state.dart`
- `core/widgets/section_header.dart`
- Gerekirse `core/widgets/stat_tile.dart`

Yapilacaklar:

- History, profile, result, metrics ve settings ekranlarinda tekrar eden empty/error basit desenlerini bu widgetlarla sadeleştir.
- Kart icinde kart kullanmamaya dikkat et.
- Icon, title, body, CTA opsiyonel olsun.
- Tum gorunen metinler parent tarafindan i18n ile verilsin.

### 5. Backend URL ve platform ayarlarini sertlestir

Dosyalar:

- `core/constants/api_constants.dart`
- `core/network/dio_client.dart`
- `android/app/src/main/AndroidManifest.xml`
- `ios/Runner/Info.plist`
- `README.md`

Yapilacaklar:

- Android emulator icin `10.0.2.2`, iOS simulator icin `localhost`, web/desktop icin `localhost` davranisini netlestir.
- Gerekirse `--dart-define=API_BASE_URL=...` destegi ekle.
- App label `MoodLens` olacak sekilde kontrol et.
- Kamera/galeri/internet izinleri mevcut mu dogrula.
- HTTP cleartext gereksinimini demo icin acikla; production icin HTTPS notu ekle.
- README mobil calistirma komutlarini guncelle.

### 6. Mobil smoke test ve QA checklist

Yapilacaklar:

- `flutter pub get`
- `flutter analyze`
- `flutter devices`
- Android emulator varsa:
  - backend docker servisleri calisiyor mu kontrol et
  - `flutter run -d <emulator>` ile uygulamayi ac
  - login/register
  - metin-only analiz
  - galeri/kamera izin akisi
  - history
  - result feedback
  - profile logout
- Emulator yoksa:
  - mevcut cihaz listesini raporla
  - Android Studio AVD kurulumu icin projeye not dusme gerekiyorsa README'ye ekle

### 7. i18n ve copy denetimi

Dosyalar:

- `core/i18n/tr.dart`
- `core/i18n/en.dart`

Yapilacaklar:

- Yeni settings/metrics/empty/error/debug/QA metinlerini ekle.
- `t('...')` ile kullanilan tum key'lerin TR/EN tarafinda mevcut oldugunu script/arama ile dogrula.
- Mobil UI'da bozuk encoding/metin kalmadigini kontrol et.

### 8. Kod kalitesi kurallari

- Her yeni Dart dosyasinin basinda `///` dokuman yorum blogu olsun.
- Import sirasi dart -> package -> relative olacak.
- Riverpod annotation kullanma; manuel provider kullan.
- Gereksiz paket ekleme; mevcut paketlerle coz.
- UI metinleri i18n disinda hardcoded kalmasin.
- `flutter analyze` sifir issue hedeflenecek.
- Fazla soyutlama yapma; ortak widgetlari sadece tekrar eden UI desenleri icin ekle.

## Kabul kriterleri

1. `flutter pub get` basariyla calisir.
2. `flutter analyze` `No issues found!` verir.
3. Settings ekraninda tema modu degisir ve kalici olur.
4. Settings ekraninda dil degisir ve uygulama locale'i aninda guncellenir.
5. Metrics ekraninda backend metrics endpointlerinden veri cekme state'i vardir.
6. Yetkisiz kullanici metrics ekraninda anlasilir yetki mesaji gorur.
7. Emotion distribution veya dashboard verisi chart/list olarak gosterilir.
8. Ortak empty/error/loading widgetlari en az iki ekranda kullanilir.
9. API base URL platform mantigi ve opsiyonel dart-define destegi netlesir.
10. Android/iOS izinleri ve app label kontrol edilir.
11. README mobil calistirma ve emulator notlariyla guncellenir.
12. `flutter devices` sonucu raporlanir; emulator varsa smoke test yapilir.
13. Tum yeni UI metinleri TR/EN i18n dosyalarinda bulunur.
14. Bozuk encoding/metin taramasi temizdir.
15. Proje tez demosu icin daha stabil ve gezilebilir hale gelir.

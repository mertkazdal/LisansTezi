## Sana verecegim prompt

M003 - Analiz Ekrani ve Gercek API Akisi

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M001 altyapisi ve M002 auth/onboarding akisi uzerine gercek duygu analizi deneyimini insa et. Web uygulamasindaki backend mimarisini birebir referans al: analiz endpointi, guest quota mantigi, multimodal payload yapisi, historyId ile sonuc akisi, oneriler ve hata/uyari formatlari mobilde ayni kontratla calismali.

Bu adimda amac sadece gorsel bir ekran yapmak degil; kullanicinin metin yazabildigi, galeriden gorsel secebildigi, kameradan fotograf almayi baslatabildigi, backend'e dogru JSON payload gonderebildigi, loading/error/guest quota/follow-up durumlarini yonetebildigi ve analiz sonucunu mobilde anlamli bir sonuc ekranina tasiyabildigi gercek bir urun akisi olusturmaktir.

## Amac

Mobil uygulamada ana analiz deneyimini calisir hale getirmek:

- Kullanici metin ile analiz baslatabilsin.
- Kullanici galeri veya kamera kaynakli fotografi base64 olarak analiz payload'ina ekleyebilsin.
- Metin + gorsel birlikte multimodal analiz olarak backend'e gidebilsin.
- Backend `POST /api/analyze` cevabi `AnalysisResult` modeline parse edilsin.
- `guestRemainingAnalyses`, `needsReason`, `followUpQuestion`, `warning`, `faceDetected`, `modalityUsed`, `modelUsed`, `responseTimeMs` alanlari UI'da dogru sekilde kullanilsin.
- Basarili analizden sonra sonuc ekrani acilsin ve analiz verisi kaybolmadan kullaniciya gosterilsin.
- Misafir kullanici kotasi bittiginde anlasilir bir auth/register yonlendirmesi sunulsun.

## Kapsam

### 1. Backend kontratini tekrar dogrula

Web projesinde su dosyalari referans al:

- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\AnalyzeController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\DTOs\DTOs.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\services\api.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\shared\emotion_contract.json`

Mobil payload ve response modelleri web ile uyumlu olsun:

- Request alanlari: `text`, `imageBase64`, `mimeType`, `guestSessionId`
- Response alanlari: `historyId`, `emotion`, `confidence`, `explanation`, `needsReason`, `reasonProvided`, `followUpQuestion`, `warning`, `modalityUsed`, `modelUsed`, `responseTimeMs`, `faceDetected`, `guestRemainingAnalyses`, recommendations alanlari

### 2. Analyze domain/data katmanini guclendir

Dosyalar:

- `features/analyze/domain/analysis_models.dart`
- `features/analyze/data/analyze_remote_source.dart`
- `features/analyze/data/analyze_repository.dart`
- `features/analyze/presentation/providers/analyze_provider.dart`

Yapilacaklar:

- `AnalysisResult` modelini backend response'unun tum alanlarini guvenli parse edecek hale getir.
- Recommendation alanlari response icinde geldiyse kaybolmasin; gerekiyorsa `RecommendationBundle` ile birlikte tutulabilsin.
- `AnalyzeRequest` payload'i null/empty alanlari temizlesin.
- `AnalyzeRepository` guest session id'yi request'e eklesin.
- `guestRemainingAnalyses` geldiyse `PreferencesService.setGuestRemainingAnalyses` ile local state guncellensin.
- `GUEST_QUOTA_EXCEEDED`, network, timeout ve validation hatalari `ApiException` uzerinden UI'a temiz mesaj olarak tasinsin.
- Provider state'i su durumlari ayirt edebilsin: idle, picking image, ready, loading, success, failure. Basit `AsyncValue` yetmezse manuel immutable state modeli ekle.

### 3. Image/camera secim servisi ekle

Dosyalar:

- `core/utils/image_encoding.dart` veya `features/analyze/data/image_input_service.dart`
- Gerekirse `shared/providers/image_picker_provider.dart`

Yapilacaklar:

- `image_picker` ile galeri secimi.
- `image_picker` ile kamera cekimi.
- Secilen dosyayi byte olarak oku, base64 encode et.
- MIME type belirle: jpg/jpeg/png/webp gibi uzantilari destekle.
- Maksimum dosya boyutunu `AppConstants.maxImageSizeBytes` ile kontrol et.
- Hata durumunda UI'a kullanici dostu mesaj don.
- Kamera/galeri izinleri reddedildiginde uygulama patlamasin.

### 4. Analyze ekranini gercek deneyime cevir

Dosya:

- `features/analyze/presentation/analyze_screen.dart`

UI/UX gereksinimleri:

- `AnimatedGradientBackground`, `GlassmorphismCard`, `PremiumButton`, `AnimatedLoading`, `EmotionBadge` kullan.
- Ekran kart icinde bogulmasin; ana deneyim rahat, mobil ergonomiye uygun ve tek elle kullanilabilir olsun.
- Metin girisi multiline olsun, max uzunluk mantikli olsun.
- Galeri ve kamera icin iki ayri ikonlu aksiyon olsun.
- Secilen gorsel thumbnail olarak gosterilsin; kaldirma butonu olsun.
- Metin bos ve gorsel yoksa analiz butonu disabled olsun.
- Loading halinde form kilitlensin ve premium loading gosterilsin.
- Offline durumda global banner zaten var; ayrica submit aninda net hata mesaji ver.
- Misafir kalan analiz sayisi gorunsun.
- Guest quota 0 ise analiz butonu yerine login/register yonlendirme CTA'i goster.
- Backend `needsReason == true` ve `followUpQuestion` donerse follow-up kutusu ac: kullanicidan ek aciklama iste ve ayni endpoint'e metinle tekrar analiz gonderecek akis kur.
- `warning` geldiyse sakin bir uyarı bandi olarak goster.

### 5. Result ekranini ilk gercek versiyona tasir

Dosyalar:

- `features/result/presentation/result_screen.dart`
- `features/result/presentation/providers/result_provider.dart`
- Gerekirse `features/analyze/presentation/providers/analyze_provider.dart`

Yapilacaklar:

- Analizden sonra `historyId` varsa `/result/:historyId` route'una git.
- Result ekraninda analiz provider'indan son sonucu okuyabil veya historyId ile recommendation endpointini kullanabil.
- En az su alanlari goster:
  - Duygu etiketi ve emoji
  - Confidence yuzdesi
  - Explanation
  - Modality used
  - Face detected bilgisi
  - Response time
  - Music/movie/book/advice onerileri geldiyse bolumler halinde ilk versiyonunu goster
- Result ekranindan tekrar analiz yap CTA'i ile `/` route'una donulebilsin.

### 6. i18n genislet

Dosyalar:

- `core/i18n/tr.dart`
- `core/i18n/en.dart`

Tum yeni gorunen metinler TR/EN dictionary'den gelsin:

- Analiz form basliklari
- Kamera/galeri metinleri
- Gorsel kaldirma
- Misafir kota metinleri
- Follow-up soru/cevap metinleri
- Hata/uyari/success mesajlari
- Result ekran bolum basliklari

### 7. Router ve state elde tutma

Dosya:

- `core/router/app_router.dart`

Yapilacaklar:

- `/result/:historyId` route'u korunacak.
- Analiz sonrasi sonuc verisini kaybetmemek icin provider state tasarimi yap.
- Uygulama cold start ile direkt `/result/:historyId` acilirsa graceful fallback olsun: history/recommendation endpointinden veri cek veya anlasilir bos durum goster.

### 8. Kod kalitesi kurallari

- Her yeni dosyanin basinda `///` dokuman yorum blogu olsun.
- Import sirasi dart -> package -> relative olacak.
- Riverpod annotation kullanma; manuel provider kullan.
- UI metinleri i18n disinda hardcoded kalmasin.
- Gereksiz yeni paket ekleme; mevcut paketler yetiyor.
- `flutter analyze` sifir issue hedeflenmeli.
- Büyük fonksiyonlari okunabilir parcalara bol ama gereksiz abstraction ekleme.

## Kabul kriterleri

1. `flutter pub get` basariyla calisir.
2. `flutter analyze` `No issues found!` verir.
3. Analyze ekraninda metin-only analiz backend'e dogru payload ile gider.
4. Galeri secimi ile image-only veya multimodal analiz backend'e dogru payload ile gider.
5. Kamera aksiyonu image picker kamera kaynagi ile calisir veya izin yoksa uygulama patlamadan mesaj verir.
6. Bos inputta analiz butonu disabled olur.
7. Loading, success, error, quota ve follow-up state'leri UI'da ayirt edilir.
8. Basarili analizde token varsa authenticated, token yoksa guest session header/payload mantigi korunur.
9. `guestRemainingAnalyses` local storage'a yazilir ve UI'da guncellenir.
10. `GUEST_QUOTA_EXCEEDED` durumunda kullanici login/register akisine yonlendirilir.
11. Result ekraninda emotion, confidence, explanation ve teknik metadata gosterilir.
12. Recommendations geldiyse music/movie/book/advice bolumleri ilk versiyon olarak gosterilir.
13. Tum yeni UI metinleri TR/EN i18n dosyalarinda bulunur.
14. Android emulator yoksa bile kod analyze seviyesinde temizdir; emulator varsa uygulama acilip analiz akisi manuel denenebilir.

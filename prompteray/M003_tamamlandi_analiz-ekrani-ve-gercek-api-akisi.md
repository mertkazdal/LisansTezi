## Sana verecegim prompt

M003 - Analiz Ekrani ve Gercek API Akisi promptu tamamlandi.

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M001 altyapisi ve M002 auth/onboarding akisi uzerine gercek duygu analizi deneyimi insa edildi. Mobil analiz akisi web backend kontratiyla uyumlu hale getirildi: metin, galeri, kamera, base64 image payload, guest session, guest quota, backend response parse, result route ve ilk recommendation gosterimi tamamlandi.

## Amac

Mobil uygulamada ana analiz deneyimini calisir hale getirmek:

- Kullanici metin-only analiz baslatabilir.
- Kullanici galeriden gorsel secip image-only veya multimodal analiz baslatabilir.
- Kullanici kamera aksiyonu ile fotograf secim/cekme akisini baslatabilir.
- Secilen gorsel base64 ve MIME type ile backend `POST /api/analyze` payload'ina eklenir.
- Basarili analiz response'u `AnalysisResult` modeline parse edilir.
- `guestRemainingAnalyses`, `needsReason`, `followUpQuestion`, `warning`, `faceDetected`, `modalityUsed`, `modelUsed`, `responseTimeMs` alanlari mobil state/UI tarafinda kullanilir.
- Basarili analizde `/result/:historyId` route'una gidilir.
- Result ekrani emotion, confidence, explanation, metadata ve recommendation bolumlerini gosterir.

## Kapsam

- `features/analyze/domain/analysis_models.dart`
  - `AnalyzeRequest`, `AnalysisImageInput`, `AnalysisResult` modelleri guclendirildi.
  - Response icindeki recommendations `RecommendationBundle` olarak tutuluyor.
- `features/analyze/data/image_input_service.dart`
  - `image_picker` ile galeri/kamera secimi, byte okuma, base64 encode, MIME type normalize ve dosya boyutu kontrolu eklendi.
- `features/analyze/data/analyze_repository.dart`
  - Guest session id request'e ekleniyor.
  - `guestRemainingAnalyses` local storage'a yaziliyor.
- `features/analyze/presentation/providers/analyze_provider.dart`
  - `idle`, `pickingImage`, `ready`, `loading`, `success`, `failure` state ayrimi eklendi.
  - Backend/API/image hatalari kullanici dostu i18n mesajlarina cevriliyor.
- `features/analyze/presentation/analyze_screen.dart`
  - Multiline metin girisi, galeri/kamera aksiyonlari, thumbnail preview, image remove, guest quota banner, quota CTA, follow-up karti, loading/error/success akisi eklendi.
- `features/result/domain/recommendation_models.dart`
  - Music/movie/book/advice modelleri ve guvenli parse iyilestirildi.
- `features/result/presentation/result_screen.dart`
  - Son analiz state'i veya cold-start history/recommendation fallback ile result gosterimi eklendi.
- `android/app/src/main/AndroidManifest.xml`
  - Internet, camera, image read izinleri ve HTTP backend icin cleartext traffic ayari eklendi.
- `ios/Runner/Info.plist`
  - Camera ve photo library usage description eklendi.
- `core/i18n/tr.dart` ve `core/i18n/en.dart`
  - Analiz, image input, quota, follow-up, result ve recommendation metinleri genisletildi.

## Kabul kriterleri

1. `flutter pub get` basariyla tamamlandi.
2. `flutter analyze` `No issues found!` verdi.
3. Metin-only analiz backend payload'i `text` + `guestSessionId` ile uyumlu.
4. Gorsel-only/multimodal analiz backend payload'i `imageBase64`, `mimeType`, `text`, `guestSessionId` ile uyumlu.
5. Kamera/galeri secimi uygulama patlatmadan hata mesajina dusuyor.
6. Bos inputta analiz butonu disabled.
7. Loading, success, error, quota ve follow-up UI state'leri ayrildi.
8. Guest quota local storage'a yaziliyor ve UI'da gorunuyor.
9. `GUEST_QUOTA_EXCEEDED` kullaniciya login/register akisi icin CTA ile sunuluyor.
10. Result ekraninda emotion, confidence, explanation, modality, model, face detected ve response time gosteriliyor.
11. Recommendations geldiyse music/movie/book/advice bolumleri ilk versiyon olarak gosteriliyor.
12. Yeni UI metinleri TR/EN i18n dosyalarindan geliyor.
13. Android emulator bagli olmadigi icin manuel cihaz testi yapilmadi; analyze seviyesinde temiz dogrulandi.

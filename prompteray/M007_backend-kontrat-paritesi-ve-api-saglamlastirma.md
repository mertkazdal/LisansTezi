## Sana verecegim prompt

M007 - Backend Kontrat Paritesi ve API Saglamlastirma

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M001-M006 ile kurulan mobil backend entegrasyonunu `C:\Users\erayu\Desktop\nihaitez\nihaitezweb` web projesindeki backend mimarisiyle birebir kontrat seviyesinde denetle ve eksik/parcali kalan her yeri tamamla. Bu adimda hedef yeni gorsel tasarim veya E2E demo testi degil; once mobil data/domain/provider katmaninin web client ve api-gateway controller kontratlariyla tam uyumlu oldugundan emin olmak.

Testlere hemen gecme. Once backend controller, DTO, web `client/src/services/api.js`, guest session, auth, headers, response normalizasyonlari ve hata kodlari uzerinden kontrat paritesini oturt. Gereken kod duzeltmelerini yap, sonra sadece statik dogrulama ve gerekiyorsa hafif API probe ile kontratin dogru baglandigini kanitla. Tam cihaz smoke/E2E test M009'a kalacak.

## Amac

Mobil uygulamanin backend tarafini web uygulamasindaki mimariye saglam sekilde oturtmak:

- Mobil API endpointleri web `api.js` ile ayni kaynaklara, ayni payload ve response beklentisiyle gitsin.
- Auth/register/login guest merge akisi web ile ayni kontratta calissin.
- Analyze payload/response, guest quota, follow-up, recommendations, warnings ve multimodal alanlari eksiksiz tasinsin.
- History, result fallback, recommendations, feedback, profile, account delete ve metrics endpointleri eksiksiz parse edilsin.
- Admin tarafinda sadece dashboard degil, gerekli admin overview/export kontratlari da mobilde bilincli ele alinsin.
- Hata formatlari `ApiException` uzerinden UI'a temiz, lokalize ve kullanici dostu tasinsin.
- Backend URL, guest header, language header ve auth header davranisi web mantigiyla uyumlu olsun.

## Kapsam

### 1. Backend kontratini dosya dosya tekrar oku

Referanslar:

- `nihaitezweb/api-gateway/Controllers/AuthController.cs`
- `nihaitezweb/api-gateway/Controllers/AnalyzeController.cs`
- `nihaitezweb/api-gateway/Controllers/HistoryController.cs`
- `nihaitezweb/api-gateway/Controllers/RecommendationsController.cs`
- `nihaitezweb/api-gateway/Controllers/FeedbackController.cs`
- `nihaitezweb/api-gateway/Controllers/UserController.cs`
- `nihaitezweb/api-gateway/Controllers/MetricsController.cs`
- `nihaitezweb/api-gateway/Controllers/AdminController.cs`
- `nihaitezweb/api-gateway/DTOs/DTOs.cs`
- `nihaitezweb/client/src/services/api.js`
- `nihaitezweb/shared/emotion_contract.json`

Mobil taraf:

- `core/constants/api_constants.dart`
- `core/network/dio_client.dart`
- `core/network/api_interceptor.dart`
- `core/network/api_exception.dart`
- `shared/providers/storage_provider.dart`
- `features/*/data/*remote_source.dart`
- `features/*/data/*repository.dart`
- `features/*/domain/*.dart`
- `features/*/presentation/providers/*.dart`

### 2. Endpoint parite matrisi olustur

Yeni dokuman:

- `docs/backend_contract_audit.md`

Icerik:

- Web endpoint listesi.
- Mobilde karsiligi olan remote source methodu.
- Payload alanlari.
- Response alanlari.
- Auth gerekli mi?
- Guest session gerekli mi?
- Eksik veya farkli davranis var mi?

Kontrol edilecek endpointler:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/analyze`
- `GET /api/history?page=&limit=`
- `GET /api/history/{id}`
- `GET /api/recommendations/{historyId}`
- `POST /api/feedback/{historyId}`
- `GET /api/feedback/{historyId}`
- `GET /api/user/profile`
- `DELETE /api/user/account`
- `GET /api/metrics/dashboard`
- `GET /api/metrics/research`
- `GET /api/metrics/comparison`
- `GET /api/metrics/response-times`
- `GET /api/metrics/emotion-distribution`
- `GET /api/admin/overview`
- `GET /api/admin/export/csv` icin mobilde bilincli destek veya bilincli kapsam disi notu

### 3. Auth ve guest session davranisini saglamlastir

Yapilacaklar:

- Login/register payload'larinda `guestSessionId` web ile ayni sekilde gonderiliyor mu kontrol et.
- Auth response icindeki `token`, `userId`, `username`, `email`, `role`, `isAdmin`, `guestDataMerged`, `migratedGuestAnalysesCount` eksiksiz parse edilsin.
- Login/register sonrasi guest session reset/merge davranisi web ile uyumlu olsun.
- Logout ve 401 durumunda secure storage temizligi deterministik olsun.
- `X-MoodLens-Language` ve `X-Guest-Session-Id` header davranisi web ile uyumlu olsun.
- Authenticated kullanicida guest header gonderilip gonderilmeyecegi backend beklentisine gore netlestirilsin.

### 4. Analyze/result/recommendation kontratini tamamla

Yapilacaklar:

- Request alanlari web ile ayni olsun:
  - `text`
  - `imageBase64`
  - `mimeType`
  - `guestSessionId`
- Response alanlari kaybolmasin:
  - `historyId`
  - `emotion`
  - `confidence`
  - `explanation`
  - `needsReason`
  - `reasonProvided`
  - `followUpQuestion`
  - `warning`
  - `modalityUsed`
  - `modelUsed`
  - `responseTimeMs`
  - `faceDetected`
  - `guestRemainingAnalyses`
  - `recommendations`
  - `feedback`
- Recommendation normalizasyonu web ile uyumlu olsun:
  - `music`
  - `movie`/`movies`
  - `book`/`books`
  - `advice`/`lifeAdvice`
- Turkish display polish webdeki gibi gerekiyorsa mobilde merkezi ve temiz bir cozumle ele alinsin; bozuk encoding uretme.

### 5. History, feedback, profile ve account kontratlarini tamamla

Yapilacaklar:

- History pagination response web ile uyumlu parse edilsin:
  - `items`
  - `total`
  - `page`
  - `limit`
  - `totalPages`
- History item alanlari eksiksiz:
  - `id`
  - `detectedEmotion`/`emotion`
  - `confidence`
  - `explanation`
  - `userText`
  - `createdAt`
  - `modalityUsed`
  - `modelUsed`
  - `responseTimeMs`
  - `faceDetected`
- Feedback request/response web DTO ile uyumlu olsun.
- Profile response backend DTO ile uyumlu olsun.
- Account delete confirmation text ve payload backend beklentisiyle birebir olsun.

### 6. Metrics/admin kontratini netlestir

Yapilacaklar:

- Metrics endpointleri admin-only oldugu icin 401/403 davranisi netlestirilsin.
- Dashboard, research, comparison, response-times, emotion-distribution parse'leri raw-safe ama kayipsiz olsun.
- `GET /api/admin/overview` mobilde desteklensin.
- `GET /api/admin/export/csv` mobilde indirilebilir olacaksa `url_launcher`/share yoksa bilincli kapsam disi olarak dokumante edilsin.
- Admin olmayan kullanici icin provider state ve UI mesajlari kontratla uyumlu olsun.

### 7. Hata, timeout ve offline davranisi

Yapilacaklar:

- `ApiInterceptor` web `buildAppError` davranisiyla uyumlu olacak sekilde backend `message`, `detail`, `error.message`, `code`, `status` alanlarini parse etsin.
- `GUEST_QUOTA_EXCEEDED` local quota state'i kesin 0 yapsin.
- Timeout, network, validation, unauthorized, forbidden ve unknown error mesajlari i18n ile temiz gelsin.
- Backend'den gelen teknik mesajlar kullaniciya gerekiyorsa lokalize map ile cevrilsin.

### 8. Kod kalitesi

- Her yeni Dart dosyasinin basinda `///` dokuman yorum blogu olsun.
- Import sirasi dart -> package -> relative.
- Riverpod annotation kullanma; manuel provider kullan.
- UI metinleri i18n disinda hardcoded kalmasin.
- Gereksiz paket ekleme.
- Buyuk refactor yapma; kontrat odakli net patch yap.

## Kabul kriterleri

1. `docs/backend_contract_audit.md` olusturulur.
2. Web `api.js` endpointleri ile mobil remote source endpointleri matriste eslestirilir.
3. Auth/login/register guest merge kontrati web ile uyumludur.
4. Analyze request/response kontrati web ve backend DTO ile uyumludur.
5. Recommendations parse'i kayipsizdir.
6. History pagination ve item parse'i web ile uyumludur.
7. Feedback get/post kontrati web ile uyumludur.
8. Profile/account delete kontrati backend DTO ile uyumludur.
9. Metrics/admin endpointleri admin-only state'leriyle dogru ele alinir.
10. `ApiException` backend hata formatlarini temiz parse eder.
11. Guest session, language ve auth header davranisi dokumante edilir.
12. `flutter pub get` basarili.
13. `flutter analyze` `No issues found!`.
14. i18n key kontrolu temiz.
15. Bozuk encoding taramasi temiz.
16. Tam cihaz E2E test bu promptun kapsami degildir; M009'a birakilir.

## Sana verecegim prompt

M004 - Gecmis, Feedback, Profil ve Hesap Deneyimi

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M001 temel altyapi, M002 auth/onboarding ve M003 gercek analiz akisi uzerine mobil uygulamanin ikinci ana urun katmanini tamamla: analiz gecmisi, sonuc detayina geri donus, feedback verme, profil verisi, hesap silme/logout, guest-auth gecisleri ve mobil navigasyon ergonomisi. Web uygulamasindaki backend controller ve client servisleri referans alinacak; mobil endpoint payload/response kontrati web ile uyumlu kalacak.

Bu adimda hedef sadece placeholder ekranlari doldurmak degil; kullanicinin yaptigi analizleri tekrar gorebildigi, sonuc detayina gidebildigi, onerileri inceleyebildigi, analiz kalitesi icin feedback verebildigi, profil bilgisini backend'den alabildigi ve hesap durumunu yonetebildigi gercek bir mobil deneyim olusturmaktir.

## Amac

Mobil uygulamanin analiz sonrasi devam deneyimini calisir hale getirmek:

- Kullanici analiz gecmisini sayfali olarak gorebilsin.
- Gecmis listesindeki her analiz duygu badge'i, confidence, tarih, modality ve kisa aciklama ile taranabilir olsun.
- Gecmis item'a tiklayinca `/result/:historyId` sonuc ekranina gitsin.
- Result ekraninda history fallback daha zengin olsun ve recommendation endpointiyle detay tamamlanabilsin.
- Kullanici result ekranindan analiz feedback'i verebilsin.
- Kullanici profil ekraninda backend profil verisini gorebilsin.
- Kullanici logout yapabilsin ve gerekirse hesap silme akisini guvenli confirmation ile baslatabilsin.
- Guest kullanici login/register oldugunda guest analizlerinin hesaba tasindigi mesaj kullaniciya dogru sekilde sunulsun.

## Kapsam

### 1. Backend kontratini tekrar oku

Referans dosyalar:

- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\HistoryController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\RecommendationsController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\FeedbackController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\UserController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\DTOs\DTOs.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\services\api.js`

Kontrol edilmesi gereken endpointler:

- `GET /api/history?page=&limit=`
- `GET /api/history/{id}`
- `GET /api/recommendations/{historyId}`
- `POST /api/feedback/{historyId}`
- `GET /api/feedback/{historyId}`
- `GET /api/user/profile`
- `DELETE /api/user/account`

### 2. History domain/data/provider katmanini guclendir

Dosyalar:

- `features/history/domain/history_models.dart`
- `features/history/data/history_remote_source.dart`
- `features/history/data/history_repository.dart`
- `features/history/presentation/providers/history_provider.dart`

Yapilacaklar:

- `PaginatedHistory` response parse'i backend ile birebir uyumlu olsun.
- `HistoryItem` modeline gerekli tum alanlar guvenli parse edilsin: id, detectedEmotion/emotion, confidence, explanation, userText, createdAt, modalityUsed, modelUsed, responseTimeMs, faceDetected.
- Sayfalama state'i manuel bir notifier ile yonetilsin: initialLoading, refreshing, loadingMore, success, failure.
- Pull-to-refresh ve load-more desteklensin.
- Empty state ve error retry state'i olsun.
- Guest/auth header davranisi mevcut Dio interceptor ile korunacak.

### 3. History ekranini gercek mobil listeye cevir

Dosya:

- `features/history/presentation/history_screen.dart`

UI/UX:

- `AnimatedGradientBackground`, `GlassmorphismCard`, `EmotionBadge`, `AnimatedLoading` kullan.
- Liste kartlari kompakt, taranabilir, mobil ergonomiye uygun olsun.
- Her kartta duygu, confidence yuzdesi, tarih, modality, faceDetected bilgisi ve aciklama snippet'i olsun.
- Kart tiklaninca `/result/:historyId` route'una gitsin.
- Ustte refresh aksiyonu veya pull-to-refresh olsun.
- Sayfa sonuna yaklasinca sonraki sayfa yuklensin.
- Gecmis yoksa kullaniciyi analiz ekranina yonlendiren CTA olsun.

### 4. Feedback domain/data/provider ekle

Yeni dosyalar:

- `features/feedback/domain/feedback_models.dart`
- `features/feedback/data/feedback_remote_source.dart`
- `features/feedback/data/feedback_repository.dart`
- `features/feedback/presentation/providers/feedback_provider.dart`
- Gerekirse `features/feedback/presentation/widgets/feedback_sheet.dart`

Yapilacaklar:

- `FeedbackRequest` backend DTO ile uyumlu olsun:
  - `overallRating`
  - `analysisAccuracyRating`
  - `recommendationQualityRating`
  - `helpful`
  - `wouldReuse`
  - `comment`
- `FeedbackResponse` guvenli parse edilsin.
- `POST /api/feedback/{historyId}` ve `GET /api/feedback/{historyId}` desteklensin.
- Feedback submit loading/success/error state'i olsun.
- Daha once feedback verildiyse result ekraninda mevcut feedback gosterilsin.

### 5. Result ekranini feedback ile zenginlestir

Dosya:

- `features/result/presentation/result_screen.dart`

Yapilacaklar:

- Result ekraninda `giveFeedback` CTA gercek calissin.
- Bottom sheet veya modal form acilsin.
- 1-5 rating kontrolleri icon/segmented/slider ile ergonomik olsun.
- Helpful ve wouldReuse icin switch/checkbox kullan.
- Comment opsiyonel multiline olsun.
- Submit sonrasi backend'e gonderilsin, basari mesaji gosterilsin.
- Feedback var ise yeniden submit yerine mevcut feedback ozeti gosterilsin veya guncelleme endpointi yoksa yeniden gonderme engellensin.

### 6. Profile domain/data/provider ve ekranini tamamla

Dosyalar:

- `features/profile/domain/profile_models.dart`
- `features/profile/data/profile_remote_source.dart`
- `features/profile/data/profile_repository.dart`
- `features/profile/presentation/providers/profile_provider.dart`
- `features/profile/presentation/profile_screen.dart`

Yapilacaklar:

- `GET /api/user/profile` response'u backend DTO ile uyumlu parse edilsin.
- Profil ekraninda username, email, role/admin bilgisi, toplam analiz, en sik duygu, createdAt, avatar placeholder gosterilsin.
- Guest kullaniciysa login/register CTA gosterilsin.
- Auth kullaniciysa logout, settings ve hesap silme aksiyonlari gorunsun.
- Hesap silme icin confirmation dialog:
  - Backend'in `deleteConfirmationText` alanini kullan.
  - Kullanici dogru metni yazmadan delete butonu aktif olmasin.
  - `DELETE /api/user/account` basarili olursa local auth storage temizlensin ve `/login` route'una gidilsin.

### 7. Guest-auth gecis mesajlarini iyilestir

Dosyalar:

- `features/auth/presentation/providers/auth_provider.dart`
- `features/auth/presentation/login_screen.dart`
- `features/auth/presentation/register_screen.dart`

Yapilacaklar:

- Auth response icindeki `guestDataMerged` ve `migratedGuestAnalysesCount` alanlari UI'da anlamli success mesajina cevrilsin.
- Misafir analizleri hesaba tasindiginda kullanici bunu net gorsun.
- Auth state bu bilgiyi result/profile/history ekranlarinda ihtiyac olursa okuyabilecek sekilde korusun.

### 8. i18n genislet

Dosyalar:

- `core/i18n/tr.dart`
- `core/i18n/en.dart`

Yeni tum metinleri TR/EN dictionary'e ekle:

- History empty/error/loading/refresh/loadMore metinleri
- Feedback form basliklari, rating etiketleri, helpful/wouldReuse/comment metinleri
- Profile field label'lari
- Account delete confirmation metinleri
- Guest merge success metinleri
- Retry, refresh, view result, no history, no feedback vb.

### 9. Kod kalitesi ve UI kurallari

- Her yeni Dart dosyasinin basinda `///` dokuman yorum blogu olsun.
- Import sirasi dart -> package -> relative olacak.
- Riverpod annotation kullanma; manuel provider kullan.
- UI metinleri i18n disinda hardcoded kalmasin.
- Mevcut tasarim dili korunacak: koyu premium tema, glassmorphism kartlar, net CTA'lar.
- Kart icinde kart kullanma; liste item kartlari tek seviye kalsin.
- Uzun metinler overflow yapmasin, maxLines/ellipsis kullan.
- `flutter analyze` sifir issue hedeflenecek.

## Kabul kriterleri

1. `flutter pub get` basariyla calisir.
2. `flutter analyze` `No issues found!` verir.
3. History ekrani backend `GET /api/history` ile sayfali veri cekebilir.
4. Pull-to-refresh ve load-more state'leri calisir.
5. History kartindan result detayina gidilir.
6. Result ekraninda history fallback ve recommendations detaylari calisir.
7. Feedback formu `POST /api/feedback/{historyId}` payload'i ile backend'e uyumludur.
8. Daha once verilmis feedback `GET /api/feedback/{historyId}` ile okunabilir.
9. Profile ekraninda authenticated kullanici backend profil verisini gorur.
10. Guest kullanici profile ekraninda login/register CTA gorur.
11. Logout secure storage'i temizler ve login akisina dondurur.
12. Account delete confirmation dogru metin girilmeden calismaz.
13. Account delete basarili olursa auth state temizlenir.
14. Guest data merge bilgisi login/register sonrasi kullaniciya gosterilir.
15. Tum yeni UI metinleri TR/EN i18n dosyalarindan gelir.
16. Android emulator yoksa bile analyze seviyesinde temiz dogrulama yapilir; emulator varsa history, feedback ve profile akislari manuel denenir.

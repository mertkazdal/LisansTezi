## Sana verecegim prompt

M004 - Gecmis, Feedback, Profil ve Hesap Deneyimi promptu tamamlandi.

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M001 temel altyapi, M002 auth/onboarding ve M003 gercek analiz akisi uzerine mobil uygulamanin ikinci ana urun katmani tamamlandi: analiz gecmisi, sonuc detayina geri donus, feedback verme, profil verisi, hesap silme/logout, guest-auth gecis mesajlari ve mobil navigasyon ergonomisi backend kontratiyla uyumlu hale getirildi.

## Amac

Mobil uygulamanin analiz sonrasi devam deneyimini calisir hale getirmek:

- Kullanici analiz gecmisini sayfali olarak gorebilir.
- Gecmis listesi pull-to-refresh ve load-more destekler.
- Gecmis kartindan `/result/:historyId` detayina gidilir.
- Result ekraninda history/recommendation fallback korunur ve feedback alani eklenir.
- Kullanici feedback bottom sheet ile analiz ve onerileri puanlayabilir.
- Daha once verilmis feedback okunur ve result ekraninda ozetlenir.
- Auth kullanici backend profil verisini gorebilir.
- Guest kullanici profil ekraninda login CTA gorur.
- Auth kullanici logout ve hesap silme akislarini kullanabilir.
- Guest analizleri hesaba tasindiginda login/register sonrasi kullaniciya mesaj verilir.

## Kapsam

- `features/history/domain/history_models.dart`
  - `HistoryItem`, `PaginatedHistory` ve guvenli parse katmani backend DTO ile uyumlu hale getirildi.
- `features/history/presentation/providers/history_provider.dart`
  - `idle`, `initialLoading`, `refreshing`, `loadingMore`, `success`, `failure` durumlari olan manuel pagination state eklendi.
- `features/history/presentation/history_screen.dart`
  - Gercek history listesi, refresh, load-more, auth required, empty, error ve retry state'leri eklendi.
- `features/feedback/domain/feedback_models.dart`
  - `FeedbackRequest` ve `FeedbackResponse` backend DTO ile uyumlu eklendi.
- `features/feedback/data/feedback_remote_source.dart`
  - `GET /api/feedback/{historyId}` ve `POST /api/feedback/{historyId}` desteklendi.
- `features/feedback/data/feedback_repository.dart`
  - Guest session query param ile feedback repository eklendi.
- `features/feedback/presentation/providers/feedback_provider.dart`
  - Feedback load/submit state yonetimi eklendi.
- `features/feedback/presentation/widgets/feedback_sheet.dart`
  - Rating, helpful, wouldReuse ve comment iceren bottom sheet formu eklendi.
- `features/result/presentation/result_screen.dart`
  - Feedback CTA, mevcut feedback ozeti ve feedback saved bildirimi eklendi.
- `features/profile/presentation/profile_screen.dart`
  - Backend profil verisi, guest CTA, logout, account delete confirmation ve delete success/error akisi eklendi.
- `features/auth/presentation/login_screen.dart`
- `features/auth/presentation/register_screen.dart`
  - `guestDataMerged` ve `migratedGuestAnalysesCount` bilgisi success mesajina cevrildi.
- `core/i18n/tr.dart` ve `core/i18n/en.dart`
  - History, feedback, profile, account delete, retry/refresh ve guest merge metinleri eklendi.

## Kabul kriterleri

1. `flutter pub get` basariyla tamamlandi.
2. `flutter analyze` `No issues found!` verdi.
3. History ekrani backend `GET /api/history?page=&limit=` ile uyumlu.
4. Pull-to-refresh ve load-more state'leri eklendi.
5. History kartindan result detayina gidiliyor.
6. Result ekraninda history fallback ve recommendations gosterimi korunuyor.
7. Feedback formu backend `POST /api/feedback/{historyId}` payload'i ile uyumlu.
8. Mevcut feedback backend `GET /api/feedback/{historyId}` ile okunuyor.
9. Profile ekraninda authenticated kullanici backend profil verisini goruyor.
10. Guest kullanici profile ekraninda login CTA goruyor.
11. Logout secure storage'i temizleyip login akisina donuyor.
12. Account delete confirmation dogru metin girilmeden aktif olmuyor.
13. Account delete basarili olursa auth state temizleniyor.
14. Guest data merge bilgisi login/register sonrasi kullaniciya gosteriliyor.
15. Tum yeni UI metinleri TR/EN i18n dosyalarindan geliyor.
16. Android emulator bagli olmadigi icin manuel cihaz testi yapilmadi; analyze seviyesinde temiz dogrulandi.

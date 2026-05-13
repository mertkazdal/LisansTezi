# W2M-005 - Profile Page Web Kanonu: Account, Saved Recommendations, Settings ve Admin Shortcut Paritesi

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde W2M-001 navigation/auth/Home, W2M-002 Analyze Studio, W2M-003 Result Page ve W2M-004 History Page web kanonu mobil karsiliklari kuruldu. Simdi hedef `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\ProfilePage.jsx` sayfasini mobil uygulamaya birebir urun kapsami ile aktarmaktir.

Bu promptta Profile ekrani yalnizca username/email gosteren bir hesap sayfasi olmayacak. Web ProfilePage hangi hesap, kayitli oneriler, dil/tema, admin shortcut, logout ve hesap silme aklini tasiyorsa mobil de ayni urun davranisini telefon ergonomisine uygun sekilde tasiyacak.

## Mutlak Ilke

Web ProfilePage.jsx kanondur. Mobilde "benzeri var" kabul edilmeyecek.

Webde guest profile, auth profile, saved recommendations, language preference, account stats, admin shortcut, logout ve delete account davranisi nasil tasarlaniyorsa mobilde de gercek karsiligi olacak. Eski mobil profile ekrani eksikse koruma; gerekirse yeniden duzenle.

## Referans Web Dosyalari

Once oku:

- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\ProfilePage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\services\api.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\store\authStore.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\savedRecommendations.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\emotions.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\tr.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\en.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\Controllers\UserController.cs`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway\DTOs\DTOs.cs`

## Mobilde Calisilacak Dosyalar

- `lib/features/profile/presentation/profile_screen.dart`
- `lib/features/profile/presentation/providers/profile_provider.dart`
- `lib/features/profile/domain/profile_models.dart`
- `lib/features/profile/data/profile_repository.dart`
- `lib/features/profile/data/profile_remote_source.dart`
- `lib/features/result/domain/saved_recommendation.dart`
- `lib/features/result/presentation/providers/saved_recommendations_provider.dart`
- `lib/features/settings/presentation/settings_screen.dart`
- `lib/features/settings/presentation/providers/settings_provider.dart`
- `lib/shared/providers/locale_provider.dart`
- `lib/core/router/app_router.dart`
- `lib/core/i18n/tr.dart`
- `lib/core/i18n/en.dart`
- `docs/web_to_mobile_parity_plan.md`

## Kapsam 1 - Profile Parite Matrisi

`docs/web_to_mobile_parity_plan.md` dosyasina W2M-005 bolumu ekle.

Tablo alanlari:

- Guest profile state
- Auth profile data source
- Profile hero/account card
- Profile stats
- Language preference
- Theme/settings shortcut
- Saved recommendations source
- Saved recommendations filters
- Saved recommendation cards
- Remove/clear saved recommendations
- Source result navigation
- External URL action
- Admin shortcut
- Logout
- Account delete confirmation
- Account delete backend payload
- Empty/loading/error states

Her satirda web kanonu, mobil mevcut, yapilan duzeltme ve sonraki prompta kalan yaz.

## Kapsam 2 - Guest Profile State

Web kanonu:

- Guest kullanici profile ekraninda hesabinin olmadigini net gorur.
- Login/register CTA vardir.
- Guest analizlerin hesap acilinca tasinabilecegi anlatilir.

Mobilde:

- Guest profile backend profile endpointine zorlanmayacak.
- Login CTA `/login?from=/profile`.
- Register CTA `/register?from=/profile`.
- Guest quota ve guest migration copy gorunur.
- Analyze CTA opsiyonel olarak korunabilir ama ana CTA login/register olacak.

## Kapsam 3 - Auth Profile Data ve Hero

Backend `GET /api/user/profile` response alanlari kayipsiz parse edilecek:

- id
- username
- email
- role
- isAdmin
- createdAt
- totalAnalyses
- mostFrequentEmotion
- feedbackCount veya backendde varsa benzer alanlar

Mobil Profile hero:

- Avatar placeholder.
- Username.
- Email.
- Role/admin badge.
- CreatedAt.
- Account mode copy.
- Pull-to-refresh veya refresh action.

Loading, success, empty ve failure state'leri ayrilacak.

## Kapsam 4 - Profile Stats

Web ProfilePage hesap ozetini mobilde kart/grid olarak tasir:

- Total analyses.
- Most frequent emotion.
- Feedback count.
- Role/admin state.
- Saved recommendations count.
- Account age veya createdAt.

Uzun metinler ellipsis veya wrap ile tasmasin.

## Kapsam 5 - Language ve Theme/Settings Uyumu

Web profile/account deneyiminde dil tercihi net gorunur.

Mobilde:

- TR/EN language segmented control veya list tile.
- Degisim aninda uygulama locale'i rebuild olur.
- PreferencesService ile kalici olur.
- Settings shortcut gorunur.
- Theme mode Settings'te kalabilir ama Profile icinden Settings'e net gecis olacak.
- Dil degisimi Profile, BottomNav ve Home copy'lerini bozmamali.

## Kapsam 6 - Saved Recommendations Web Kanonu

Web `savedRecommendations.js` niyeti mobilde korunacak:

- Local saved recommendations store tek kaynak olacak.
- Result ekranindan kaydedilen oneriler Profile'da gorunecek.
- Duplicate kayit engeli korunacak.
- Recommendation item alanlari kaybolmayacak:
  - id
  - title
  - type/category
  - artist/author
  - description/reason
  - imageUrl/poster/cover
  - externalUrl/url
  - source/historyId
  - emotion
  - createdAt/savedAt

## Kapsam 7 - Saved Recommendations UI

Mobil Profile icinde:

- Saved recommendations count.
- Category summary.
- Filter chips:
  - All
  - Music
  - Movies
  - Books
  - Advice
- Image-aware cards:
  - cover/poster varsa goster.
  - yoksa category icon fallback.
- Title, subtitle, reason/description.
- Save source emotion/history meta.
- External URL action.
- Source result action:
  - historyId varsa `/result/:historyId`.
- Remove item action.
- Clear all confirmation.
- Filter empty state.
- Global empty state.

Kartlar tasmasin, card-inside-card gorunumu olmasin.

## Kapsam 8 - Admin Shortcut ve Metrics Uyumu

Webde admin kullanici metrics/admin alanlarina gecis gorebilir.

Mobilde:

- `isAdmin == true` ise Metrics shortcut gorunur.
- CTA `/metrics` route'una gider.
- Admin olmayan kullaniciya bu bolum gosterilmez veya disabled teknik olmayan copy ile kapali tutulur.
- CSV export mobilde native/export sprintine kadar disabled note olarak kalabilir.

## Kapsam 9 - Logout

Web `authStore.logout` mantigina gore:

- Token/user storage temizlenir.
- Auth state guest hale doner.
- Route Home veya Login akisina deterministik doner.

Mobilde:

- Logout butonu loading/disabled state ile calisir.
- Secure storage temizlenir.
- User-facing success/error copy i18n'den gelir.
- Logout sonrasi `/` veya `/login` davranisi web kanonuna gore netlestirilir ve parity planina yazilir.

## Kapsam 10 - Account Delete

Backend delete kontrati web/API ile birebir olacak:

- Endpoint: `DELETE /api/user/account`
- Payload: `confirmationText`
- Backend confirmation text ne ise UI'da aynisi kullanilacak.
- Dogru metin yazilmadan delete aktif olmayacak.
- Basarili response kayipsiz ele alinacak:
  - message
  - deletedAnalyses
  - deletedRecommendations

Mobilde:

- Confirmation dialog/bottom sheet.
- Warning copy.
- Input field.
- Disabled delete button.
- Submit loading state.
- Success sonrasi auth storage temizlenir.
- Route login/home akisina doner.
- Error state teknik stack basmaz.

## Kapsam 11 - Settings Ekrani ile Profilin Tutarliligi

Profile ve Settings iki farkli ada gibi durmayacak:

- Profile -> Settings shortcut.
- Settings -> Profile shortcut.
- Language state iki yerde ayni provider/storage ile calisir.
- Theme state Settings'te kalici calisir.
- Auth state'e gore Settings kisayollari dogru gorunur.

## Kapsam 12 - i18n

TR/EN yeni keyler:

- profile guest title/body
- profile login/register CTA
- profile hero labels
- profile stats labels
- profile role/admin labels
- profile language labels
- saved recommendations title/body/count
- saved recommendation filters
- saved recommendation remove/clear all confirmations
- saved recommendation source result
- saved recommendation external URL fail
- admin shortcut
- logout loading/success/error
- delete account title/body/confirmation/input/error/success
- profile loading/error/empty/retry

Hardcoded user-facing copy kalmayacak.

## Kapsam 13 - Kod Kalitesi

- Her yeni Dart dosyasinin basinda `///` dokuman yorum blogu olacak.
- Import sirasi dart -> package -> relative.
- Riverpod annotation kullanma; manuel provider kullan.
- Gereksiz paket ekleme.
- Web kanonuna hizmet etmeyen buyuk refactor yapma.
- Text overflow yok.
- Button textleri mobile sigmali.
- Light/dark contrast korunacak.
- `dart format` calistir.

## Kapsam 14 - Dogrulama

Calistir:

- `flutter pub get`
- `flutter analyze`
- i18n key kontrolu
- mojibake taramasi

Opsiyonel:

- `flutter run -d emulator-5554 --no-resident`

## Kapsam 15 - Prompt Kaydi

Is tamamlaninca:

- `prompteray/W2M-005_tamamlandi_profile-page-web-kanonu-account-saved-settings-paritesi.md`

Sonraki promptu kaydet:

- `prompteray/W2M-006_metrics-page-web-kanonu-admin-dashboard-research-chart-paritesi.md`

W2M-006 odagi:

- MetricsPage web kanonu.
- Admin-only gate.
- Dashboard KPI grid.
- Emotion distribution chart/list.
- Response time chart/list.
- Research/comparison raw-safe sections.
- Admin overview.
- Unauthorized/forbidden/empty/loading/error parity.

## Kabul Kriterleri

1. Guest profile login/register CTA ile web kanonuna uyar.
2. Auth profile backend `GET /api/user/profile` verisini kayipsiz gosterir.
3. Profile hero username, email, role/admin, createdAt ve account mode tasir.
4. Profile stats total analyses, most frequent emotion, feedback count ve saved count gosterir.
5. Language preference Profile'da degisir, kalici olur ve app locale aninda rebuild eder.
6. Settings/Profile shortcutlari tutarlidir.
7. Saved recommendations Profile'da listelenir.
8. Saved recommendations kategori filtreleri calisir.
9. Saved recommendation image/icon fallback, title, reason, external URL ve source result aksiyonlarini tasir.
10. Remove item ve clear all confirmation calisir.
11. Source historyId varsa `/result/:historyId` acilir.
12. Admin kullanicida Metrics shortcut gorunur.
13. Logout secure storage'i temizler ve route akisina dondurur.
14. Account delete confirmation dogru metin girilmeden aktif olmaz.
15. Account delete payload backend DTO ile birebirdir.
16. Tum yeni copy TR/EN i18n dosyalarindadir.
17. `flutter pub get` basarilidir.
18. `flutter analyze` No issues found verir.
19. i18n key kontrolu temizdir.
20. Mojibake taramasi temizdir.
21. W2M-005 tamamlandi kaydi yazilir.
22. W2M-006 master promptu kaydedilir.

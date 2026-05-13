# W2M-007 - Global i18n, Copy, Theme, Motion ve Accessibility Web Kanonu

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde W2M-001 ile global shell/Home, W2M-002 ile Analyze Studio, W2M-003 ile Result Page, W2M-004 ile History Page, W2M-005 ile Profile Page ve W2M-006 ile Metrics Page web kanonu mobil karsiliklari kuruldu. Simdi hedef tum bu ekranlari tek urun gibi hissettirecek global kalite sprintidir.

Bu prompt yeni buyuk backend feature ekleme sprinti degildir. Hedef web uygulamasinin urun dili, i18n kapsami, tema davranisi, motion ritmi, accessibility beklentileri, empty/loading/error state standardi ve global navigation/shell tutarliligini mobilde son bir butunluk turundan gecirmektir.

## Mutlak Ilke

Web uygulamasi hala kanondur. Mobil sayfalar tek tek yapilmis adalar gibi durmayacak. Copy, state, CTA, renk, motion, accessibility ve navigation davranisi ayni MoodLens urun dilini tasiyacak.

## Referans Web Dosyalari

Once oku:

- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\App.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\components\layout\Navbar.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\components\layout\Footer.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\components\system\ThemeProvider.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\components\system\NetworkStatusBadge.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\tr.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\en.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\emotions.js`

Mobilde calisilacak ana alanlar:

- `lib/app.dart`
- `lib/widgets/bottom_nav_shell.dart`
- `lib/core/router/app_router.dart`
- `lib/core/theme/**`
- `lib/core/widgets/**`
- `lib/core/i18n/tr.dart`
- `lib/core/i18n/en.dart`
- `lib/features/home/**`
- `lib/features/analyze/**`
- `lib/features/result/**`
- `lib/features/history/**`
- `lib/features/profile/**`
- `lib/features/metrics/**`
- `lib/features/settings/**`
- `docs/web_to_mobile_parity_plan.md`

## Kapsam 1 - Global Parite Matrisi

`docs/web_to_mobile_parity_plan.md` dosyasina W2M-007 bolumu ekle.

Tablo alanlari:

- Route consistency
- Bottom nav active state
- Auth/guest/admin CTA consistency
- TR/EN copy completeness
- Error/loading/empty state consistency
- Theme light/dark readability
- Motion consistency
- Accessibility labels
- Network banner/global shell
- Text overflow
- Card nesting/style discipline

Her satirda web kanonu, mobil mevcut, yapilan duzeltme ve kalan risk yaz.

## Kapsam 2 - i18n ve Copy Denetimi

- `t('...')` ile kullanilan tum key'ler TR/EN dosyalarinda var mi script ile kontrol et.
- TR/EN key setleri birebir ayni olmali.
- Hardcoded user-facing TR/EN copy kalmasin.
- Web locale copy anlamlari mobilde eksiltilmeden tasinsin.
- Uzun TR metinleri button/card overflow yapmasin.
- Mojibake taramasi temiz olmali.

## Kapsam 3 - Global State Bilesenleri

Tum ana ekranlarda loading/error/empty desenlerini kontrol et:

- Home
- Analyze
- Result
- History
- Profile
- Metrics
- Settings
- Login/Register

Teknik hata stack'i kullaniciya basilmamali. Error retry CTA ve next-step CTA mantikli olmali.

## Kapsam 4 - Theme ve Contrast

- Dark theme okunabilirligi.
- Light theme okunabilirligi.
- Glass kartlarda metin kontrasti.
- Button disabled/active state.
- Error/warning/success renkleri.
- Tek renk mor/lacivert agirligi asiriya kaciyorsa cyan/teal/amber/rose aksanlari dengelensin.

## Kapsam 5 - Motion Sistemi

- Animasyonlar kisa, sakin ve premium olmali.
- Surekli loop dikkat dagitmamali.
- List entrance animasyonlari performansli olmali.
- Loading overlay ve result/share/save hareketleri tutarli olmali.
- Motion azaltma ihtiyaci varsa kolay kapatilabilir desen not edilmeli.

## Kapsam 6 - Accessibility

- Icon-only butonlarda tooltip/semantic label.
- Form field label/hint.
- Error text okunabilir.
- CTA hit target yeterli.
- Bottom nav label tasmaz.
- Contrast yeterli.
- Screen reader icin temel Semantics gereken yerlere eklenir.

## Kapsam 7 - Navigation ve Back Behavior

- `/` Home.
- `/analyze` Analyze.
- `/result/:historyId` Result.
- `/history` History.
- `/profile` Profile.
- `/metrics` Metrics.
- `/settings` Settings.
- `/login` Login.
- `/register` Register.

Back behavior, bottom nav active state, auth redirect `from` query, guest/admin guard tekrar kontrol edilir.

## Kapsam 8 - Dogrulama

Calistir:

- `flutter pub get`
- `flutter analyze`
- i18n key kontrolu
- mojibake taramasi

Opsiyonel:

- `flutter run -d emulator-5554 --no-resident`

## Kapsam 9 - Prompt Kaydi

Is tamamlaninca:

- `prompteray/W2M-007_tamamlandi_global-i18n-copy-theme-motion-accessibility-web-kanonu.md`

Sonraki promptu kaydet:

- `prompteray/W2M-008_backend-e2e-cihaz-smoke-web-parite-qa.md`

W2M-008 odagi:

- Backend calistirma.
- Android/emulator cihaz smoke.
- Auth/analyze/result/history/profile/metrics/settings uc uca test.
- Debug/release APK.
- Demo checklist.

## Kabul Kriterleri

1. TR/EN i18n key setleri birebir aynidir.
2. Hardcoded user-facing copy kalmaz.
3. Mojibake taramasi temizdir.
4. Tum ana ekranlarda loading/error/empty state tutarlidir.
5. Light/dark theme okunabilirligi korunur.
6. Bottom nav ve route active state dogrudur.
7. Auth/guest/admin CTA davranislari tutarlidir.
8. Icon-only butonlarda tooltip/semantic destek vardir.
9. Text overflow temel ekranlarda temizdir.
10. `flutter pub get` basarilidir.
11. `flutter analyze` No issues found verir.
12. W2M-007 tamamlandi kaydi yazilir.
13. W2M-008 master promptu kaydedilir.

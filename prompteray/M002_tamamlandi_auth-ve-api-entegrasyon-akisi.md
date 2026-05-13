## Sana verecegim prompt

M002 - Auth ve API Entegrasyon Akisi promptu tamamlandi.

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M001 ile kurulan altyapi kullanilarak gercek backend auth akisi, ilk kullanici deneyimi, onboarding kaliciligi ve oturum restore davranisi tamamlandi.

## Amac

Mobil uygulamada kullanicinin onboarding, giris, kayit, misafir oturumu ve oturum saklama akisini calisir hale getirmek. Kullanici backend'e login/register istegi atabilir, basarili cevapta token ve user bilgisi secure storage'a yazilir, uygulama acilisinda mevcut oturum restore edilir ve splash deterministik olarak dogru route'a yonlendirir.

## Kapsam

- `features/splash/presentation/splash_screen.dart`
  - Auth restore ve onboarding kontrolu ile `/onboarding`, `/login` veya `/` yonlendirmesi kuruldu.
- `features/onboarding/presentation/onboarding_screen.dart`
  - 3 sayfali onboarding tasarlandi.
  - Tamamlanma durumu `PreferencesService.setOnboardingCompleted` ile kaydediliyor.
- `features/auth/presentation/login_screen.dart`
  - Email/sifre formu, validasyon, loading/error state, misafir devam ve `authProvider.login` baglantisi eklendi.
- `features/auth/presentation/register_screen.dart`
  - Kullanici adi/email/sifre formu, validasyon, loading/error state ve `authProvider.register` baglantisi eklendi.
- `features/auth/presentation/providers/auth_provider.dart`
  - Backend ve `ApiException` hatalari kullanici dostu i18n mesajlarina cevriliyor.
  - Logout secure storage'i temizliyor ve state'i unauthenticated yapiyor.
- `features/profile/presentation/profile_screen.dart`
  - Oturum ozeti ve logout butonu eklendi.
- `shared/providers/storage_provider.dart`
  - Onboarding, guest session ve guest quota providerlari eklendi.
- `app.dart`
  - Global `NetworkStatusBanner` eklendi.
- `core/i18n/tr.dart` ve `core/i18n/en.dart`
  - Auth, onboarding, hata, form ve misafir akisi stringleri TR/EN olarak genisletildi.

## Kabul kriterleri

1. `flutter pub get` basariyla tamamlandi.
2. `flutter analyze` `No issues found!` verdi.
3. Login/register formlari backend `POST /api/auth/login` ve `POST /api/auth/register` payload formatlariyla uyumlu.
4. Basarili auth cevabinda token ve user bilgisi secure storage'a kaydediliyor.
5. Uygulama acilisinda splash mevcut oturumu restore edip route yonlendirmesi yapiyor.
6. Onboarding sadece tamamlanmadigi durumda gosteriliyor.
7. Misafir devam akisi backend guest session mimarisiyle uyumlu.
8. Offline banner global olarak uygulamaya eklendi.
9. Form ve auth UI metinleri i18n dosyalarindan geliyor.

## Sana verecegim prompt

M002 - Auth ve API Entegrasyon Akisi

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M001 ile kurulan altyapiyi kullanarak gercek backend auth akisini ve ilk kullanici deneyimini tamamla. Web projesindeki backend endpointleri ve response formatlari ile uyumlu calis.

## Amac

Mobil uygulamada kullanicinin onboarding, giris, kayit, misafir oturumu ve oturum saklama akisini calisir hale getirmek. Bu adim sonunda kullanici backend'e login/register istegi atabilmeli, token ve user bilgisi secure storage'a yazilmali, uygulama acilisinda mevcut oturum restore edilmeli ve route yonlendirmesi buna gore davranmali.

## Kapsam

- `features/splash/presentation/splash_screen.dart`
  - Acilista onboarding tamamlanma durumunu ve auth restore sonucunu kontrol et.
  - Onboarding tamamlanmadiysa `/onboarding`, tamamlandiysa oturum durumuna gore `/` veya `/login` yonlendir.
- `features/onboarding/presentation/onboarding_screen.dart`
  - 3 sayfali mobil onboarding tasarla.
  - `PreferencesService.setOnboardingCompleted` ile tamamlanma durumunu kaydet.
- `features/auth/presentation/login_screen.dart`
  - Email/sifre formu, validasyon, loading/error state ve `authProvider.login` baglantisi ekle.
  - Basarili login sonrasi `/` route'una yonlendir.
- `features/auth/presentation/register_screen.dart`
  - Kullanici adi/email/sifre formu, validasyon, loading/error state ve `authProvider.register` baglantisi ekle.
  - Basarili kayit sonrasi `/` route'una yonlendir.
- `features/auth/presentation/providers/auth_provider.dart`
  - Hata mesajlarini `ApiException` uzerinden temiz kullanici mesajina cevir.
  - Logout sonrasi storage temizlensin ve `/login` akisina donulebilsin.
- `core/router/app_router.dart`
  - Auth/onboarding durumuna gore redirect guard ekle veya splash uzerinden deterministik yonlendirme kur.
- `shared/providers/storage_provider.dart`
  - Onboarding ve guest quota icin gerekli provider okumalari ergonomik hale getir.
- UI
  - Mevcut `AnimatedGradientBackground`, `GlassmorphismCard`, `PremiumButton`, `AnimatedLoading`, `NetworkStatusBanner` widgetlarini kullan.
  - Form stringleri i18n dosyalarinda TR/EN olarak tanimli olsun.

## Kabul kriterleri

1. `flutter pub get` yeniden calisir ve dependency sorunu yoktur.
2. `flutter analyze` `No issues found!` verir.
3. Login/register formlari backend `POST /api/auth/login` ve `POST /api/auth/register` endpointleri ile uyumludur.
4. Basarili auth cevabinda token secure storage'a, user bilgisi secure storage'a kaydedilir.
5. Uygulama tekrar acildiginda oturum restore edilir.
6. Onboarding sadece ilk acilista gosterilir; tamamlaninca tekrar gorunmez.
7. Offline durumda banner veya kullaniciya anlasilir hata mesaji gosterilir.
8. Hardcoded Turkce/Ingizlice UI metinleri i18n disinda kalmaz.

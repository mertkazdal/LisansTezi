## Sana verecegim prompt

M008 - Web Sayfa Paritesi ve Premium Animasyonlu Mobil UI

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M007 ile backend kontrati web mimarisine tam oturtulduktan sonra, mobil uygulamanin frontend/sayfa deneyimini `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client` web uygulamasina bakarak yeniden ele al. Hedef webdeki tum ana sayfa/akislari mobilde eksiksiz, ergonomik, premium, animasyonlu ve demo etkisi yuksek hale getirmek.

Bu adimda testlere hemen gecme; once mobil ekran mimarisini ve tasarim sistemini webdeki sayfa mantigina gore tamamla. Webdeki Home, Analyze, Result, History, Metrics, Login, Register, Profile sayfalarinin mobil karsiliklari net olsun. Mobilde zaten var olan ekranlari koru ama route/nav ve tasarim paritesini guclendir. Gorsel kalite hedefi yuksek: mikro animasyonlar, gecisler, premium motion, glassmorphism, akilli loading/empty/error durumlari, tek elle kullanilabilir mobil ergonomi.

## Amac

Mobil frontendi web urun deneyimiyle ayni kapsama getirip daha etkileyici hale getirmek:

- Webdeki `/` HomePage mobilde de anlamli bir Home/Dashboard ekranina donussun.
- Webdeki `/analyze` mobilde ayri Analyze tab/route olarak netlensin.
- Result, History, Metrics, Login, Register, Profile sayfalari webdeki bilgi mimarisini mobil ergonomiye uyarlasin.
- Settings mobil icin korunup profil/account deneyimiyle baglansin.
- Bottom nav ve route yapisi web sayfa paritesine gore yeniden duzenlensin.
- Premium animasyonlu tasarim dili tum ekranlara yayilsin.
- Tum gorunen metinler TR/EN i18n'den gelsin.
- Kart icinde kart, metin tasmasi, gereksiz hero/landing yorgunlugu ve tek renk tema hissi giderilsin.

## Kapsam

### 1. Web frontend sayfalarini referans al

Referans dosyalar:

- `nihaitezweb/client/src/App.jsx`
- `nihaitezweb/client/src/pages/HomePage.jsx`
- `nihaitezweb/client/src/pages/AnalyzePage.jsx`
- `nihaitezweb/client/src/pages/ResultPage.jsx`
- `nihaitezweb/client/src/pages/HistoryPage.jsx`
- `nihaitezweb/client/src/pages/MetricsPage.jsx`
- `nihaitezweb/client/src/pages/LoginPage.jsx`
- `nihaitezweb/client/src/pages/RegisterPage.jsx`
- `nihaitezweb/client/src/pages/ProfilePage.jsx`
- `nihaitezweb/client/src/components/**`
- `nihaitezweb/client/src/store/**`
- `nihaitezweb/client/src/i18n/**`

Mobil dosyalar:

- `core/router/app_router.dart`
- `widgets/bottom_nav_shell.dart`
- `features/home/...` yeni eklenecek
- `features/analyze/presentation/analyze_screen.dart`
- `features/result/presentation/result_screen.dart`
- `features/history/presentation/history_screen.dart`
- `features/metrics/presentation/metrics_screen.dart`
- `features/auth/presentation/login_screen.dart`
- `features/auth/presentation/register_screen.dart`
- `features/profile/presentation/profile_screen.dart`
- `features/settings/presentation/settings_screen.dart`
- `core/widgets/**`
- `core/i18n/tr.dart`
- `core/i18n/en.dart`

### 2. Route ve navigasyon paritesi

Yapilacaklar:

- Web route mantigina gore mobil route haritasi net olsun:
  - `/` veya `/home` -> Home/Dashboard
  - `/analyze` -> Analyze
  - `/result/:historyId` -> Result
  - `/history` -> History
  - `/metrics` -> Metrics
  - `/login` -> Login
  - `/register` -> Register
  - `/profile` -> Profile
  - `/settings` -> Settings
- Bottom nav mobil icin yeniden dusunulsun:
  - Home
  - Analyze
  - History
  - Profile
- Metrics admin ise Home/Profile/Settings uzerinden erisilebilir olsun.
- Analyze sonrasi result route'u korunur.
- Splash/onboarding/auth redirect akisi bozulmasin.

### 3. Home/Dashboard ekranini ekle

Yeni dosyalar:

- `features/home/presentation/home_screen.dart`
- Gerekirse `features/home/presentation/widgets/*`

UI/UX:

- Ilk ekran web HomePage'in mobil urun karsiligi olsun, marketing landing gibi bos durmasin.
- Kullaniciya bugunku durumunu ozetleyen, analize hizli baslatan, guest/auth durumunu anlatan dashboard ver.
- Bilesenler:
  - Kisa marka/product signal: MoodLens
  - Quick analyze CTA
  - Guest remaining analyses veya auth user summary
  - Son analiz karti veya history bos state
  - Recommendations/metrics/profile kisayollari
  - Offline/network banner uyumlu
- Animasyonlar:
  - Staggered entrance
  - Subtle particle/aurora movement
  - CTA press animation
  - Route transition hissi

### 4. Analyze ekranini web UX + mobil premium motion ile yukselt

Yapilacaklar:

- Web AnalyzePage'deki bilgi hiyerarsisini mobilde uygula.
- Text, gallery, camera, selected image, quota, warning, follow-up state'leri daha zarif hale gelsin.
- Analyze CTA tek elle kolay erisilebilir olsun.
- Input focus/keyboard durumunda layout tasmasin.
- Loading animasyonu premium olsun:
  - step text
  - shimmer/skeleton
  - calm motion
- Follow-up kutusu ayri ve belirgin olsun.
- Gallery/camera aksiyonlari iconlu, tactile ve disabled/loading state'li olsun.

### 5. Result ekranini sunumluk hale getir

Yapilacaklar:

- Web ResultPage'deki emotion hero, confidence, explanation, metadata, recommendations ve feedback akisini mobilde daha premium tasarla.
- Emotion hero:
  - animated badge
  - confidence radial/progress animation
  - explanation reveal
- Metadata:
  - modality/model/response time/face status kompakt ama okunur.
- Recommendations:
  - Music/movie/book/advice bolumleri yatay veya dikey mobil kartlarla guzel gorunsun.
  - External URL varsa buton/ikon hazir olsun.
- Feedback CTA:
  - bottom sheet daha premium ve ergonomik olsun.
- New analysis CTA ve history geri donus net olsun.

### 6. History ekranini web mantigina gore mobil listeye cilala

Yapilacaklar:

- History kartlari emotion, confidence, date, modality, face status, snippet ile daha taranabilir olsun.
- Pull-to-refresh ve load-more animasyonlari guzel dursun.
- Empty/error/auth required state'leri ortak widgetlarla premium gosterilsin.
- Webdeki filtre/siralama varsa mobilde minimal filtre/segment olarak degerlendir.

### 7. Profile ve Settings deneyimini tamamla

Yapilacaklar:

- Profile web sayfasindaki account bilgisi, usage stats, role/admin bilgisi ve delete/logout aksiyonlari mobilde daha iyi tasarlansin.
- Guest profile CTA daha net olsun.
- Settings:
  - Tema
  - Dil
  - Backend URL/demo bilgisi
  - Profile/login/logout shortcut
  - Admin metrics shortcut
- Light/dark theme gecerken kontrast ve animasyon bozulmasin.

### 8. Metrics ekranini admin demo paneline donustur

Yapilacaklar:

- Web MetricsPage'deki dashboard mantigini mobilde daha iyi karsila.
- Summary stat kartlari, emotion distribution chart, response time chart/list, research/comparison/admin overview kartlari premium gorunsun.
- Admin olmayan state sade ve net olsun.
- Chartlar mobilde tasmasin.
- Raw key-value listeleri okunabilir ve kisa olsun; detay ac/kapat dusunulebilir.

### 9. Auth ekranlarini web tasarim diliyle yeniden cilala

Yapilacaklar:

- Login/register ekranlari webdeki marka ve copy hissini tasir.
- Form validation, loading, error, guest merge success, guest continue state'leri guzel gorunsun.
- Keyboard acildiginda CTA kaybolmasin.
- Register/login switch gecisi animasyonlu olabilir.

### 10. Animasyon ve ortak UI sistemi

Mevcut paketleri kullan:

- `flutter_animate`
- `flutter_staggered_animations`
- `animate_do`
- `rive`
- `lottie`
- `shimmer`
- `confetti`
- `fl_chart`

Yapilacaklar:

- Gerekmedikce yeni paket ekleme.
- Ortak motion widgetlari gerekiyorsa ekle:
  - `AnimatedPageEntrance`
  - `PremiumScaffold`
  - `AnimatedSection`
  - `AnimatedMetricCard`
  - `PulseIcon`
- Animasyonlar performansli, sakin ve demo etkisi yuksek olsun.
- Surekli dikkat dagitan asiri hareketten kacin.
- Reduced motion parametresi yoksa en azindan animasyonlari kisa ve hafif tut.

### 11. i18n ve copy

Yapilacaklar:

- Tum yeni metinler `core/i18n/tr.dart` ve `core/i18n/en.dart` icine eklensin.
- Web copy'si referans alinsin ama mobil icin daha kisa ve ergonomik yazilsin.
- Hardcoded TR/EN UI metni kalmasin.
- Bozuk encoding olmasin.

### 12. Kod kalitesi

- Her yeni Dart dosyasinin basinda `///` dokuman yorum blogu olsun.
- Import sirasi dart -> package -> relative.
- Riverpod annotation kullanma; manuel provider kullan.
- Kart icinde kart kullanma; tekrar eden item kartlari tek seviye kalsin.
- Metinler maxLines/ellipsis veya responsive layout ile tasmasin.
- Font size viewport width ile scale edilmesin.
- Letter spacing 0 olsun.
- Tek renk/purple-only tema hissinden kacin; mevcut cyan/purple/pink aksanlar dengeli kullanilsin.
- Buyuk fonksiyonlari parcalara bol ama gereksiz abstraction ekleme.

## Kabul kriterleri

1. Mobilde webdeki ana sayfa ailesinin karsiligi vardir: Home, Analyze, Result, History, Metrics, Login, Register, Profile.
2. `/` veya `/home` artik anlamli Home/Dashboard ekranidir.
3. Analyze ayri `/analyze` route'u olarak korunur.
4. Bottom nav mobil urun paritesine gore duzenlenir.
5. Home ekraninda quick analyze, guest/auth summary ve son analiz/empty state vardir.
6. Analyze ekraninda text/gallery/camera/follow-up/quota/loading state'leri premium tasarlanir.
7. Result ekraninda emotion hero, confidence, explanation, metadata, recommendations ve feedback sunumluk hale gelir.
8. History ekraninda liste, refresh, load-more ve empty/error state'leri cilalidir.
9. Profile/settings ekranlari web mantigi + mobil ergonomiyle cilalanir.
10. Metrics ekraninda admin dashboard mobilde okunur ve animasyonludur.
11. Auth ekranlari loading/error/guest merge state'leriyle premium hale gelir.
12. Tum yeni metinler TR/EN i18n'dedir.
13. Bozuk encoding taramasi temizdir.
14. `flutter pub get` basarili.
15. `flutter analyze` `No issues found!`.
16. Tam E2E cihaz testi bu promptun kapsami degildir; M009'a birakilir.

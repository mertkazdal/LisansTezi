## Sana verecegim prompt

M008-R - Web Kanonundan Birebir Mobil UI ve Sayfa Paritesi

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M007-R ile backend kontrati web kanonuna oturtuldu. Simdi hedef, `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client` web uygulamasindaki tum ana sayfa ve urun deneyimini mobil uygulamaya birebir tasimaktir.

Bu promptta "web referans olsun, mobil benzeri olsun" mantigi kesinlikle yok. Web uygulamasi kanondur. Mobil, webdeki ekran kapsamlarini, bilgi mimarisini, akislari, CTA'lari, state davranislarini, bos/error/loading durumlarini, guest/auth/admin ayrimlarini ve urun dilini ayni urun olarak tasiyacak. Mobil ekranlar dogal olarak telefon ergonomisine uyarlanabilir ama urun kapsami ve davranis eksiltilmeyecek.

## Cok Onemli Ilke

Web neyse mobil de o olacak.

- Webde Home varsa mobilde Home olacak.
- Webde Analyze ayri studio ise mobilde Analyze ayri studio olacak.
- Webde Result emotion hero, confidence, metadata, recommendations, feedback ve share/save mantigi varsa mobilde de olacak.
- Webde History timeline/filter/detail mantigi varsa mobilde mobil karsiligi olacak.
- Webde Metrics admin dashboard, charts, research/comparison/admin overview varsa mobilde de okunabilir dashboard olacak.
- Webde Login/Register guest merge ve guven copy'si varsa mobilde de olacak.
- Webde Profile account, saved recommendations, language, admin CSV/overview, delete/logout mantigi varsa mobilde de karsiligi olacak.
- Yanlis kurulmus eski mobil akisi varsa koruma; web kanonuna gore duzelt.
- "Simdilik kalsin" yok. Eksikse tamamla, yanlissa bastan yap.

Bu adim test/E2E sprinti degildir. Once ekran mimarisi ve UI paritesi tamamlanacak. Yine de `flutter analyze` temiz kalmali.

## Amac

Mobil uygulamayi web uygulamasinin birebir urun kapsamina tasimak:

- Mobil route haritasi web route haritasiyla eslesecek.
- Home/Dashboard ekrani eklenecek ve `/` artik web HomePage'in mobil karsiligi olacak.
- Analyze ekrani `/analyze` route'una tasinacak ve web AnalyzePage bilgi hiyerarsisini mobilde tasiyacak.
- Result, History, Metrics, Login, Register, Profile ekranlari webdeki sayfa davranisini mobilde eksiksiz karsilayacak.
- Settings mobil icin korunacak ama Profile/web account deneyimiyle uyumlu hale getirilecek.
- Bottom nav web sayfa paritesiyle yeniden duzenlenecek.
- Premium animasyonlu, demo etkisi yuksek, tek elle kullanilabilir mobil tasarim kurulacak.
- Tum yeni metinler TR/EN i18n dosyalarinda olacak.
- Hardcoded user-facing copy kalmayacak.

## Web Kanon Dosyalari

Once su dosyalari oku ve mobil tasarim/akis kararlarini bunlara gore ver:

- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\App.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\HomePage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\AnalyzePage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\ResultPage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\HistoryPage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\MetricsPage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\LoginPage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\RegisterPage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\ProfilePage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\components\layout\Navbar.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\components\layout\Footer.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\components\system\NetworkStatusBadge.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\components\system\ThemeProvider.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\components\metrics\MetricsChartsSection.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\emotions.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\savedRecommendations.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\resultShareCard.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\tr.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\en.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\services\api.js`

## Mobilde Ana Calisma Dosyalari

- `lib/core/router/app_router.dart`
- `lib/widgets/bottom_nav_shell.dart`
- `lib/app.dart`
- `lib/core/theme/**`
- `lib/core/widgets/**`
- `lib/core/i18n/tr.dart`
- `lib/core/i18n/en.dart`
- `lib/features/home/**` yeni eklenecek
- `lib/features/analyze/presentation/analyze_screen.dart`
- `lib/features/result/presentation/result_screen.dart`
- `lib/features/history/presentation/history_screen.dart`
- `lib/features/metrics/presentation/metrics_screen.dart`
- `lib/features/auth/presentation/login_screen.dart`
- `lib/features/auth/presentation/register_screen.dart`
- `lib/features/profile/presentation/profile_screen.dart`
- `lib/features/settings/presentation/settings_screen.dart`

## Kapsam

### 1. Route ve Navigasyon Paritesi

Web route mantigini mobile birebir aktar:

- `/` veya `/home` -> Home/Dashboard
- `/analyze` -> Analyze Studio
- `/result/:historyId` -> Result
- `/history` -> History
- `/metrics` -> Metrics
- `/login` -> Login
- `/register` -> Register
- `/profile` -> Profile
- `/settings` -> Settings

Yapilacaklar:

- Splash/onboarding/auth restore akisi bozulmayacak.
- Onboarding tamamlaninca `/` Home ekranina gidilecek.
- Eski mobilde `/` direkt Analyze ise bu duzeltilecek.
- Bottom nav su ana tablari tasiyacak:
  - Home
  - Analyze
  - History
  - Profile
- Metrics admin ekranina Home/Profile/Settings uzerinden erisim olacak.
- Result route bottom nav disinda full detail ekran olarak kalacak.
- Login/register modal degil, webdeki gibi tam route deneyimi olacak.

### 2. Home/Dashboard Ekranini Web HomePage Kanonuna Gore Ekle

Yeni dosyalar:

- `lib/features/home/presentation/home_screen.dart`
- Gerekirse `lib/features/home/presentation/widgets/*.dart`

Home mobilde bos landing gibi durmayacak. Web HomePage'in mobil urun karsiligi olacak.

Zorunlu bilesenler:

- Product identity: Yapay Zeka Destekli Yasam Kocu / MoodLens mevcut marka uyumuna gore ama web kanonundaki urun dili takip edilecek.
- Hero/summary alaninda kullanicinin analize hizli baslamasi.
- Guest quota veya auth account mode ozeti.
- Quick analyze CTA: `/analyze`
- Son analiz veya history empty state karti.
- Result/history/profile/metrics kisayollari.
- Network/offline banner uyumu.
- Misafir ilk 3 analiz ve 4. analizde login zorunlulugu anlatimi.
- Webdeki "analiz akisi" 4 adimli anlatimin mobil, kompakt karsiligi.

Animasyon:

- Staggered entrance.
- Hafif aurora/particle background.
- CTA press animation.
- Kayan/nefes alan duygu chipleri.
- Asiri hareket yok; demo etkisi yuksek ama sakin.

### 3. Analyze Ekranini Web AnalyzePage Ile Esitle

Mevcut analyze ekrani korunabilir ama web studio kapsamindan eksikse yeniden duzenle.

Zorunlu davranislar:

- Text-only analiz desteklenecek.
- Image-only analiz desteklenecek.
- Text + image multimodal analiz desteklenecek.
- Gallery ve camera ayri iconlu aksiyonlar olacak.
- Secilen gorsel thumbnail olarak gorunecek ve kaldirilabilecek.
- Mahremiyet/visual consent webdeki mantikla mobilde de net gorunecek.
- Guest quota paneli webdeki account/guest/locked mantigiyla uyumlu olacak.
- Input bos ve gorsel yoksa analyze CTA disabled olacak.
- Loading state formu kilitleyecek.
- Loading webdeki `AnalyzingOverlay` mantigina benzer sekilde step text, shimmer/pulse ve premium bekleme hissi verecek.
- Backend warning sakin uyari bandi olarak gorunecek.
- Follow-up question gelirse webdeki "Coach question" mantiginin mobil karsiligi olacak.
- Follow-up cevabi ayni endpoint'e tekrar analiz olarak gidecek.
- Offline/backend kapali hata kullanici dostu olacak.

UI zorunluluklari:

- Kart icinde kart yapma.
- Ana deneyim tek elle kullanilabilir olsun.
- Klavye acildiginda CTA kaybolmasin veya tasmasin.
- Uzun metinler maxLines/ellipsis veya scroll ile tasmasin.
- Webdeki scanner/selfie hissini mobilde premium bir camera/gallery preview alaniyla ver.

### 4. Result Ekranini Web ResultPage Kanonuna Gore Yeniden Cilala

Result mobilde web ResultPage'in ayni urun kapsaminda olmasi gerekir.

Zorunlu bolumler:

- Emotion hero:
  - Duygu etiketi ve emoji/badge.
  - Duyguya gore renk/atmosfer.
  - Animated confidence ring/progress.
  - "AI analizi tamamlandi" / detected emotion mantigi.
- Insight panel:
  - Explanation / coach comment.
  - Warning varsa explanation'dan once veya cok gorunur yerde sakin uyari.
- Metadata:
  - modalityUsed
  - modelUsed
  - responseTimeMs
  - faceDetected
- Recommendations:
  - Music
  - Movie
  - Book
  - Advice
  - Webdeki alias ve alanlar mobile kayipsiz yansisin.
  - External URL varsa icon/button hazir olsun.
- Feedback:
  - Webdeki feedback formunun mobil bottom sheet karsiligi.
  - Mevcut feedback varsa tekrar submit engellensin ve ozet gosterilsin.
- Next step:
  - New analysis CTA.
  - History CTA.
  - Login to save CTA guest durumunda uygun yerde.

Result fallback:

- In-memory analyze result varsa onu kullan.
- Yoksa M007-R ile eklenen `GET /api/recommendations/{historyId}` result detail fallback'i kullan.
- O da olmazsa auth kullanicida history fallback kullan.
- Hicbiri olmazsa guzel empty/error state goster.

### 5. History Ekranini Web HistoryPage Mantigiyla Esitle

Zorunlu davranislar:

- Auth-only state korunacak.
- Guest kullaniciya login/register CTA.
- Paginated history liste.
- Pull-to-refresh.
- Load-more.
- Emotion filter/segment: webdeki filtre mantiginin mobil kompakt karsiligi.
- Summary alanlari:
  - loaded count
  - top emotion
  - combined/multimodal count
  - average confidence
  - face signal count
- Liste item:
  - emotion badge
  - confidence
  - date
  - modality
  - faceDetected
  - explanation snippet
  - userText snippet varsa
- Item tap:
  - `/result/:historyId` route'una gitsin.
  - Webdeki mini detail modal mantigi mobilde result route ile daha guclu kurulabilir; ama detay bilgisini kaybetme.

### 6. Metrics Ekranini Web MetricsPage ve Charts Section Ile Esitle

Metrics admin-only davranacak.

Zorunlu state'ler:

- Guest/not logged in -> login CTA.
- Auth ama admin degil -> permission/admin required state.
- Admin -> dashboard data.
- Empty -> demo/research empty state.
- Loading -> premium loading.
- Error -> retry.

Zorunlu dashboard:

- Total analyses.
- Registered analyses.
- Guest analyses.
- Total users.
- Average confidence.
- Average response time.
- Recommendation coverage.
- Feedback/research quality summary.
- Emotion distribution chart/list.
- Response time chart/list.
- Research raw key-value section.
- Comparison raw key-value section.
- Admin overview raw key-value section.
- Recent analyses varsa listelenebilir.

Chart kullanimi:

- Mevcut `fl_chart` kullan.
- Mobilde chartlar tasmasin.
- Pie/bar/mini line kullan.
- Chart yoksa okunabilir list fallback olsun.

### 7. Login ve Register Ekranlarini Web Auth Sayfalariyla Esitle

Zorunlu kapsam:

- Webdeki guven/trust copy mantigi.
- Guest merge bilgilendirmesi.
- Login form:
  - email
  - password
  - validation
  - loading/error
  - success redirect
- Register form:
  - username
  - email
  - password
  - validation
  - password strength/match hissi varsa mobilde karsiligi
  - guest merge success
- Login/register arasi gecis.
- Keyboard acildiginda form bozulmasin.
- Guest continue CTA korunacak.

### 8. Profile Ekranini Web ProfilePage Kapsamina Getir

Zorunlu bolumler:

- Guest profile state:
  - login/register CTA
  - neden login anlatimi.
- Auth profile:
  - username
  - email
  - role/isAdmin
  - createdAt
  - totalAnalyses
  - mostFrequentEmotion
  - avatar placeholder
- Language preference:
  - Turkish
  - English
  - uygulama locale'i aninda degissin.
- Saved recommendations:
  - Webde local saved recommendations var.
  - Mobilde mevcut degilse local storage tabanli ilk versiyon ekle veya bilincli minimal karsilik kur.
  - Result recommendation itemlarindan save/toggle yapilabilecek hale getir.
- Admin overview:
  - Admin ise metrics/admin kisayolu.
  - CSV export mobilde paket eklenmeden yapilamiyorsa buton yerine bilincli not/disabled state.
- Data management:
  - Logout.
  - Account delete confirmation.
  - Backend `deleteConfirmationText` birebir kullan.

### 9. Settings Ekranini Profile/Web Account Deneyimiyle Uyumlu Tut

Settings mobil-spesifik kalabilir ama webdeki theme/language/account mantigiyla uyumlu olsun.

Zorunlu alanlar:

- Theme:
  - system
  - light
  - dark
- Language:
  - tr
  - en
- Backend URL/debug:
  - current base URL
  - custom/platform auto mode
  - app version
- Shortcuts:
  - Profile
  - Metrics if admin
  - Login/logout state'e gore.

### 10. Ortak UI ve Motion Sistemini Kur

Mevcut paketleri kullan:

- `flutter_animate`
- `flutter_staggered_animations`
- `animate_do`
- `shimmer`
- `rive`
- `lottie`
- `confetti`
- `fl_chart`

Yeni paket ekleme. Gerekirse ortak widget ekle:

- `PremiumScaffold`
- `AnimatedPageEntrance`
- `AnimatedSection`
- `PulseIcon`
- `ConfidenceRing`
- `RecommendationCard`
- `SavedRecommendationStore`

Kurallar:

- Animasyonlar kisa, performansli, sakin ve premium olacak.
- Surekli dikkat dagitan looplardan kacin.
- Text hicbir viewportta buton/kart disina tasmayacak.
- Card inside card yok.
- Floating decorative orb yok.
- Tek renk mor/lacivert tema hissine dusme; cyan, teal, amber, rose gibi dengeli aksanlar kullan.
- Font size viewport width ile scale edilmesin.
- Letter spacing 0 olsun.

### 11. i18n ve Copy Paritesi

Tum yeni metinleri ekle:

- `lib/core/i18n/tr.dart`
- `lib/core/i18n/en.dart`

Kapsanacak metinler:

- Home
- Analyze
- Result
- History
- Metrics
- Auth
- Profile
- Settings
- Saved recommendations
- Share/save states
- Empty/error/loading/retry states
- Permission/admin states

Web copy'si kanon ama mobile daha kisa yazilabilir. Anlam ve urun kapsami eksiltilmeyecek.

Hardcoded user-facing TR/EN metin kalmayacak.

### 12. Kod Kalitesi

- Her yeni Dart dosyasinin basinda `///` dokuman yorum blogu olsun.
- Import sirasi dart -> package -> relative.
- Riverpod annotation kullanma; manuel provider kullan.
- Gereksiz paket ekleme.
- Buyuk refactor yapabilirsin ama web paritesine hizmet etmeli.
- Eski yanlis route veya ekran mantigini koruma.
- UI metinleri i18n disinda kalmasin.
- Analyzer temiz kalacak.
- Test/E2E bu promptun ana kapsami degil ama statik dogrulama sart.

## Dogrulama

Calistir:

- `flutter pub get`
- `flutter analyze`
- i18n key kontrolu
- bozuk encoding/mojibake taramasi

E2E cihaz smoke test bu promptun kapsami degildir; M009-R'ye birakilir.

## Prompt Kaydi

Bu M008-R isi tamamlandiginda:

- `prompteray/M008-R_tamamlandi_web-kanonundan-birebir-mobil-ui-ve-sayfa-paritesi.md` dosyasini olustur.
- Hangi web sayfalari mobilde hangi ekranlara tasindi yaz.
- Hangi UI/state/route eksikleri kapandi yaz.
- Hangi bilinen riskler M009-R E2E testine kaldi yaz.
- Sonraki M009-R master promptunu `prompteray` icine kaydet.

## Kabul Kriterleri

1. Mobilde webdeki ana sayfa ailesinin karsiligi vardir: Home, Analyze, Result, History, Metrics, Login, Register, Profile.
2. `/` artik anlamli Home/Dashboard ekranidir; Analyze ayri `/analyze` route'udur.
3. Bottom nav Home, Analyze, History, Profile ana tablariyla calisir.
4. Home ekrani web HomePage'in mobil urun karsiligidir.
5. Analyze ekrani web AnalyzePage state ve bilgi hiyerarsisini tasir.
6. Result ekrani web ResultPage kapsaminda emotion hero, confidence, explanation, metadata, recommendations, feedback ve next steps icerir.
7. Result fallback M007-R backend result detail akisini kullanir.
8. History ekrani paginated, refresh/load-more, filter/summary ve result navigation destekler.
9. Metrics ekrani admin-only dashboard, charts/list fallback, raw research/comparison/admin overview alanlarini gosterir.
10. Login/register ekranlari web auth copy, guest merge, validation ve loading/error state'lerini tasir.
11. Profile ekrani web ProfilePage kapsaminda account, language, saved recommendations, admin shortcut, logout/delete deneyimlerini tasir.
12. Settings ekraninda theme/language/backend/account kisayollari calisir.
13. Tum yeni user-facing metinler TR/EN i18n dosyalarindadir.
14. Hardcoded user-facing TR/EN copy kalmaz.
15. Bozuk encoding/mojibake taramasi temizdir.
16. `flutter pub get` basarilidir.
17. `flutter analyze` `No issues found!` verir.
18. Tam cihaz E2E test M009-R'ye birakilir.

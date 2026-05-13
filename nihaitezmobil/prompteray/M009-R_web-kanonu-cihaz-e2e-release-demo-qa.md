## Sana verecegim prompt

M009-R - Web Kanonu Cihaz E2E, Release Build, Demo QA ve Son Sertlestirme Sprinti

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M007-R ile backend kontrat paritesi, M008-R ile web kanonundan mobil UI/sayfa paritesi kuruldu. Bu promptta hedef artik "bakalim calisiyor mu" seviyesinde bir kontrol degil; mobil uygulamayi tez demosunda gercekten gezilebilir, backend ile uc uca calisan, build artefacti alinmis ve web kanonundan sapmalari yakalanip duzeltilmis hale getirmektir.

Bu sprinti tek basina release aday sprinti gibi ele al. Yalnizca rapor yazip birakma. Backend kapaliysa calistir. Emulator varsa baslat. Uygulama acilmiyorsa loglardan somut hatayi bul. UI tasiyorsa duzelt. Endpoint response'u mobilde eksik parse ediliyorsa modeli/provider'i duzelt. Navigation cikmazi varsa route'u duzelt. Android permission, cleartext HTTP, API URL, build, analyzer, i18n veya demo dokumani eksikse tamamla. Benden onay isteme.

## Mutlak Ilke

Web uygulamasi kanondur; mobil onun telefon ergonomisine uyarlanmis birebir urun karsiligidir.

- Webde bir akis calisiyor, mobilde kirik veya eksikse mobil duzeltilecek.
- Mobilde "yaklasik ayni" kabul edilmeyecek; endpoint, payload, state, hata davranisi, guest/auth/admin ayrimi ve route sonucu weble ayni mantikta olacak.
- Bu promptta "sonra bakariz" sadece native share/export gibi bilincli kapsam disi konular icin kullanilabilir. Kritik auth/analyze/result/history/profile/settings/metrics akislari kapsam disi degildir.
- Test sirasinda bulunan purluzleri once duzelt, sonra tekrar dogrula.
- Finalde sadece yapilanlari degil, hangi akisin nasil dogrulandigini da net yaz.

## Calisma Dizinleri

- Mobil proje: `C:\Users\erayu\Desktop\nihaitez\nihaitezmobil`
- Web proje: `C:\Users\erayu\Desktop\nihaitez\nihaitezweb`
- Web client: `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client`
- API Gateway: `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway`
- Prompt kayitlari: `C:\Users\erayu\Desktop\nihaitez\nihaitezmobil\prompteray`
- Demo dokumani: `C:\Users\erayu\Desktop\nihaitez\nihaitezmobil\docs\mobile_demo_checklist.md`

## Web Kanonunu Gerekince Tekrar Oku

Mobilde bir akisla ilgili suphe olursa su dosyalara bak:

- `nihaitezweb/client/src/App.jsx`
- `nihaitezweb/client/src/services/api.js`
- `nihaitezweb/client/src/store/authStore.js`
- `nihaitezweb/client/src/store/analysisStore.js`
- `nihaitezweb/client/src/lib/guestSession.js`
- `nihaitezweb/client/src/lib/savedRecommendations.js`
- `nihaitezweb/client/src/lib/resultShareCard.js`
- `nihaitezweb/client/src/lib/emotions.js`
- `nihaitezweb/client/src/pages/HomePage.jsx`
- `nihaitezweb/client/src/pages/AnalyzePage.jsx`
- `nihaitezweb/client/src/pages/ResultPage.jsx`
- `nihaitezweb/client/src/pages/HistoryPage.jsx`
- `nihaitezweb/client/src/pages/MetricsPage.jsx`
- `nihaitezweb/client/src/pages/LoginPage.jsx`
- `nihaitezweb/client/src/pages/RegisterPage.jsx`
- `nihaitezweb/client/src/pages/ProfilePage.jsx`
- `nihaitezweb/client/src/locales/tr.js`
- `nihaitezweb/client/src/locales/en.js`
- `nihaitezweb/api-gateway/Controllers/AuthController.cs`
- `nihaitezweb/api-gateway/Controllers/AnalyzeController.cs`
- `nihaitezweb/api-gateway/Controllers/HistoryController.cs`
- `nihaitezweb/api-gateway/Controllers/RecommendationsController.cs`
- `nihaitezweb/api-gateway/Controllers/FeedbackController.cs`
- `nihaitezweb/api-gateway/Controllers/UserController.cs`
- `nihaitezweb/api-gateway/Controllers/MetricsController.cs`
- `nihaitezweb/api-gateway/Controllers/AdminController.cs`
- `nihaitezweb/api-gateway/DTOs/DTOs.cs`

## Sprint Hedefleri

Bu prompt sonunda:

- Backend servisleri calisir durumda kontrol edilmis olacak.
- Mobil uygulama emulator veya fiziksel cihaz varsa gercek backend ile acilmis olacak.
- Cihaz/emulator yoksa durum net raporlanacak ama build/analyze/dokuman dogrulamasi yapilacak.
- Home, Analyze, Result, History, Profile, Settings, Metrics, Login, Register akislari web kanonuna gore smoke test edilmis olacak.
- Testte bulunan kritik kiriklar duzeltilip tekrar dogrulanacak.
- Debug APK alinacak.
- Release APK denenecek; basariliysa artefact yolu yazilacak, basarisizsa somut sebep yazilacak.
- Demo checklist guncellenecek.
- `flutter analyze` temiz olacak.
- i18n ve mojibake taramasi temiz olacak.
- M009-R tamamlandi kaydi ve M010-R sonraki master promptu `prompteray` icine yazilacak.

## 1. Baslangic Envanteri ve Degisiklik Disiplini

Ilk olarak:

- `git status --short` al.
- Mevcut degisiklikleri incele ama kullanicinin veya onceki sprintlerin degisikliklerini revert etme.
- M008-R sonrasi beklenen dosyalarin varligini kontrol et:
  - `lib/features/home/presentation/home_screen.dart`
  - `lib/core/router/app_router.dart`
  - `lib/widgets/bottom_nav_shell.dart`
  - `lib/features/result/presentation/result_screen.dart`
  - `lib/features/profile/presentation/profile_screen.dart`
  - `lib/features/metrics/presentation/metrics_screen.dart`
  - `lib/core/i18n/tr.dart`
  - `lib/core/i18n/en.dart`
- `prompteray/M008-R_tamamlandi_web-kanonundan-birebir-mobil-ui-ve-sayfa-paritesi.md` dosyasini oku ve M009'a kalan riskleri not al.
- Bu sprintte bulunan sorunlari sadece raporlama; makul kapsamdaysa kodu duzelt.

## 2. Backend Saglik Kontrolu

`C:\Users\erayu\Desktop\nihaitez\nihaitezweb` dizininde:

- `docker compose ps`
- Servisler kapaliysa: `docker compose up -d --build`
- Sonra tekrar: `docker compose ps`

Port ve servis kontrolleri:

- API Gateway: `http://localhost:5000`
- AI service: `http://localhost:8000`
- Web frontend: `http://localhost:3000`

Yapilacaklar:

- Health endpoint varsa `Invoke-WebRequest` veya `curl` ile test et.
- Health endpoint yoksa en azindan API Gateway root/known endpoint davranisini kontrol et.
- Docker loglarinda API Gateway veya AI service icin bariz startup hatasi var mi bak.
- Backend env, seed veya admin hesap bilgisi eksik gorunurse sifre yazmadan hangi dosyadan alinacagini dokumante et.
- Mobilin backend URL davranisini tekrar dogrula:
  - Android emulator: `http://10.0.2.2:5000`
  - iOS simulator: `http://localhost:5000`
  - desktop/web: `http://localhost:5000`
  - fiziksel cihaz: `--dart-define=API_BASE_URL=http://<PC_LAN_IP>:5000`

## 3. Flutter Ortam ve Cihaz Hazirligi

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` dizininde:

- `flutter doctor -v`
- `flutter devices`
- `flutter emulators`

Karar agaci:

- Android emulator listede varsa baslat.
- Emulator baslatildiktan sonra cihaz listesinde gorunmesini bekle.
- Fiziksel cihaz varsa USB debugging ve ayni ag kosullarini raporla.
- Hic cihaz/emulator yoksa:
  - Bunu net yaz.
  - Kod/build/dokuman tarafina devam et.
  - `docs/mobile_demo_checklist.md` icine AVD kurulum notunu net ekle.

## 4. Temel Statik Kontrol

Once statik temel temiz olmalı:

- `flutter pub get`
- `flutter analyze`

Analyzer hata verirse:

- Hata/warning hangi dosyadaysa duzelt.
- Format gerekiyorsa `dart format` calistir.
- Tekrar `flutter analyze` calistir.
- `No issues found!` olmadan build/demo finaline gecme.

## 5. Uygulamayi Cihaz/Emulatorde Calistirma

Emulator icin:

- `flutter run -d <emulator-id>`
- API base URL'nin `10.0.2.2:5000` oldugunu Settings veya log uzerinden dogrula.
- Backend'e erisemiyorsa:
  - `ApiConstants.currentBaseUrl`
  - Android cleartext HTTP
  - Docker port
  - Windows firewall
  - emulator network
  kontrollerini yap.

Fiziksel cihaz icin:

- PC LAN IP bul.
- `flutter run -d <device-id> --dart-define=API_BASE_URL=http://<PC_LAN_IP>:5000`
- Telefon ayni agda mi kontrol et.
- Gerekirse firewall/port notu dokumana ekle.

Uygulama acilmiyorsa:

- Flutter loglarindan ilk somut exception'i bul.
- Android manifest, permission, dependency, asset, route, provider init veya storage kaynakliysa duzelt.
- Sadece "calismadi" deme; somut sebep ve duzeltmeyi yaz.

## 6. Web Kanonu E2E Smoke Test Matrisi

Her akis icin su sekilde ilerle:

1. Webdeki beklenen davranisi hatirla veya ilgili web dosyasina bak.
2. Mobilde ayni akisi dene.
3. Gozlenen sonucu not al.
4. Fark veya bug varsa duzelt.
5. Ayni akisi tekrar dene.

### 6.1 Splash ve Onboarding

Kontrol:

- Fresh install/clear storage sonrasi Splash aciliyor mu?
- Onboarding ilk acilista gorunuyor mu?
- Onboarding 3 sayfa akici mi?
- Skip/finish davranisi PreferencesService ile saklaniyor mu?
- Onboarding tamamlaninca `/` Home'a gidiyor mu?
- Sonraki acilista onboarding tekrar gorunmuyor mu?
- Auth restore varsa Home/Profile/Analyze akisi bozulmuyor mu?

Bulunursa duzelt:

- Splash sonsuz loading.
- Onboarding tekrar tekrar acilmasi.
- `/` yerine yanlislikla `/analyze` acilmasi.
- Storage restore race condition.

### 6.2 Home Dashboard

Kontrol:

- `/` ve `/home` Home ekranini acar.
- Product identity webdeki MoodLens/yasam kocu diliyle uyumludur.
- Guest mode quota gosterir.
- Auth mode username/account bilgisini gosterir.
- Quick Analyze `/analyze` route'una gider.
- Latest result varsa `/result/:historyId` linki calisir.
- History/Profile/Settings/Metrics shortcutlari calisir.
- Offline/network banner UI'i bozmadan gorunur.
- Bottom nav Home tabini secili gosterir.

Bulunursa duzelt:

- Overflow.
- CTA yanlis route.
- Metrics admin olmayan kullanicida anlamsiz hata.
- Guest quota null/yanlis gosterim.

### 6.3 Auth Login/Register

Kontrol:

- Register payload web ile ayni: `username`, `email`, `password`, `guestSessionId`.
- Login payload web ile ayni: `email`, `password`, `guestSessionId`.
- Backend response token/user bilgisi secure storage'a yazilir.
- `guestDataMerged` ve `migratedGuestAnalysesCount` gelirse success mesajinda gosterilir.
- Invalid credentials kullanici dostu hata verir.
- Validation hatalari form icinde anlamlidir.
- Guest continue Home'a gider ve guest session korunur.
- Logout token/user temizler ve login akisina dondurur.

Bulunursa duzelt:

- Guest session login/register payload'ina gitmiyorsa.
- Auth response eksik parse ediliyorsa.
- 401 sonrasi storage temizlenmiyorsa.
- UI klavye acilinca button tasiyorsa.

### 6.4 Analyze Studio

Kontrol:

- Text-only analiz backend'e `text` ile gider.
- Image-only analiz backend'e `imageBase64` ve `mimeType` ile gider.
- Text + image multimodal analiz ayni endpoint'e gider.
- `guestSessionId` guest kullanicida payload/header mantigiyla korunur.
- Kamera ve galeri aksiyonlari izin reddinde crash ettirmez.
- Max image size kontrolu calisir.
- Visual consent gorsel secilince anlamli sekilde devreye girer.
- Bos inputta CTA disabled olur.
- Loading state formu kilitler.
- Loading copy/animasyon mobilde premium ve sakin durur.
- Backend warning UI'da sakin band olarak gorunur.
- `needsReason` ve `followUpQuestion` gelirse follow-up kutusu acilir.
- Follow-up cevabi tekrar analiz endpointine gider.
- `guestRemainingAnalyses` local state'e yazilir ve UI guncellenir.
- `GUEST_QUOTA_EXCEEDED` durumunda quota 0 olur ve login/register CTA cikmalidir.
- Backend kapali/offline durumda teknik stack trace degil temiz hata gorunur.

Bulunursa duzelt:

- Payload alan adi farki.
- MIME type eksikligi.
- Base64 prefix/format sorunu.
- Follow-up cevabinin yanlis endpoint veya yanlis payload ile gitmesi.
- Loading bitince state resetlenmemesi.

### 6.5 Result Detail

Kontrol:

- In-memory analyze result varsa direkt gosterilir.
- Cold-start `/result/:historyId` acilinca recommendations/history fallback calisir.
- Emotion badge/hero web duygu mappingiyle uyumludur.
- Confidence ring dogru yuzdeyi gosterir.
- Explanation bos ise guzel fallback var.
- Warning varsa gorunur.
- Metadata gorunur:
  - `modalityUsed`
  - `modelUsed`
  - `responseTimeMs`
  - `faceDetected`
- Recommendations bolumleri gelir:
  - music
  - movie/movies
  - book/books
  - advice/lifeAdvice
- External URL varsa acma butonu calisir.
- Recommendation save/toggle local storage'a yazar.
- Kaydedilen oneriler Profile ekraninda gorunur.
- Feedback bottom sheet acilir.
- Feedback payload backend DTO ile aynidir:
  - `overallRating`
  - `analysisAccuracyRating`
  - `recommendationQualityRating`
  - `helpful`
  - `wouldReuse`
  - `comment`
- Daha once feedback varsa tekrar submit engellenir veya ozet gosterilir.
- New analysis CTA `/analyze` route'una gider.
- History CTA `/history` route'una gider.
- Guest ise login-to-save CTA anlamli yerde gorunur.

Bulunursa duzelt:

- Recommendation alias kaybi.
- Feedback state loop.
- Saved recommendations persist etmemesi.
- Cold-start result bos/kirik kalmasi.

### 6.6 History

Kontrol:

- Guest kullanicida login/register CTA gorunur.
- Auth kullanicida `GET /api/history?page=&limit=` calisir.
- Pagination fields dogru parse edilir:
  - `items`
  - `total`
  - `page`
  - `limit`
  - `totalPages`
- Pull-to-refresh calisir.
- Load-more calisir.
- Empty state Analyze CTA verir.
- Summary alanlari anlamlidir:
  - loaded count
  - top emotion
  - multimodal count
  - average confidence
  - face signal count
- Emotion filter listeyi bozmadan calisir.
- History item card bilgileri:
  - emotion
  - confidence
  - date
  - modality
  - faceDetected
  - explanation snippet
  - userText snippet varsa
- Item tap `/result/:historyId` acilir.

Bulunursa duzelt:

- History item id/null sorunu.
- Date parse sorunu.
- Filter sonucu bos state eksikligi.
- Load-more duplicate item.

### 6.7 Profile

Kontrol:

- Guest profile login/register ihtiyacini net anlatir.
- Auth profile backend `GET /api/user/profile` verisini gosterir:
  - username
  - email
  - role
  - isAdmin
  - createdAt
  - totalAnalyses
  - mostFrequentEmotion
  - feedbackCount varsa
- Language preference TR/EN aninda uygular ve kalici olur.
- Saved recommendations result ekranindan gelen local kayitlari gosterir.
- Saved recommendation remove calisir.
- Admin kullanicida Metrics shortcut gorunur.
- CSV export mobilde paket eklenmeden disabled/not olarak net anlatilir.
- Logout secure storage'i temizler.
- Account delete confirmation backend `deleteConfirmationText` ile birebirdir.
- Dogru metin yazilmadan delete butonu aktif olmaz.
- Basarili delete sonrasi auth state temizlenir ve login'e gidilir.

Bulunursa duzelt:

- Language provider aninda rebuild etmiyorsa.
- Saved recommendations provider init sorunu.
- Account delete payload alan adi farki.
- Logout route loop.

### 6.8 Settings

Kontrol:

- Theme `system/light/dark` degisir ve kalici olur.
- Language `tr/en` degisir ve kalici olur.
- Backend URL dogru gorunur.
- Platform bilgisi dogru gorunur.
- App version gorunur.
- Auth state'e gore profile/login/logout/metrics shortcutlari mantikli gorunur.
- Settings route geri tusuyla onceki ekrana doner.

Bulunursa duzelt:

- Locale/theme provider persist etmiyorsa.
- Debug info yanlis API URL gosteriyorsa.
- Settings UI uzun metinde tasiyorsa.

### 6.9 Metrics/Admin

Kontrol:

- Guest/not logged in -> login CTA.
- Auth ama admin degil -> admin required/permission state.
- Admin -> dashboard data.
- 401/403 teknik hata olarak degil state olarak ele alinir.
- KPI grid gorunur:
  - total analyses
  - total users
  - registered analyses
  - guest analyses
  - average confidence
  - average response time
  - recommendation coverage
  - feedback responses
  - average rating
- Emotion distribution chart/list calisir.
- Response time chart/list calisir.
- Research raw key-value bolumu calisir.
- Comparison raw key-value bolumu calisir.
- Admin overview raw key-value bolumu calisir.
- Empty/error/loading/retry state'leri calisir.

Bulunursa duzelt:

- Chart overflow.
- Raw nested map parse kaybi.
- Non-admin kullanicida exception.
- Admin overview endpoint baglantisi eksikligi.

## 7. UI/UX Son Sertlestirme

Tum ana ekranlarda kontrol et:

- 360px genislikte button text tasiyor mu?
- Text maxLines/ellipsis gereken yerde var mi?
- Keyboard acilinca formun submit butonu erisilebilir mi?
- Light theme'de contrast okunabilir mi?
- Dark theme'de glass kartlar metni gomuyor mu?
- TR copy uzunluklari kartlari patlatiyor mu?
- EN copy dogal mi?
- Loading state sirasinda duplicate submit engelleniyor mu?
- Error state retry butonu kullanisli mi?
- Empty state bir sonraki adima yonlendiriyor mu?
- Bottom nav route secimi dogru mu?
- Geri tusu result/settings/metrics ekranlarinda mantikli mi?
- Gereksiz card-inside-card gorunumu varsa sadeleştir.
- Tek renk mor/lacivert agirligi asiriya kaciyorsa cyan/teal/amber/rose aksanlari dengeli kullan.
- Animasyonlar kullanimi engellemiyor mu?

Buyuk redesign yapma; ama gorunen purluzleri minimal ve net patchlerle duzelt.

## 8. Android/iOS Platform Sertlestirme

Kontrol edilecek dosyalar:

- `android/app/src/main/AndroidManifest.xml`
- `android/app/build.gradle` veya mevcut Gradle dosyalari
- `ios/Runner/Info.plist`
- `lib/core/constants/api_constants.dart`
- `lib/core/network/dio_client.dart`

Kontrol:

- Internet permission var mi?
- Camera permission var mi?
- Gallery/photo permission gereksinimleri makul mu?
- Android cleartext HTTP demo icin izinli mi?
- App label MoodLens mi?
- minSdk build icin yeterli mi?
- `--dart-define=API_BASE_URL=...` calisiyor mu?
- Production icin HTTPS notu README/demo checklist icinde var mi?

Bulunursa duzelt:

- Eksik Android permission.
- Cleartext HTTP nedeniyle backend'e erisememe.
- Yanlis app label.
- API URL platform fallback hatasi.

## 9. Build Artefactlari

Zorunlu:

- `flutter build apk --debug`
- `flutter build apk --release`

Build hatasi cikarsa:

- Hata dependency/resource/manifest/minSdk ise duzelt.
- Release signing/keystore bekleniyorsa ve proje signing ayari yoksa net raporla.
- Debug APK demo icin yeterli fallback olarak dokumante et.

Raporlanacak yollar:

- Debug APK: `build/app/outputs/flutter-apk/app-debug.apk`
- Release APK: `build/app/outputs/flutter-apk/app-release.apk` veya gercek olusan yol

## 10. Demo Dokumani

`docs/mobile_demo_checklist.md` dosyasini olustur veya guncelle.

Icerik zorunlu:

- Backend baslatma:
  - `docker compose up -d --build`
  - `docker compose ps`
- Mobil hazirlik:
  - `flutter pub get`
  - `flutter analyze`
  - `flutter devices`
  - `flutter emulators`
- Emulator run:
  - `flutter run -d <emulator-id>`
  - backend URL: `http://10.0.2.2:5000`
- Fiziksel cihaz run:
  - PC LAN IP nasil bulunur.
  - `flutter run -d <device-id> --dart-define=API_BASE_URL=http://<PC_LAN_IP>:5000`
- APK build:
  - debug build komutu
  - release build komutu
  - artefact yollari
- Demo akisi:
  1. Splash/onboarding
  2. Register veya login
  3. Home dashboard
  4. Text-only analiz
  5. Gallery/camera image analiz
  6. Multimodal analiz
  7. Result + recommendations
  8. Save recommendation
  9. Feedback
  10. History filter/detail
  11. Profile saved recommendations/language/logout
  12. Settings theme/language/backend info
  13. Admin metrics
- Test/admin hesap notu:
  - Sifreleri repoya yazma.
  - Lokal env/seed dosyasinda nereden bulunacagini belirt.
- Bilinen limitler:
  - Yerel HTTP.
  - Fiziksel cihaz LAN IP gerekir.
  - CSV export mobilde disabled.
  - Native result share/export sonraki sprint olabilir.
- Hizli sorun giderme:
  - Backend kapali.
  - Yanlis API_BASE_URL.
  - Docker port cakismasi.
  - Windows firewall.
  - Kamera/galeri izni.
  - Secure storage temizleme.
  - Emulator internete cikamiyor.

## 11. i18n, Encoding ve Statik Final Kontrol

Zorunlu final komutlari:

- `flutter pub get`
- `flutter analyze`
- i18n key kontrol scripti:
  - `t('...')` ile kullanilan tum key'ler `tr.dart` ve `en.dart` icinde olmali.
- Mojibake taramasi:
  - Latin mojibake A-with-tilde marker.
  - Latin mojibake A-with-diaeresis marker.
  - Latin mojibake A-with-ring marker.
  - Unicode replacement character marker.
  - Curly quote mojibake marker.
  - Broken emoji mojibake marker.

Final oncesi:

- Analyzer `No issues found!` degilse final verme.
- i18n missing key varsa final verme.
- Bozuk encoding varsa duzelt.
- Yeni dosyalarda dokuman yorum blogu olsun.

## 12. Prompt Kaydi

Is tamamlandiginda:

`prompteray/M009-R_tamamlandi_web-kanonu-cihaz-e2e-release-demo-qa.md` olustur.

Icerik:

- Hangi backend servisleri calisti?
- Hangi cihaz/emulator test edildi?
- Cihaz yoksa neden test edilemedi?
- Hangi smoke testler gecildi?
- Hangi sorunlar bulundu ve duzeltildi?
- Debug APK yolu.
- Release APK yolu veya release build engeli.
- Demo checklist guncellendi mi?
- Kalan riskler neler?

Ayrica sonraki master promptu kaydet:

`prompteray/M010-R_native-share-export-polish-ve-final-sunum-deneyimi.md`

M010-R odagi:

- Native share/export.
- Result share card mobil karsiligi.
- PDF/image export veya share sheet.
- Daha gelismis saved recommendations yonetimi.
- Demo sunumunda gorsel etkiyi artiracak mikro animasyonlar.
- Son rapor/sunum materyali entegrasyonu.

## Kabul Kriterleri

1. `git status --short` ile baslangic durumu gorulur.
2. Backend servisleri kontrol edilir; kapaliysa baslatilir.
3. API Gateway ve AI service portlari kontrol edilir.
4. `flutter doctor -v`, `flutter devices`, `flutter emulators` sonuclari alinir.
5. Emulator veya fiziksel cihaz varsa uygulama gercek backend ile acilir.
6. Cihaz yoksa durum net raporlanir ama build/analyze/dokuman dogrulamasi yapilir.
7. Splash/onboarding/auth restore test edilir.
8. Home dashboard test edilir.
9. Login/register/logout/guest merge test edilir.
10. Text-only analyze test edilir.
11. Image-only analyze test edilir.
12. Multimodal analyze test edilir.
13. Camera/gallery permission flow test edilir.
14. Guest quota ve `GUEST_QUOTA_EXCEEDED` davranisi test edilir.
15. Follow-up question akisi test edilir veya backendden tetiklenemiyorsa kod/kontrat seviyesinde dogrulanir.
16. Result emotion/confidence/explanation/metadata test edilir.
17. Recommendations music/movie/book/advice test edilir.
18. Saved recommendation Profile ekraninda gorulur.
19. Feedback GET/POST test edilir.
20. History pagination/refresh/load-more/filter/detail test edilir.
21. Profile guest/auth/admin state test edilir.
22. Settings theme/language/backend info test edilir.
23. Metrics guest/non-admin/admin state test edilir.
24. UI overflow/light-dark/TR-EN kontrolleri yapilir.
25. Android/iOS permission ve cleartext HTTP ayarlari kontrol edilir.
26. `flutter build apk --debug` basarili olur.
27. `flutter build apk --release` denenir ve sonucu net raporlanir.
28. `docs/mobile_demo_checklist.md` guncellenir.
29. `flutter pub get` basarilidir.
30. `flutter analyze` `No issues found!` verir.
31. i18n key kontrolu temizdir.
32. Mojibake taramasi temizdir.
33. M009-R tamamlandi kaydi `prompteray` icine yazilir.
34. M010-R master promptu `prompteray` icine yazilir.

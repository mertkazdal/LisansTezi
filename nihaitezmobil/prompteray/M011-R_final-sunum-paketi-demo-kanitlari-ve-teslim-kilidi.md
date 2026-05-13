## Sana verecegim prompt

M011-R - Final Sunum Paketi, Demo Kanitlari ve Teslim Kilidi

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M007-R backend kontrat paritesi, M008-R web kanonundan mobil UI/sayfa paritesi, M009-R cihaz E2E/release QA ve M010-R native share/export polish tamamlandi. Bu sprintte hedef yeni buyuk ozellik eklemek degil; tez final sunumunda mobil uygulamanin guvenle gosterilecegini kanitlamak, demo verisini hizlandirmak, ekran kanitlarini toplamak, son release kontrollerini kilitlemek ve teslim dokumanlarini tek yerde toparlamaktir.

Mutlak ilke:

Web uygulamasi hala kanondur. Mobil uygulama web urununun telefon ergonomisine uyarlanmis birebir karsiligidir. Bu sprintte yeni feature pesinde kosma; web kanonundan sapma, demo kirigi, belge eksigi, build riski, cihaz riski veya sunumda takilacak bir purluz varsa onu kapat.

Calisma dizinleri:

- Mobil proje: `C:\Users\erayu\Desktop\nihaitez\nihaitezmobil`
- Web proje: `C:\Users\erayu\Desktop\nihaitez\nihaitezweb`
- API Gateway: `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\api-gateway`
- Web client: `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client`
- Prompt kayitlari: `C:\Users\erayu\Desktop\nihaitez\nihaitezmobil\prompteray`
- Demo dokumani: `C:\Users\erayu\Desktop\nihaitez\nihaitezmobil\docs\mobile_demo_checklist.md`

Referans dosyalar:

- `nihaitezweb/client/src/App.jsx`
- `nihaitezweb/client/src/services/api.js`
- `nihaitezweb/client/src/pages/HomePage.jsx`
- `nihaitezweb/client/src/pages/AnalyzePage.jsx`
- `nihaitezweb/client/src/pages/ResultPage.jsx`
- `nihaitezweb/client/src/pages/HistoryPage.jsx`
- `nihaitezweb/client/src/pages/MetricsPage.jsx`
- `nihaitezweb/client/src/pages/ProfilePage.jsx`
- `nihaitezweb/client/src/lib/resultShareCard.js`
- `nihaitezweb/client/src/lib/savedRecommendations.js`
- `nihaitezweb/api-gateway/Controllers/*.cs`
- `nihaitezweb/api-gateway/DTOs/DTOs.cs`

Amac:

- Final demo icin backend + mobil run komutlari dogrulanmis olsun.
- Demo akisi icin lokal test verisi veya veri uretim yolu net olsun.
- Mobil uygulamanin ana ekranlari icin ekran goruntuleri toplanmis olsun.
- Result share card ve saved recommendations fiziksel cihaz/emulator uzerinde son kez denenmis olsun.
- Debug APK ve release APK artefactlari alinmis olsun.
- Tez sunumunda anlatilacak mobil urun akisi tek dokumanda hazir olsun.
- Bilinen limitler, hizli sorun giderme ve admin/demo notlari net olsun.
- `flutter analyze`, i18n, mojibake ve build kontrolleri temiz kalsin.

Kapsam:

### 1. Baslangic envanteri

Ilk olarak:

- `git status --short -- .` al.
- `prompteray/M010-R_tamamlandi_native-share-export-polish-ve-final-sunum-deneyimi.md` oku.
- `docs/mobile_demo_checklist.md` oku.
- Son sprintlerden kalan riskleri not al.
- Kullanici veya onceki sprint degisikliklerini revert etme.

Beklenen dosyalar:

- `lib/features/home/presentation/home_screen.dart`
- `lib/features/analyze/presentation/analyze_screen.dart`
- `lib/features/result/presentation/result_screen.dart`
- `lib/features/profile/presentation/profile_screen.dart`
- `lib/features/metrics/presentation/metrics_screen.dart`
- `lib/core/router/app_router.dart`
- `docs/mobile_demo_checklist.md`

### 2. Backend ve demo veri hazirligi

`C:\Users\erayu\Desktop\nihaitez\nihaitezweb` icinde:

- `docker compose ps`
- Gerekirse `docker compose up -d --build`
- `docker ps --filter "name=tezfinal"`
- API Gateway health kontrolu.
- AI service health kontrolu.
- Web frontend port kontrolu.

Demo veri:

- Sifreleri veya gercek credential'lari repoya yazma.
- Mevcut backend demo mode/env dosyalarindan admin nasil atanir dokumante et.
- Lokal test hesabi icin sadece hesap olusturma adimini yaz; sifreyi dosyaya koyma.
- API probe ile en az su verilerin olusturulabildigini dogrula:
  - register/login
  - text analysis
  - image veya multimodal analysis
  - feedback
  - history item
  - profile
  - non-admin metrics 403 state
- Gerekirse `docs/mobile_demo_checklist.md` icine "demo verisini hizli hazirlama" bolumu ekle.

### 3. Cihaz, emulator ve API URL final kontrolu

Mobil proje icinde:

- `flutter doctor -v`
- `flutter devices`
- `flutter emulators`

Kontrol:

- Android emulator varsa `emulator-5554` veya mevcut device ile calistir.
- Fiziksel cihaz varsa PC LAN IP yolunu tekrar dokumante et.
- Settings ekraninda API URL gorunumu:
  - emulator: `http://10.0.2.2:5000`
  - fiziksel cihaz: `--dart-define=API_BASE_URL=http://<PC_LAN_IP>:5000`
  - desktop/web: `http://localhost:5000`
- Android cleartext HTTP, internet/camera/photo permission ve app label kontrolunu tekrar yap.

### 4. Final mobil smoke akisi

Emulator veya fiziksel cihaz varsa gercek backend ile:

1. Fresh app/session restore.
2. Splash ve onboarding.
3. Guest devam.
4. Home dashboard.
5. Analyze text-only.
6. Result emotion/confidence/explanation/metadata.
7. Result recommendations.
8. Result share as image.
9. Result text share fallback butonu.
10. Recommendation save.
11. Profile saved recommendations filtreleri.
12. Saved recommendation external link ve source result link.
13. Saved recommendation remove ve clear all confirmation.
14. Gallery image veya camera permission flow.
15. Register/login.
16. Authenticated history.
17. Feedback submit/read-back.
18. Profile language switch.
19. Settings theme/language/backend info.
20. Metrics guest/non-admin/admin-ready state.

Bulunan kritik sorunlari sadece raporlama; makul kapsamdaysa duzelt ve tekrar dogrula.

### 5. Ekran kanitlari ve sunum materyali

Ekran goruntusu hedefleri:

- Home dashboard
- Analyze studio
- Result emotion hero
- Result share card preview
- Recommendations section
- Feedback sheet
- History list
- Profile saved recommendations filtered list
- Settings backend/theme/language
- Metrics permission veya admin dashboard

Yapilacaklar:

- Emulator varsa `adb exec-out screencap -p` veya uygun Flutter/device screenshot yolu ile PNG al.
- Dosyalari `docs/screenshots/` altina anlamli adlarla kaydet.
- Her screenshot icin kisa aciklama iceren `docs/mobile_screenshot_index.md` olustur.
- Screenshot alinamazsa sebebini yaz ve manuel alma komutlarini dokumante et.

### 6. Final demo runbook

Yeni veya mevcut dosya:

- `docs/final_demo_runbook.md`

Icerik:

- 5 dakikalik hizli demo akisi.
- 10-12 dakikalik detayli tez demo akisi.
- Backend baslatma komutlari.
- Mobil run komutlari.
- APK kurulum yolu.
- Test hesabi olusturma notu.
- Admin metrikleri icin env notu.
- Sorun cikarsa ilk bakilacak 10 madde.
- Fiziksel cihaz icin LAN IP ve firewall notu.
- Result share/export anlatim cumleleri.
- Web kanonu ile mobil parite anlatim cumleleri.

### 7. UI, accessibility ve text scale son tur

Kontrol:

- 360px genislikte button ve kart overflow yok.
- TR metinlerde tasma yok.
- EN metinlerde dogal copy var.
- Text scale 1.2 civarinda ana ekranlar patlamiyor.
- Light/dark theme okunabilir.
- Keyboard acilinca login/register/analyze CTA erisilebilir.
- Bottom nav secili state dogru.
- Result ve Profile geri butonu mantikli.
- Loading/error/empty state demo sirasinda anlasilir.
- Native share ve external URL aksiyonlari hata durumunda crash etmiyor.

Gerekirse minimal patch yap; buyuk redesign yapma.

### 8. Build ve artefact kilidi

Zorunlu:

- `flutter pub get`
- `flutter analyze`
- i18n key kontrolu
- mojibake taramasi
- `flutter build apk --debug`
- `flutter build apk --release`

Raporla:

- Debug APK yolu.
- Release APK yolu.
- APK boyutlari.
- Release signing debug keystore ile mi, gercek release key mi?
- Release build hata verirse somut sebep.

### 9. Son dokuman temizligi

Guncelle:

- `docs/mobile_demo_checklist.md`
- `docs/final_demo_runbook.md`
- `docs/mobile_screenshot_index.md` varsa.

Kontrol:

- Sifre yok.
- Gercek kisiel veri yok.
- Yerel IP gibi degisebilir bilgi aciklama olarak yazilmis, sabit zorunluluk gibi yazilmamis.
- CSV export, native share, physical device, admin metrics gibi limitler net.

### 10. Prompt kaydi

Is tamamlandiginda:

- `prompteray/M011-R_tamamlandi_final-sunum-paketi-demo-kanitlari-ve-teslim-kilidi.md` olustur.
- Hangi cihaz/emulator test edildi yaz.
- Hangi screenshotlar alindi yaz.
- Hangi build artefactlari alindi yaz.
- Hangi dokumanlar guncellendi yaz.
- Kalan riskleri net yaz.

Sonraki master promptu kaydet:

- `prompteray/M012-R_opsiyonel-son-parlatma-sunum-gorselleri-ve-yayin-hazirligi.md`

M012-R odagi:

- Opsiyonel tanitim/sunum gorselleri.
- App icon/splash final polish.
- Kisa demo video veya GIF.
- Tez raporu ekran gorselleri entegrasyonu.
- Production HTTPS/signing/yayin checklist.
- Kod dondurma ve final teslim etiketi.

Kabul kriterleri:

1. Backend servisleri kontrol edilir ve gerekiyorsa baslatilir.
2. Flutter cihaz/emulator durumu raporlanir.
3. Mobil app gercek backend ile emulator veya fiziksel cihazda acilir; cihaz yoksa sebep net yazilir.
4. Home, Analyze, Result, History, Profile, Settings, Metrics akislarindan final smoke gecilir.
5. Result share PNG ve text fallback akislarindan en az biri runtime'da denenir.
6. Saved recommendations filtre/sil/clear/source/external akislari denenir.
7. Demo veri hazirlama yolu dokumante edilir.
8. Ekran kanitlari `docs/screenshots/` altina alinabilir veya manuel komutlarla dokumante edilir.
9. `docs/final_demo_runbook.md` olusturulur.
10. `docs/mobile_demo_checklist.md` final duruma guncellenir.
11. `flutter pub get` basarili.
12. `flutter analyze` `No issues found!`.
13. i18n key kontrolu temiz.
14. Mojibake taramasi temiz.
15. Debug APK build basarili.
16. Release APK build denenir ve sonucu net.
17. Sifre veya gizli credential repoya yazilmaz.
18. M011-R tamamlandi kaydi prompteray icine yazilir.
19. M012-R master promptu prompteray icine kaydedilir.

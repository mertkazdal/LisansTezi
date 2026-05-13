## Sana verecegim prompt

M009 - Tam E2E Demo, Admin Hesap Testleri ve Sunum Varliklari

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M007 backend kontrat paritesi ve M008 web sayfa paritesi/premium mobil UI tamamlandiktan sonra artik tam test ve demo sertlestirme turuna gec. Bu adimda hedef yeni feature eklemek degil; Android emulator veya fiziksel cihazda tum kritik akislarin gercek backend ile calistigini kanitlamak, ekran goruntulerini almak, build artefactlarini yenilemek ve tez sunumu icin son demo paketini hazirlamak.

Bu prompttan once testlere erken gecilmemis olmali; backend baglantisi ve mobil web paritesi zaten oturmus kabul edilir. Bu adimda tam E2E smoke, admin hesap, screenshot, release build ve kalan risk raporu yap.

## Amac

Tez demosu icin tam uc uca mobil prova yapmak:

- Android `MoodLensDemo` emulator veya fiziksel cihazda uygulamayi calistir.
- Backend servislerini dogrula ve gerekirse yeniden baslat.
- Demo kullanicisi ile register/login akisini test et.
- Admin kullanicisini backend `ADMIN_EMAILS` veya `ADMIN_USERNAMES` ile yetkilendir ve metrics ekranini gercek test et.
- Guest analizlerinin hesaba tasinma mesajini test et.
- Text-only, image-only ve multimodal analiz akislarini test et.
- Result, recommendations, feedback, history, profile, settings ve metrics ekranlarini elle gez.
- Kamera/galeri izinleri ve hata durumlarini kontrol et.
- Kritik ekranlardan temiz ekran goruntuleri al.
- Demo checklist'i son duruma gore guncelle.
- Kalan riskleri net ve kisa raporla.

## Kapsam

### 1. Backend ve admin demo hesabi hazirligi

Yapilacaklar:

- `docker ps -a --filter "name=tezfinal"` ile container durumunu kontrol et.
- API/AI/frontend health endpointlerini kontrol et.
- Admin yetkisi icin backend environment mantigini tekrar dogrula:
  - `ADMIN_EMAILS`
  - `ADMIN_USERNAMES`
- Demo admin hesabi icin sifreyi repoya yazmadan lokal olarak belirle.
- Gerekirse containerlari uygun env ile yeniden baslat:
  - Admin email/username degerleri env'e eklenmis olsun.
  - Mevcut veriyi silmeden ilerlemeye dikkat et.
- Admin hesabi yoksa mobil veya API uzerinden kayit olustur, sonra admin env ile login ederek metrics ekranini test et.

### 2. Android cihaz/emulator calistirma

Yapilacaklar:

- `flutter devices`
- `flutter emulators`
- `MoodLensDemo` AVD kapaliysa baslat.
- Boot tamamlanana kadar `adb shell getprop sys.boot_completed` ile bekle.
- Uygulamayi debug APK ile kur veya `flutter run -d emulator-5554` ile calistir.
- Fiziksel cihaz varsa ek olarak:
  - PC LAN IP adresini bul.
  - `--dart-define=API_BASE_URL=http://<PC_LAN_IP>:5000` ile build/run dene.

### 3. Tam mobil demo akisi

Elle ve ekran goruntusuyle dogrula:

- Onboarding:
  - 3 sayfa gorunur.
  - Skip ve finish davranisi dogru.
  - Tamamlaninca tekrar acilmaz.
- Guest:
  - Continue as guest calisir.
  - Kalan analiz hakki gorunur.
  - Guest quota azalir.
- Auth:
  - Register basarili.
  - Login basarili.
  - Logout login ekranina dondurur.
  - Guest merge success mesaji dogru.
- Analyze:
  - Text-only analiz.
  - Gallery image-only analiz.
  - Camera aksiyonu ve izin davranisi.
  - Text + image multimodal analiz.
  - Bos input disabled.
  - Backend kapali/network hata mesaji anlasilir.
- Result:
  - Emotion, confidence, explanation.
  - Modality, model, response time, face status.
  - Recommendations bolumleri.
  - New analysis CTA.
- Feedback:
  - Bottom sheet acilir.
  - Rating/switch/comment kontrolleri calisir.
  - Submit backend'e gider.
  - Mevcut feedback tekrar gorunur.
- History:
  - Liste gelir.
  - Pull-to-refresh calisir.
  - History item result detayina gider.
- Profile:
  - Auth profil verisi gelir.
  - Guest profil login CTA gosterir.
  - Account delete confirmation dogru kilitlenir; gercek silme sadece demo icin gerekiyorsa yap.
- Settings:
  - Tema dark/light/system degisir.
  - Dil TR/EN degisir.
  - Backend URL/platform bilgisi dogru.
- Metrics:
  - Non-admin yetki mesaji gorur.
  - Admin dashboard verisi veya bos state gorur.
  - Emotion distribution/response times/research/comparison kartlari gorunur.
  - Retry calisir.

### 4. Ekran goruntuleri ve demo varliklari

Yeni klasor:

- `docs/demo_screenshots/`

Alinacak ekranlar:

- onboarding
- home
- login/register
- analyze
- result
- feedback
- history
- profile
- settings
- metrics admin
- metrics unauthorized

Yapilacaklar:

- Ekran goruntulerini `adb exec-out screencap -p` ile al.
- Dosya adlari acik olsun:
  - `01_onboarding.png`
  - `02_home.png`
  - `03_login.png`
  - `04_analyze.png`
  - ...
- Screenshot indeksini `docs/mobile_demo_checklist.md` icine ekle.

### 5. Son UI ve hata purluzleri

Kontrol et:

- Dark/light theme kontrasti.
- TR/EN uzun metin tasmalari.
- Kart icinde kart hissi veya asiri bosluk.
- Klavye acilinca form alanlari ve CTA erisimi.
- Loading state'te tekrar submit engeli.
- Backend hata mesajlarinin kullanici dostu gorunmesi.
- Android permission dialoglari.

Yalnizca net sorunlari duzelt:

- Minimal UI patch.
- Minimal i18n copy patch.
- Minimal route/provider state patch.
- Buyuk refactor yapma.

### 6. Build ve teslim paketi

Yapilacaklar:

- `flutter pub get`
- `flutter analyze`
- `flutter build apk --debug`
- `flutter build apk --release`
- APK yollarini ve boyutlarini raporla.
- Release APK'nin debug signing ile imzalandigini tekrar belirt.
- Production icin gercek keystore adimlarini `docs/mobile_demo_checklist.md` icine not et.

### 7. Prompt kaydi

Bu M009 isi tamamlandiginda:

- `prompteray/M009_tamamlandi_tam-e2e-demo-admin-hesap-testleri-ve-sunum-varliklari.md` dosyasini olustur.
- Test edilen cihaz, hesap turleri, backend durumu, screenshot listesi, build yollari ve kalan riskleri yaz.
- Sonraki gerekiyorsa M010 promptunu kaydet:
  - Store/release signing, tez raporu entegrasyonu, performans optimizasyonu veya final bug bash odakli olabilir.

## Kabul kriterleri

1. Backend health endpointleri 200 doner.
2. Android emulator veya fiziksel cihazda uygulama acilir.
3. Onboarding, home, guest, auth, analyze, result, feedback, history, profile, settings ve metrics akislarindan manuel smoke gecilir.
4. Admin metrics gercek admin yetkisiyle denenir.
5. Non-admin metrics yetki mesaji denenir.
6. Text-only, image-only ve multimodal analiz en az birer kez denenir veya net cihaz/izin riski raporlanir.
7. Feedback submit backend'e gider.
8. History result fallback calisir.
9. Tema ve dil degisimleri cihazda gorulur.
10. Demo screenshotlari `docs/demo_screenshots/` icine kaydedilir.
11. `flutter pub get` basarili.
12. `flutter analyze` `No issues found!`.
13. Debug APK basarili.
14. Release APK basarili veya signing/ortam eksigi net raporlanir.
15. Demo checklist son duruma gore guncellenir.
16. Kalan riskler net yazilir.
17. M009 tamamlandi kaydi prompteray klasorune eklenir.

## Sana verecegim prompt

M006 - Release Build, Cihaz Smoke Testi ve Tez Demo Paketi

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M001-M005 ile kurulan mobil urun deneyimini gercek demo ve teslim hazirligina tasi. Bu adimda hedef yeni buyuk feature eklemek degil; uygulamayi Android cihaz/emulator uzerinde gezilebilir hale getirmek, backend ile uc uca smoke test yapmak, build artefactlarini almak, demo senaryosunu dokumante etmek, son kullanici gozunde gorunen purluzleri temizlemek ve tez sunumunda risk cikarmayacak bir mobil paket hazirlamaktir.

Bu promptu gercek bir release/QA sprinti gibi ele al. Once mevcut backend ve mobil proje durumunu oku, sonra cihaz/emulator imkanini kontrol et. Android emulator yoksa kurulum gereksinimlerini net raporla; emulator veya fiziksel cihaz varsa uygulamayi calistir, kritik akislarin tamamini backend ile dene, yakaladigin hatalari duzelt ve tekrar dogrula. Benden onay isteme; gerekli dependency, Android/iOS ayari, README/QA dokumani, demo checklist ve build komutlarini uygulamak icin tum kontrol sende.

## Amac

Mobil uygulamayi tez demosu ve teslimi icin guvenilir hale getirmek:

- Backend servisleri calisirken mobil uygulama gercek cihaz/emulatorde acilsin.
- Login/register, guest, analiz, result, history, feedback, profile, settings ve admin metrics akislari uc uca smoke test edilsin.
- Android debug APK veya release APK alinabilsin.
- Fiziksel cihaz senaryosu icin `API_BASE_URL` ve yerel ag notlari net olsun.
- Demo sirasinda izlenecek kullanici senaryosu tek dokumanda toplansin.
- UI'da overflow, bos state, loading state, navigation kopuklugu veya backend hata mesaji gibi goze batan son purluzler temizlensin.
- Tez sunumu icin test hesabi, demo verisi, bilinen limitler ve hizli sorun giderme notlari hazir olsun.

## Kapsam

### 1. Baslangic durumu ve backend saglik kontrolu

Referans dizinler:

- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezmobil`

Yapilacaklar:

- `docker compose ps` ile backend servis durumunu kontrol et.
- Servisler kapaliysa `docker compose up -d --build` ile calistir.
- API Gateway, AI service ve frontend portlarini kontrol et:
  - API Gateway: `http://localhost:5000`
  - AI service: `http://localhost:8000`
  - Web frontend: `http://localhost:3000`
- API health endpointi varsa terminalden test et.
- Backend demo mode, admin hesap bilgisi, seed data veya env eksigi varsa raporla.
- Mobil uygulamanin `ApiConstants.currentBaseUrl` davranisini cihaz tipine gore tekrar dogrula.

### 2. Cihaz/emulator hazirligi

Yapilacaklar:

- `flutter devices` sonucunu al.
- `flutter emulators` sonucunu al.
- Android AVD varsa baslat ve cihaz listesinde gorunmesini bekle.
- Fiziksel cihaz varsa USB debugging ve ayni ag gereksinimlerini raporla.
- Hic Android cihaz/emulator yoksa:
  - README icinde AVD kurulum notu yeterli mi kontrol et.
  - Gerekiyorsa `docs/mobile_demo_checklist.md` icine net AVD kurulum ve demo hazirlik maddeleri ekle.
  - Kod tarafinda yine `flutter analyze` ve build seviyesinde dogrulamaya devam et.

### 3. Mobil uygulamayi cihaz/emulatorde calistir

Yapilacaklar:

- `flutter pub get`
- `flutter analyze`
- Android emulator icin:
  - `flutter run -d <emulator-id>`
  - Varsayilan backend URL `http://10.0.2.2:5000` ile calistigini dogrula.
- Fiziksel Android cihaz icin:
  - PC LAN IP adresini bul.
  - `flutter run -d <device-id> --dart-define=API_BASE_URL=http://<PC_LAN_IP>:5000`
  - Telefonun PC backend portuna erisebildigini dogrula.
- Uygulama acilmazsa logcat/Flutter loglarindan ilk somut hatayi bul ve duzelt.

### 4. Uc uca smoke test senaryolari

Mumkunse gercek cihaz/emulatorde, degilse kod seviyesinde ve backend kontratiyla kontrol et:

- Splash:
  - Onboarding tamamlanma ve auth restore yonlendirmesi dogru mu?
- Onboarding:
  - Sadece ilk acilista gorunuyor mu?
  - Tamamlaninca tekrar acilmiyor mu?
- Auth:
  - Register backend'e gidiyor mu?
  - Login backend'e gidiyor mu?
  - Token/user secure storage'a yaziliyor mu?
  - Logout storage'i temizleyip login'e donduruyor mu?
  - Guest merge mesaji dogru gorunuyor mu?
- Analyze:
  - Text-only analiz backend'e dogru payload ile gidiyor mu?
  - Gallery image analiz base64/mimeType ile gidiyor mu?
  - Camera izin akisi uygulamayi crash ettirmiyor mu?
  - Offline veya backend kapali durumda mesaj anlasilir mi?
  - Guest quota 0 oldugunda login/register CTA dogru mu?
  - Follow-up question geldiyse ikinci analiz akisi calisiyor mu?
- Result:
  - Emotion, confidence, explanation, metadata ve recommendations gorunuyor mu?
  - Cold-start/deep result fallback anlasilir mi?
  - Feedback bottom sheet acilip submit ediyor mu?
- History:
  - Paginated liste geliyor mu?
  - Pull-to-refresh ve load-more calisiyor mu?
  - History item result detayina gidiyor mu?
- Profile:
  - Auth kullanici profil verisini goruyor mu?
  - Guest kullanici login CTA goruyor mu?
  - Account delete confirmation guvenli mi?
- Settings:
  - Tema degisimi aninda uygulanip kalici oluyor mu?
  - Dil degisimi aninda uygulanip kalici oluyor mu?
  - Backend URL ve platform bilgileri dogru gorunuyor mu?
- Metrics:
  - Admin olmayan kullanici yetki mesajini goruyor mu?
  - Admin kullanici dashboard verisini veya bos state'i goruyor mu?
  - Retry butonu calisiyor mu?

### 5. UI polish ve mobil ergonomi son turu

Yapilacaklar:

- Kucuk ekranlarda text overflow, button overflow, kart icinde kart ve asiri bosluk kontrolu yap.
- Uzun backend hata mesajlari ekran tasarimini bozmuyor mu kontrol et.
- Loading state'lerde form ve CTA'lar mantikli kilitleniyor mu kontrol et.
- Light/dark theme gecisinde okunabilirlik bozuluyor mu kontrol et.
- TR/EN dil degisiminde uzun metinler tasiyor mu kontrol et.
- Gerekiyorsa minimal UI duzeltmeleri yap; buyuk refactor yapma.

### 6. Build artefactlari

Yapilacaklar:

- Debug APK build:
  - `flutter build apk --debug`
- Release APK build mumkunse:
  - `flutter build apk --release`
- Release signing eksikse:
  - Bunu net raporla.
  - Debug APK'nin demo icin nerede olustugunu belirt.
- Build sirasinda Android minSdk/permission/manifest hatasi cikarsa duzelt.
- Build sonucu dosya yolunu raporla.

### 7. Demo dokumani ve checklist

Gerekirse yeni dosya:

- `docs/mobile_demo_checklist.md`

Icerik:

- Backend baslatma komutlari.
- Mobil run komutlari.
- Emulator ve fiziksel cihaz URL farklari.
- Demo akisi:
  1. Onboarding
  2. Register/login
  3. Text analysis
  4. Image analysis
  5. Result + recommendations
  6. Feedback
  7. History
  8. Profile/settings
  9. Admin metrics
- Test hesabi/admin hesabi notlari. Sifreleri repoya yazma; sadece nasil alinacagini veya lokal env/seed referansini belirt.
- Bilinen limitler:
  - Demo mode
  - Yerel HTTP
  - Fiziksel cihaz icin LAN IP
  - Android emulator yoksa AVD kurulum gereksinimi
- Hizli sorun giderme:
  - Backend kapali
  - Yanlis API_BASE_URL
  - Kamera/galeri izni
  - Docker port cakismasi

### 8. i18n, analyzer ve kalite son kontrolu

Yapilacaklar:

- `t('...')` ile kullanilan tum key'lerin `tr.dart` ve `en.dart` icinde oldugunu script ile dogrula.
- Bozuk encoding/metin taramasini tekrar yap.
- `flutter analyze` sifir issue olmali.
- `flutter pub get` tekrar basarili olmali.
- Degisiklikleri ozetle ve kalan manuel cihaz riski varsa net yaz.

### 9. Prompt kaydi

Bu M006 isi tamamlandiginda:

- `prompteray/M006_tamamlandi_release-build-cihaz-smoke-testi-ve-tez-demo-paketi.md` dosyasini olustur.
- Hangi cihaz/emulator test edildi, hangi build alindi, hangi akislardan gecildi ve hangi riskler kaldi yaz.
- Bir sonraki gelistirme adimi icin M007 master promptunu yine `prompteray` icine detayli kaydet.

## Kabul kriterleri

1. `flutter pub get` basariyla calisir.
2. `flutter analyze` `No issues found!` verir.
3. `flutter devices` ve `flutter emulators` sonuclari raporlanir.
4. Android emulator veya fiziksel cihaz varsa uygulama `flutter run` ile acilir.
5. Cihaz/emulator varsa auth, analyze, result, feedback, history, profile, settings ve metrics smoke test edilir.
6. Cihaz/emulator yoksa eksik net raporlanir ve demo checklist buna gore guncellenir.
7. Backend servisleri calisir durumda kontrol edilir veya baslatilir.
8. Android emulator default `10.0.2.2` backend URL davranisi dogrulanir.
9. Fiziksel cihaz icin `--dart-define=API_BASE_URL=http://<PC_LAN_IP>:5000` yolu dokumante edilir.
10. `flutter build apk --debug` basarili olur.
11. `flutter build apk --release` denenir; signing veya ortam eksigi varsa net raporlanir.
12. Build artefact yolu raporlanir.
13. Demo akisi icin `README.md` veya `docs/mobile_demo_checklist.md` guncellenir.
14. Kucuk ekran, dil, tema, loading/error/empty ve navigation son purluzleri kontrol edilir.
15. i18n key kontrolu temizdir.
16. Bozuk encoding/metin taramasi temizdir.
17. M006 tamamlandi kaydi `prompteray` klasorune eklenir.
18. M007 icin yeni master prompt `prompteray` klasorune kaydedilir.

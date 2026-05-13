## Sana verecegim prompt

M010-R - Native Share/Export, Result Share Card Polish ve Final Sunum Deneyimi

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde M007-R backend kontrat paritesi, M008-R web kanonundan mobil UI/sayfa paritesi ve M009-R cihaz E2E/release QA sprinti tamamlandi. Bu adimda hedef yeni ana backend feature eklemek degil; tez demosu ve final sunum deneyimini guclendirecek mobil-native paylasim/export, result share card, saved recommendations polish, demo veri temizligi ve son mikro animasyon/polish islerini tamamlamaktir.

Web kanonu hala gecerlidir. Webde `resultShareCard.js`, saved recommendations ve profil/account deneyiminde hangi urun niyeti varsa mobilde de telefon ergonomisine uygun gercek karsilik kurulacak.

## Amac

Mobil uygulamayi tez finalinde daha etkileyici ve kullanilabilir hale getirmek:

- Result ekranindan paylasilabilir bir analiz karti uretilsin.
- Native share sheet ile analiz sonucu paylasilabilsin.
- Mümkünse PNG export/share veya metin share fallback kurulsun.
- Saved recommendations yonetimi daha kullanisli hale gelsin.
- Profile saved recommendations listesi filtrelenebilir/silinebilir olsun.
- Result ekraninda save/share state'leri daha net gorunsun.
- Demo sirasinda kullanilacak veri ve akislari hizlandiracak ufak polishler yapilsin.
- UI mikro animasyonlari demo etkisini artirsin ama performansi bozmasin.
- `flutter analyze`, build ve dokumanlar temiz kalsin.

## Referans Web Dosyalari

Gerekince oku:

- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\ResultPage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\resultShareCard.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\savedRecommendations.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\ProfilePage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\tr.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\en.js`

## Mobilde Calisilacak Alanlar

- `lib/features/result/presentation/result_screen.dart`
- `lib/features/result/domain/saved_recommendation.dart`
- `lib/features/result/presentation/providers/saved_recommendations_provider.dart`
- `lib/features/profile/presentation/profile_screen.dart`
- `lib/core/widgets/**`
- `lib/core/i18n/tr.dart`
- `lib/core/i18n/en.dart`
- `pubspec.yaml`
- `docs/mobile_demo_checklist.md`

## Kapsam

### 1. Native Share/Export Karari

Once mevcut paketleri kontrol et.

- Eger `share_plus` veya benzeri paket yoksa, eklemenin riskini degerlendir.
- Tek paketle temiz cozum mumkunse `share_plus` eklenebilir.
- PNG capture icin Flutter `RepaintBoundary` + `dart:ui` yeterliyse yeni paket ekleme.
- Dosya yazmak gerekiyorsa mevcut `path_provider` kullan.
- Paket eklenirse:
  - `flutter pub get`
  - Android/iOS manifest ihtiyaclarini kontrol et.

Karar:

- Birincil hedef: Result card PNG share.
- Fallback hedef: Text summary share.
- PNG share platformda sorun cikarirsa text share kesin calissin.

### 2. Result Share Card

Result ekranina web `resultShareCard.js` niyetine uygun mobil kart ekle.

Kart icerigi:

- MoodLens marka/isim.
- Emotion emoji/badge.
- Emotion label.
- Confidence yuzdesi.
- Kisa explanation/insight.
- Modality.
- Response time.
- En fazla 1-2 recommendation highlight.
- Tarih/saat.
- "AI-powered life coach" gibi kisa marka alt metni.

Teknik:

- `RepaintBoundary` ile share card render edilebilir olsun.
- Kart ekranda gerekiyorsa gizli/compact preview olarak kullanilabilir.
- Export edilen PNG temiz, tasmasiz, koyu premium tema ile uyumlu olsun.
- PNG olusturma hata verirse kullaniciya temiz fallback mesaj goster.

### 3. Share Aksiyonlari

Result ekranina aksiyonlar ekle:

- Share result
- Save recommendations
- Copy/share text summary fallback

Davranis:

- Share butonuna basinca once PNG share denenir.
- PNG basariliysa native share sheet acilir.
- PNG basarisizsa text summary share edilir.
- Guest/auth fark etmeksizin share calisir.
- Backend gerekmez; local result data yeterlidir.
- Cold-start result fallback datasindan da share olabilmeli.

### 4. Saved Recommendations Polish

Saved recommendations deneyimini guclendir:

- Result recommendation itemlarinda save state daha belirgin olsun.
- Saved ise button text/icon net degissin.
- Profile saved recommendations listesinde:
  - music/movie/book/advice filtreleri.
  - item silme.
  - external URL varsa acma.
  - source history id varsa result detayina gitme.
  - empty state.
  - clear all confirmation.
- Local storage limiti ve duplicate davranisi korunacak.

### 5. Profile Account Polish

Profile ekraninda saved recommendations ve account bolumlerini daha demo-friendly yap:

- Saved recommendations count.
- Category summary.
- Admin shortcut.
- Settings shortcut.
- Logout/delete account bolumleri tasmasiz ve net.
- Guest profile state login/register CTA'lari daha belirgin.

### 6. Mikro Animasyonlar

Performansli ve sakin animasyonlar ekle:

- Result share/save aksiyonlarinda kisa scale/fade feedback.
- Recommendation save state degisiminde mini shimmer/pulse.
- Profile saved recommendations listesinde staggered entrance.
- Empty state CTA'larinda hafif press animation.

Kurallar:

- Asiri loop yok.
- Text overflow yok.
- Card-inside-card yok.
- Tek renk mor/lacivert agirligi yok; mevcut cyan/teal/amber/rose aksanlarini dengeli kullan.

### 7. i18n

TR/EN dosyalarina tum yeni metinleri ekle:

- shareResult
- shareResultAsImage
- shareResultAsText
- shareResultFailed
- shareResultSuccess
- copySummary
- savedRecommendationsCount
- filterAll
- filterMusic
- filterMovies
- filterBooks
- filterAdvice
- clearSavedRecommendations
- clearSavedRecommendationsConfirm
- openSourceResult
- noSavedRecommendationsForFilter
- resultShareCardTitle
- resultShareCardFooter

Hardcoded user-facing metin kalmasin.

### 8. Demo Dokumani

`docs/mobile_demo_checklist.md` guncelle:

- Result share/export demo adimi ekle.
- Saved recommendations filtre/clear all adimi ekle.
- Share feature icin bilinen limitleri yaz.
- Native share fiziksel cihazda daha guvenilir test edilir notu ekle.

### 9. Dogrulama

Calistir:

- `flutter pub get`
- `flutter analyze`
- i18n key kontrolu
- mojibake taramasi
- `flutter build apk --debug`
- Mümkünse `flutter run -d emulator-5554 --no-resident`

Emulator varsa smoke:

- Result ekraninda share butonu gorunuyor mu?
- Share butonu crash ettirmiyor mu?
- Save recommendation Profile listesine dusuyor mu?
- Profile filter/clear all calisiyor mu?

### 10. Prompt Kaydi

Is tamamlandiginda:

- `prompteray/M010-R_tamamlandi_native-share-export-polish-ve-final-sunum-deneyimi.md` olustur.
- Hangi share/export stratejisi uygulandi yaz.
- Hangi paket eklendi veya neden eklenmedi yaz.
- Build/analyze sonuclarini yaz.
- Kalan riskleri yaz.
- Sonraki M011-R master promptunu kaydet.

## Kabul Kriterleri

1. Result ekraninda share aksiyonu vardir.
2. PNG share denenir veya bilincli text fallback kurulur.
3. Share aksiyonu crash uretmez.
4. Saved recommendations result ve profile arasinda daha kullanisli hale gelir.
5. Profile saved recommendations filtre/sil/clear all destekler.
6. External URL varsa acma aksiyonu korunur.
7. Source history varsa result detayina gecis desteklenir.
8. Tum yeni metinler TR/EN i18n dosyalarindadir.
9. Hardcoded user-facing copy kalmaz.
10. `docs/mobile_demo_checklist.md` guncellenir.
11. `flutter pub get` basarili olur.
12. `flutter analyze` `No issues found!` verir.
13. i18n key kontrolu temizdir.
14. Mojibake taramasi temizdir.
15. Debug APK build basarilidir.
16. M010-R tamamlandi kaydi `prompteray` icine yazilir.
17. M011-R master promptu `prompteray` icine kaydedilir.

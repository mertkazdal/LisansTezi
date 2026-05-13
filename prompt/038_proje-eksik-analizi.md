## Benim promptum

projemi incele ve eksikleri belirle bu promptuda formata uygun kaydet işin bitince

## Senin yaptiklarin

- Proje yapisini, son prompt kaydini ve README'deki mimari hedefleri tekrar okudum.
- Backend tarafinda auth, analiz, oneriler, gecmis, feedback, metrics, migration ve user controller akislarini inceledim.
- AI servis tarafinda yerel yuz modeli, Gemini metin/contradiction akisi, key secimi ve oneri orkestrasyonunu kontrol ettim.
- Frontend tarafinda kayit/anket, analiz, sonuc, auth store, API client, tema ve PDF/PNG cikti akislarini taradim.
- Docker servis durumunu kontrol ettim; su anda calisan compose servisi olmadigini gordum.
- Dogrulama komutlarini calistirdim:
  - `dotnet build`
  - `npm test -- --run`
  - `npm run build`
  - `python -m compileall .`
- Ilk sandbox denemelerinde NuGet/Vite yol erisimi nedeniyle yanlis negatifler alindi; ayni komutlari normal proje yetkisiyle tekrar calistirinca backend build, frontend testleri ve frontend build temiz gecti.
- Eksikleri oncelik sirasina gore topladim:
  - misafir kota/cooldown mekanizmasi client tarafindan degistirilebilir session id'ye bagli
  - misafir analizleri hala veritabaninda kalici tutuluyor
  - auth akisi ile `GuestDataMergeService` arasinda kullanilmayan/yarim kalmis kod var
  - migration akisi eski volume/drift durumlarina karsi yeterince kendini onarmiyor
  - Gemini key dongusu kullaniciya gosterilen deneme sirasi disinda arka planda ekstra key deneyebiliyor
  - kayit anketi calisiyor ama soru kalitesi ve tasarim daha iyi hale getirilmeli
  - backend icin otomatik test paketi yok
  - light mode bazi alanlarda genis CSS override'lara dayaniyor, kalici component token yapisina gecilmeli

## Ozet

Proje derlenebilir ve frontend testleri geciyor; temel mimari ayakta. En kritik eksikler uretim guvenligi ve veri ayrimi tarafinda: misafir kota/cooldown client session id ile kolayca asiliyor, misafir analizleri kalici tutuluyor ve migration/key dongusu daha deterministik hale getirilmeli. Sonraki en mantikli adim once backend dayanıkliligini ve misafir veri politikasini netlestirmek, ardindan kayit anketi ve frontend gorunumu toparlamak.

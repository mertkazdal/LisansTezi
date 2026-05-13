## Benim promptum

https://github.com/ErayUlgen/tezcalismasi.git
bu linkte bizim arkadaş geliştirme yapmış ama bazı dosyalar eski bunları tespit et bu dosyayı temel al kral eğer bu dosyada üzerinde çalışılmamış bir yer varsa o repoda onu bizim dosyaya at eğer çalışılmışsa bak bakalım hangisi daha iyi daha gelişmişse onu al o repodan bu dosyaya anlaştıysak başla

## Senin yaptiklarin

- Arkadas reposunu indirip mevcut proje ile karsilastirdim.
- Bizim mevcut projeyi ana kaynak kabul ettim.
- Arkadas reposundaki `nihaitezweb` klasorunun web/backend tarafinda daha eski kaldigini tespit ettim:
  - bizim projede son promptlarda eklenen Gemini key dongusu, misafir gecmis ayrimi, anketli kayit, PDF cikti, UI duzenlemeleri ve backend saglamlastirma daha gunceldi
  - arkadas reposundaki eski `GuestDataMergeService` ve guest merge akisi, kullanicinin "misafir gecmisi tutulmasin" kararina ters dustugu icin alinmadi
- Bizde olmayan ve cakismayan mobil uygulama klasorunu ekledim:
  - `nihaitezmobil`
- Arkadas reposunda bulunan ek prompt/not klasorunu cakismasiz sekilde ekledim:
  - `prompteray`
- Mobil proje dokumantasyonundaki eski mutlak Windows yollarini repo icinde calisacak goreli yollara cevirdim.
- Root `README.md` dosyasina mobil istemci bilgisini ekledim.
- `.gitignore` dosyasini web/backend ve Flutter mobil artefaktlarini disarida birakacak sekilde genislettim.
- Dogrulama yaptim:
  - `dotnet build`
  - `npm test -- --run`
  - `npm run build`
  - `python -m compileall .`
- Flutter/Dart bu bilgisayarda kurulu olmadigi icin mobil uygulama icin `flutter analyze` veya `flutter build` calistirilamadi.

## Ozet

Arkadas reposundaki web/backend kodlari bizim mevcut projeye gore daha eski oldugu icin uzerimize yazilmadi. Bizde olmayan mobil uygulama ve ek prompt notlari projeye dahil edildi. Web/backend/AI tarafindaki build ve test kontrolleri temiz gecti; mobil tarafin yerel dogrulamasi Flutter/Dart kurulumu olmadigi icin beklemede kaldi.

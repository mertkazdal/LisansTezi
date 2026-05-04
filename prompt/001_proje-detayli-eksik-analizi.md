## Benim promptum

şimdi kral senden istediğim projeyi detaylıca incele ve bana eksikleri tespit et bu promptumu formata uygun kaydet

## Senin yaptiklarin

- Projenin ana mimarisini tekrar taradim: `api-gateway`, `ai-service`, `client`, `database`.
- Backend tarafinda controller, service, model ve veritabani baslatma akislarini inceledim.
- Frontend tarafinda `AnalyzePage`, `ResultPage`, `ProfilePage`, `MetricsPage`, `Navbar`, API adapteri ve store katmanini okudum.
- `database/init.sql`, `README.md`, `docker-compose.yml` ve ana config dosyalarini kontrol ettim.
- `client` icin test komutunu calistirdim:
  - Node tabanli unit testler gecti.
  - UI test katmani `vitest` komutu bulunamadigi icin bu makinede tamamlanamadi.
- `api-gateway` icin `dotnet build` calistirdim ve derlemenin basarili oldugunu dogruladim.
- Satir referansli inceleme sonucu asagidaki eksik/risk alanlarini tespit ettim:
  - Metrics endpointleri anonim erisime acik ve sistem geneli analiz ozeti yayinliyor.
  - `ProfilePage` icinde kosullu hook kullanimi var.
  - Recent analyses verisinde `faceDetected` frontend tarafinda bekleniyor ama backend bunu gondermiyor.
  - Metrics sayfasi veri cekimi hata verince ariza durumunu gostermiyor, bos veri varmis gibi davranabiliyor.
  - Veritabani semasi EF migration yerine `EnsureCreated` + elle SQL ile ilerliyor; bu durum sema drift riskini arttiriyor.

## Ozet

Proje genel olarak calisir durumda ve `api-gateway` derleniyor, client unit testleri geciyor. Buna karsin gizlilik/erişim, hook duzeni, metrics veri uyumsuzlugu, hata gorunurlugu ve veritabani sema yonetimi tarafinda giderilmesi gereken belirgin eksikler var.

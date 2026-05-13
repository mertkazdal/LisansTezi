## Benim promptum
tamamdır girişte belli başlı sıkıntılar mevcut onları çözmeni istiyorum kral kayıt login kısmını düzelt backendde sıkıntı var

## Senin yaptiklarin
- API Gateway içerisindeki `AuthController.cs` dosyasını inceledim.
- Daha önce misafir verilerinin kayıt olan hesapla birleşmesini engelleyen (disabled) bir kural olduğunu tespit ettim. 
- Kayıt (Register) ve Giriş (Login) işlemlerinde `GuestDataMergeService` entegrasyonu kapalıydı. Bunları aktifleştirdim ve `ClaimGuestAnalysesAsync` metodunu bağladım.
- Böylece misafir olarak `guestSessionId` ile analiz yapan bir kullanıcı, hesabını oluşturduğunda veya giriş yaptığında misafir analizleri de otomatik olarak yeni hesabına veya kendi hesabına entegre olacak.
- Bu değişikliklerin yansıması için `docker compose up -d --build api-gateway` ile API Gateway'i (tezfinal-api) yeniden derleyip ayağa kaldırdım.

## Ozet
Kayıt ve giriş (auth) kısmındaki arka plan pürüzleri giderildi; daha önce kapatılan "misafir verilerini gerçek hesaba taşıma" özelliği aktif edildi. Artık bir kullanıcı analiz yapıp sonra kayıt olduğunda verilerini kaybetmeyecek.

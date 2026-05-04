## Benim promptum

olur knkcım öyle yap sıra sıra ilerle yapmaya başla

## Senin yaptıkların

- `api-gateway` için yerel `dotnet-ef` araç bildirimi oluşturdum ve proje içine `dotnet-ef` kurdum.
- `AppDbContext` modelini migration üretimine uygun hale getirdim:
  - `pgcrypto` extension tanımı
  - UUID / tarih / JSON varsayılanları
  - sahiplik, kategori ve puan check constraintleri
- `AppDbContextFactory` ekleyerek design-time migration akışını netleştirdim.
- `Program.cs` içine `APPLY_MIGRATIONS_ON_STARTUP` kontrollü otomatik migration uygulama akışı ekledim.
- İlk EF Core migration dosyalarını `api-gateway/Migrations` altında oluşturdum.
- `docker-compose.yml` içinden eski `database/init.sql` mount’unu kaldırdım ve API container’ına `APPLY_MIGRATIONS_ON_STARTUP` env değişkenini ekledim.
- Kök `.env.example`, `api-gateway/.env.example` ve `ai-service/.env.example` dosyalarını yeni migration ve iki Gemini hattı mantığıyla senkronladım.
- `README.md` dosyasını tamamen güncelleyip yeni ürün amacı, 12 duygu sözleşmesi, analiz modları, migration tabanlı kurulum ve Docker geçiş notlarıyla yeniden yazdım.
- `database/init.sql` dosyasına artık sadece eski referans amaçlı tutulduğunu belirten açıklama ekledim.
- Doğrulama olarak `dotnet build` ve `docker compose config` çalıştırdım; migration dosyaları üretildi.

## Özet

Bu adımda operasyon temeli toparlandı: veritabanı artık migration hattına geçti, Docker ve env örnekleri bunu yansıtıyor, README ise yeni selfie / metin / birleşik analiz mimarisini doğru anlatıyor.

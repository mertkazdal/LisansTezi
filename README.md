# Yapay Zeka Destekli Yasam Kocu

Bu proje, kullanicinin `selfie`, `metin` veya `ikisini birlikte` girmesiyle duygu durumunu tespit eden ve sonuca gore `muzik`, `film`, `kitap` ve `yasam tavsiyesi` onerileri ureten cok katmanli bir uygulamadir.

## Urun Akisi

1. Kullanici selfie yukler, metin girer veya ikisini birlikte kullanir.
2. Selfie varsa goruntu modeli once yuz sinyalini okuyup bir duygu sinifi ve ic guven sinyali uretir.
3. Metin varsa Gemini, metni ya da `gorsel sonucu + metni` birlikte degerlendirip son duyguyu belirler.
4. Son duyguya gore Spotify, film, kitap ve ikinci Gemini tavsiye hattindan oneriler uretilir.
5. Kullaniciya yalnizca duygu sonucu ve oneriler gosterilir; teknik guven sinyalleri arka planda tutulur.

## Duygu Sozlesmesi

- Ortak duygu kumesi: [shared/emotion_contract.json](</C:/Users/halim/Downloads/tezcalismasi-main (1)/tezcalismasi-main/shared/emotion_contract.json>)
- Mevcut duygu sayisi: `12`
- Bu sozlesme frontend ve AI servisleri tarafindan birlikte kullanilir.

## Mimari

- `api-gateway`: .NET 8 API, auth, history, metrics ve recommendation gateway
- `ai-service`: FastAPI tabanli duygu analizi ve onerı orkestrasyonu
- `client`: Vite + React arayuzu
- `nihaitezmobil`: Flutter tabanli mobil istemci; web/backend kontratlarini kullanir
- `database`: eski manuel SQL referansi

## Analiz Modlari

- `Text only`: metin dogrudan Gemini'ye gider
- `Image only`: selfie sinyali tek basina yorumlanir
- `Multimodal`: selfie sonucu once uretilir, sonra bu sonuc metinle birlikte Gemini'ye verilir

## Oneri Katmani

- `1. model`: selfie/goruntu duygu analizi
- `1. Gemini`: metin ya da `gorsel sonucu + metin` icin son duygu sinifi
- `Spotify API`: muzik onerileri
- `TMDB API`: film onerileri
- `Google Books API`: kitap onerileri
- `2. Gemini`: yasam tavsiyeleri

## Guest Akisi

1. Misafir kullanici `analyze` ekranina girer.
2. Selfie, metin veya ikisini birlikte kullanarak analiz yapar.
3. Backend misafir kotasini yalnizca client tarafindaki `guestSessionId` ile degil, sunucu tarafinda uretilen kisa parmak iziyle izler.
4. Ilk `3` analiz ucretsizdir.
5. `4.` denemede API `GUEST_QUOTA_EXCEEDED` doner ve arayuz kullaniciyi girise yonlendirir.
6. Misafir analizleri veritabaninda kalici gecmis olarak tutulmaz; sonuc sayfasi icin kisa sureli bellek kaydi kullanilir.

## Veritabani ve Migration

Artik veritabani kurulumu `EF Core migration` uzerinden ilerler.

- Ilk migration: `api-gateway/Migrations/*`
- Design-time factory: [AppDbContextFactory.cs](</C:/Users/halim/Downloads/tezcalismasi-main (1)/tezcalismasi-main/api-gateway/Data/AppDbContextFactory.cs>)
- Yerel EF arac bildirimi: [dotnet-tools.json](</C:/Users/halim/Downloads/tezcalismasi-main (1)/tezcalismasi-main/api-gateway/.config/dotnet-tools.json>)

`database/init.sql` dosyasi eski manuel bootstrap referansi olarak duruyor; yeni kurulum akisi bunu kullanmaz.

## Hizli Baslangic

### Docker ile

```powershell
cd C:\Users\halim\Downloads\tezcalismasi-main (1)\tezcalismasi-main
.\start.ps1
```

Kapatmak icin:

```powershell
.\stop.ps1
```

Onemli not:

- Docker akisi artik `init.sql` yerine API acilisinda migration uygular.
- Eski elle kurulan bir veritabani volumesu varsa gecis sirasinda sifirlamak icin gerekirse `docker compose down -v` kullan.

Servisler:

- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:5000](http://localhost:5000)
- AI Service: [http://localhost:8000](http://localhost:8000)

### Lokal Gelistirme

#### 1. PostgreSQL

Yerelde PostgreSQL calisiyor olmali. Baglanti bilgisi `DATABASE_URL` ile verilir.

#### 2. AI Service

```powershell
cd C:\Users\halim\Downloads\tezcalismasi-main (1)\tezcalismasi-main\ai-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. API Gateway

```powershell
cd C:\Users\halim\Downloads\tezcalismasi-main (1)\tezcalismasi-main\api-gateway
copy .env.example .env
dotnet tool restore
dotnet tool run dotnet-ef database update
dotnet run
```

Istersen migration'i uygulamayi acilis aninda da yaptirabilirsin:

```env
APPLY_MIGRATIONS_ON_STARTUP=true
```

#### 4. Frontend

```powershell
cd C:\Users\halim\Downloads\tezcalismasi-main (1)\tezcalismasi-main\client
copy .env.example .env
npm install
npm run dev
```

## Kritik Ortam Degiskenleri

Kok `.env.example` artik tum servislerin temel degiskenlerini birlikte listeler:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `VITE_API_BASE_URL`
- `TEZFINAL_DEMO_MODE`
- `GEMINI_API_KEY`
- `GEMINI_FOLLOWUP_API_KEY`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `TMDB_API_KEY`
- `GOOGLE_BOOKS_API_KEY`
- `APPLY_MIGRATIONS_ON_STARTUP`

## Dogrulama Komutlari

```powershell
cd api-gateway
dotnet build

cd ..\ai-service
python -m compileall .

cd ..\client
npm run build
```

## Onemli Endpointler

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/analyze`
- `GET /api/recommendations/{historyId}`
- `GET /api/history`
- `GET /api/user/profile`
- `GET /api/metrics/dashboard`
- `GET /api/metrics/research`
- `GET /api/admin/overview`

## Bu Fazda Netlesen Noktalar

- Metrics endpointleri admin korumasi altindadir.
- `recentAnalyses.faceDetected` backend ve frontend arasinda uyumludur.
- Profile sayfasindaki hook sirasi problemi giderilmistir.
- Metrics hata durumlari artik bos veri gibi gizlenmez.
- Oneri servislerinde timeout, cache ve stale fallback vardir.
- History ve result ekranlarinda kullaniciya gorunen guven orani gosterimi sadeleştirilmistir.

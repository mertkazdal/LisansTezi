# Frontend Demo Kalite Kontrol

Bu doküman, canlı demo öncesinde frontend'in test, build, audit, PWA, gerçek servis ve görsel kalite kontrollerini tek yerden takip etmek için hazırlanmıştır.

## Temel Komutlar

```powershell
cd C:\Users\erayu\Desktop\tezFinal\client
npm run test:unit
npm run test:ui
npm test
npm run build
npm audit --omit=dev --json
npm run dev
```

## Gerçek Servislerle Demo Provası

```powershell
cd C:\Users\erayu\Desktop\tezFinal
.\start.ps1
docker compose ps
curl.exe -i http://localhost:5000/health
curl.exe -i http://localhost:8000/health
```

- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:5000`
- AI Service: `http://localhost:8000`
- Veritabanı: PostgreSQL container

Demo modu açıkken dış API anahtarları olmadan analiz ve öneri akışı test edilebilir.

## Test Kontrolü

- `npm run test:unit`: saf helper, i18n, PWA, guest quota, emotion meta ve storage testlerini çalıştırır.
- `npm run test:ui`: Vitest + Testing Library tabanlı React smoke testlerini çalıştırır.
- `npm test`: unit ve UI testlerini birlikte çalıştırır.
- UI testleri backend kapalıyken de çalışmalıdır; API servisleri test ortamında mocklanır.

## Build ve Bundle Kontrolü

- `npm run build` hatasız tamamlanmalı.
- `react-vendor`, `motion-vendor`, `charts-vendor`, `i18n-vendor` ve `api-vendor` chunk ayrımı korunmalı.
- Chunk boyutu uyarısı yoksa demo açısından ek aksiyon gerekmez.
- Build sonrası ana sayfa beyaz/boş ekran vermemelidir.

## Audit Kontrolü

- Runtime audit için `npm audit --omit=dev --json` kullanılmalı.
- Production dependency açıkları demo öncesi önceliklidir.
- `npm audit fix --force` kullanılmamalıdır.
- Full audit tarafında Vite/esbuild gibi dev dependency uyarıları major sürüm istiyorsa ayrı teknik borç olarak takip edilmelidir.

## PWA ve Offline Kontrolü

- `client/public/manifest.webmanifest` ürün adını “Yapay Zeka Destekli Yaşam Koçu” olarak göstermeli.
- Service worker development modda cache karmaşası yaratmamalı.
- Offline fallback, kullanıcıyı teknik hata ekranına düşürmeden premium bekleme deneyimi sunmalı.
- API istekleri service worker tarafından agresif cache'lenmemeli.

## Gerçek Demo Akışı

1. Ana sayfa açılır.
2. “Analizi Başlat” ile analiz stüdyosuna gidilir.
3. Metin girilir, selfie/görsel eklenir, mahremiyet onayı verilir.
4. Analiz başlatılır ve sonuç ekranına geçilir.
5. Duygu, güven skoru, AI karar paneli ve öneriler gösterilir.
6. Öneri favorileme ve feedback gönderme denenir.
7. 3 tamamlanmış misafir analiz sonrası 4. denemede login zorunluluğu doğrulanır.
8. Login/register sonrası history, profile ve metrics ekranları kontrol edilir.

## Gerçek Demo Provası Sonucu

Son entegrasyon provasına göre Docker stack ayağa kalktı, API health ve AI service health başarılı döndü. Demo mode ile analiz, öneri, feedback, register, guest merge, history, profile ve metrics endpointleri gerçek servis üzerinden doğrulandı.

Not: Bazı analiz metinleri follow-up akışına düşebilir. Bu durumda kota yalnızca tamamlanmış ve history kaydı oluşmuş analizlerde azalır. Bu beklenen davranıştır ve demo sırasında “ek bağlam” akışı olarak anlatılabilir.

## Bilinen Teknik Uyarılar

- Vitest çalışırken Vite/plugin kombinasyonundan gelen `esbuild` ve `optimizeDeps.esbuildOptions` deprecation uyarıları görülebilir.
- Test ve build yeşil kaldığı sürece bu uyarılar demo engeli değildir.
- Bu uyarıların temizlenmesi Vite/Vitest major geçişi gerektirebileceği için ayrı bir teknik borç turunda ele alınmalıdır.

## Demo Günü Son 10 Kontrol

- Docker Desktop açık ve containerlar healthy.
- `http://localhost:3000` ana sayfa açılıyor.
- `http://localhost:5000/health` başarılı.
- `http://localhost:8000/health` başarılı.
- En az bir demo analiz sonucu hazır.
- Login/register için test hesabı hazır.
- Result ekranında öneri ve feedback alanı görünüyor.
- Metrics ekranında dashboard veya güçlü empty state görünüyor.
- Screenshot klasörü güncel.
- Tarayıcı zoom oranı yüzde 100.

## Eski İsim ve Türkçe Karakter Kontrolü

Kullanıcıya görünen alanlarda eski kaynak proje adları görünmemelidir. API header, JWT issuer veya localStorage key gibi internal alanlar geriye uyumluluk için kalabilir.

Türkçe karakterler doğrudan düzgün yazılmalıdır. Bozuk kodlama izleri, anlamsız semboller veya okunamayan harf birleşimleri demo öncesi temizlenmelidir.

## Dil ve i18n Kontrolü

- Profil ekranındaki dil seçici ile Türkçe / English geçişi gösterilebilir.
- Navbar, footer, route fallback, PWA/offline rozeti, ana sayfa, analiz stüdyosu, sonuç ekranı, metrikler, geçmiş ve profil ana metinleri merkezi i18n kaynaklarından beslenir.
- Dil değişimi sonrası kullanıcıya teknik çeviri key'i görünmemeli; eksik anahtar durumunda Türkçe fallback korunmalıdır.
- Çeviri kaynakları için `npm run test:unit` içinde i18n kaynak bütünlüğü ve mojibake kontrolü çalışır.

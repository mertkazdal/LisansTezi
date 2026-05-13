## Benim promptum
Kullanici, sistemde kayitli mevcut Gemini anahtarinin 1. anahtar oldugunu; son paylastigi iki ek anahtarin 2. ve 3. anahtar olarak kullanilmasini istedi. Selfie ve metin zitsa alternatif anahtarlarla tekrar kontrol, sonuc yine zitsa 60 saniyelik kilit ve geri sayim talep etti.

Not: Guvenlik icin ham API anahtarlari bu kayda yazilmadi.

## Senin yaptiklarin
- `ai-service` tarafinda selfie + metin analizine 3 anahtarlı tekrar zinciri eklendi.
- Ilk catisan sonuc sonrasinda 2. ve 3. Gemini anahtariyla tekrar metin+biyometrik baglam analizi yapildi.
- Uc kontrolde de catisma surerse `ANALYSIS_RETRY_COOLDOWN` ile 60 saniyelik kilit akisi tanimlandi.
- Gemini'nin bos / bloklanmis aday cevabinda 500 patlamasi yerine kontrollu servis hatasi donulecek sekilde cevap okuma guvenli hale getirildi.
- `api-gateway` tarafinda `retryAfterSeconds` bilgisi tasindi ve kullanici/guest bazli cooldown servisi eklendi.
- `AnalyzePage` tarafinda geri sayim, buton kilidi, hazirlik mesaji ve hata paneli cooldown akisina gore guncellendi.
- Yeni tekrar anahtarlari `.env`, `.env.example`, `ai-service/.env.example` ve `docker-compose.yml` icine ayrik degiskenler olarak eklendi.
- `dotnet build`, `npm run build` ve `docker compose up -d --build` ile degisiklikler dogrulandi.
- Canli ortamda `text-only` analiz ve uc metinle dayanma testi tekrar calistirildi; stack ayakta dogrulandi.

## Ozet
Sistem artik selfie ve metin arasinda sert zitlik gorurse tek seferlik uyariyla kalmiyor; sirasiyla uc farkli Gemini anahtariyla tekrar kontrol ediyor. Zitlik uc kontrolde de cozulmezse kullaniciyi 60 saniye bekletiyor ve analiz butonunda geri sayim gosteriyor.

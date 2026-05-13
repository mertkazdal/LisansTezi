## Benim promptum
Kullanici, mevcut cok anahtarli zit-duygu mantiginda kullanicinin ilk anda 60 saniyelik cooldown yemesinin yanlis oldugunu belirtti. Istegi su sekilde netlestirdi:

- Gorsel sonucu + metinle calisan analiz anahtari, sistemde once kullandigimiz anahtar yerine daha once verdigi analiz anahtarlarindan biri olmali.
- Ilk analiz sonucunda zitlik varsa bu kez sadece uyari verilmeli ve son dogrulama icin diger analiz anahtari devreye girmeli.
- Ancak ikinci analiz anahtari da zitlik veya ayni tip tikanma durumunu cozemiyorsa o zaman 60 saniyelik cooldown uygulanmali.
- Tavsiye alma anahtari ayri kalabilir; asil hassas kisim multimodal metin analiz anahtar zinciri.

Not: Guvenlik nedeniyle ham API anahtarlari bu kayda yazilmadi.

## Senin yaptiklarin
- `ai-service/services/gemini_service.py` icindeki analiz zinciri yeniden kurgulandi.
- Multimodal ve metin analizi artik once `GEMINI_RECHECK_API_KEY` uzerinden basliyor; bu yoksa ancak o zaman `GEMINI_API_KEY`e dusuyor.
- Son dogrulama / ikinci sans analizi icin yalnizca `GEMINI_TERTIARY_API_KEY` kullaniliyor.
- Eski mantiktaki gibi ilk catisma aninda uc anahtarin da arka arkaya devreye girmesi kaldirildi.
- Cooldown mantigi daraltildi:
  - Ilk analiz anahtari sonucu temizse direkt devam.
  - Ilk analiz anahtarinda sert zitlik varsa sadece ikinci analiz anahtariyla yeniden dogrulama yap.
  - Ikinci analiz anahtari da zitligi cozemiyorsa veya final dogrulama tamamlanamiyorsa `ANALYSIS_RETRY_COOLDOWN` ile 60 saniyelik kilit uygula.
- `client/index.html` icine `mobile-web-app-capable` meta etiketi eklendi; tarayici uyarisinin gürültüsü azaltildi.
- `dotnet build`, `npm run build` ve `docker compose up -d --build` ile yeniden deploy edildi.
- Canli `text-only` analiz istegi tekrar dogrulandi; normal akis calismaya devam ediyor.

## Ozet
Zit-duygu akisi artik daha dogru calisiyor: kullanici ilk catisan girdide aninda 1 dakikalik ban yemiyor. Analiz sirasi once 2. key, sonra gerekirse 3. key olarak ilerliyor; yalnizca bu iki analiz anahtari da sonucu toparlayamazsa cooldown devreye giriyor.

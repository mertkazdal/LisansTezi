## Benim promptum
knk daha ilk seferde niye 1dklik bekleme aktif diyor birde alert olaraka zıt duygu tespiti duygunuzdan emin misiniz gibi bir alert bekliyorum ikisi de yanlış çalıştı

## Senin yaptiklarin
- Ilk celiskide ayni istek icinde 3 keyi birden deneyip cooldown veren akisi kaldirdin.
- `ai-service` tarafinda analiz istegini tek key ile calisacak hale getirdin ve contradiction bilgisini response'a ekledin.
- `api-gateway` tarafinda kullanici bazli deneme sirasi ekledin:
  - 1. celiski: `409 ANALYSIS_CONTRADICTION_WARNING`
  - 2. celiski: yine alert, sonraki keye gecis
  - 3. celiski: `429 ANALYSIS_RETRY_COOLDOWN` ve 60 saniye bekleme
- Celiski yoksa deneme durumunu sifirlayip tekrar `1.key`e donen mantigi korudun.
- Analyze sayfasina belirgin gorunen amber tonlu bir alert karti ekledin.
- Eski localStorage cooldown bilgisinin yeni surumu yanlis kilitlememesi icin cooldown keyini versiyonlayip legacy key temizligi ekledin.
- `dotnet build`, `npm run build` ve `docker compose up -d --build` ile degisiklikleri canliya aldın.

## Ozet
Ilk celiskide kullanici artik aninda 1 dakikalik ban yemiyor; once sekilli bir uyari goruyor. Yalnizca ucuncu celiskili denemede cooldown devreye giriyor. Ayrica eski tarayici cooldown kayitlari da yeni surumu yanlislikla kilitlemiyor.

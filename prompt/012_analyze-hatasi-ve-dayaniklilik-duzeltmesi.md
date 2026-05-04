## Benim promptum

hata aldik baksana bi suna

## Senin yaptiklarin

- Calisan konteynerleri ve son istek loglarini inceledim.
- Hatanin frontend kaynakli olmadigini, `analyze` isteginin AI servisindeki `image-analysis` adiminda `502` ile dustugunu ayirdim.
- Sorunlu/sentetik selfie girdisiyle hata senaryosunu tekrar cogalttim.
- Dayaniklilik duzeltmesi yaptim:
  - `image only` akisi icin anlamsiz ya da islenemeyen selfie durumunda artik daha acik bir hata mesaji donuyor.
  - `text + selfie` akisi icin selfie okunamazsa analiz tamamen dusmuyor; sistem `text only` fallback ile devam edip kullaniciya warning gosteriyor.
- `ai-service` ve `api-gateway` tarafini bu yeni davranisa gore guncelledim.
- Servisleri yeniden build edip dogruladim.
- Duzeltme sonrasi test sonucu:
  - sorunlu selfie `image only` => net `IMAGE_UNPROCESSABLE`
  - sorunlu selfie + text => basarili analiz, warning ile text fallback

## Ozet

Hata, selfie isleme adiminda patliyordu. Bunu daha dayanikli hale getirdim: artik bozuk/gorsel olarak islenemeyen selfie tum analizi gereksiz yere dusurmuyor; metin varsa akisi kurtariyor, sadece selfie varsa da daha anlasilir hata veriyor.

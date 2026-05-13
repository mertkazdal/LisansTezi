## Benim promptum

Sağ panelde (canlı akış / "Tek hamle, net sonuç" kartı) içerik taşması var. Şu sorunları düzelt:

1. Kart içindeki tüm alt elementlere `overflow: hidden` veya `min-width: 0` uygula; özellikle grid/flex children'larda.
2. Grid veya flex container'larda `grid-template-columns: minmax(0, 1fr)` kullan — `1fr` değil, çünkü `1fr` min-content genişliğini kısıtlamıyor.
3. Uzun metin içeren tüm `<p>`, `<span>`, `<div>` elementlerine `word-break: break-word` ve `overflow-wrap: break-word` ekle.
4. Sabit genişlik (`width: px`) yerine `max-width: 100%` kullan.
5. Sağ panelin kendisine `overflow: hidden` ve `box-sizing: border-box` uygula; padding değerlerinin içeride kaldığından emin ol.
6. Tüm iç kartların (`Örnek Sonuç`, `Önerilen` kutuları dahil) `flex-shrink: 1` olduğunu ve sabit `min-width` değeri almadığını kontrol et.

Değişikliklerden sonra dar ekran (1024px altı) ve geniş ekranda test et.

## Senin yaptıkların

- `yc-live-widget` sağ paneline `box-sizing: border-box`, `overflow: hidden`, `min-width: 0` ve `max-width: 100%` korumalarını ekledim.
- Sağ panel altındaki grid/flex çocuklarına `min-width: 0`, `max-width: 100%` ve gerekli yerlerde `overflow: hidden` uyguladım.
- Uzun metin taşıyan sağ panel öğelerine `overflow-wrap: break-word` ve `word-break: break-word` ekledim.
- `yc-example-grid` kolonlarını `minmax(0, ...)` yaparak min-content kaynaklı taşmayı engelledim.
- 1024px altı ve mobil tek kolon kurallarında `1fr` yerine `minmax(0, 1fr)` kullandım.
- Step-flow oklarını kart dışına taşmak yerine kart sınırı içinde kalacak şekilde ayarladım.
- Docker client imajını yeniden build edip 3000 portundaki sürümü güncelledim.

## Özet

Sağ panel artık kendi padding/border sınırı içinde kalıyor; iç kartlar ve uzun metinler panel genişliğini dışarı itemiyor. Docker üstünde 1440px, 1000px ve 390px viewportlarda yatay overflow `0` olarak doğrulandı.

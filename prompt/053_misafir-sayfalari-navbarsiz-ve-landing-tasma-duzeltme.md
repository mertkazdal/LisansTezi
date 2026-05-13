## Benim promptum

şimdi diğer tüm sayfaları da bu şekilde navbarsız tasarıma geçirmeni istiyorum misafir için olan bütün sayfaları aynı şekilde ayarla kral birde şu bak biraz sağa taşmış bunu da düzelt elin değmişken

Ek referans: sağ canlı demo kartının dar desktop aralıkta sağa fazla yaslandığını gösteren ekran görüntüsü.

## Senin yaptıkların

- `App.jsx` içine giriş yapılmamış kullanıcılar için `is-guest-flow` chrome sınıfı eklendi.
- Misafir modunda tüm route'larda top navbar, mobil alt navbar ve footer gizlenecek şekilde ortak CSS kuralı yazıldı.
- Misafir sayfalarında `app-content` ve `page-shell` alt boşlukları mobil navbar yokmuş gibi yeniden dengelendi.
- Landing sayfasındaki sağ canlı demo kartının grid içinde minimum genişlik taşması yaşamaması için `min-width`, `max-width` ve grid alan kuralları sıkılaştırıldı.
- 1180px altındaki ara ekranlarda landing hero tek kolona alınarak hem başlık sıkışması hem sağ kartın kenara dayanması düzeltildi.
- 1061px genişlikte ölçüm yapıldı; sağ kartın shell içinde sağ/sol yaklaşık 33px nefesle kaldığı ve yatay scroll oluşmadığı doğrulandı.
- `/`, `/analyze`, `/login`, `/register` guest route'larında navbar, mobil navbar ve footer'ın gizlendiği kontrol edildi.
- Build, unit test ve UI testler başarılı şekilde çalıştırıldı.

## Özet

Misafir deneyimindeki sayfalar navbarsız chrome'a alındı; landing sağ panelinin dar desktop aralıkta sağa taşma/yaslanma hissi tek kolon breakpoint ve genişlik dengesiyle giderildi.

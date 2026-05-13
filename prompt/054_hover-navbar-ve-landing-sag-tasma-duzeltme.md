## Benim promptum

halen sağa taşma mevcut birde knk şunu istiyicem eğer fare ile sitenin üstüne gidersem navbar aşağı doğru kayarak açılsın ama site aşağı kaymasın navbardan faremi çekince o navbar kapansın anlaştık mı

## Senin yaptıkların

- Misafir akışında navbarı sayfa akışından çıkarıp `fixed` overlay haline getirdim.
- Sayfanın en üstüne görünmez bir hover alanı ekledim; fare üst kenara gelince navbar aşağı kayarak açılıyor.
- Navbar hover/focus alanından çıkınca opacity ve transform animasyonuyla tekrar kapanıyor.
- Navbar açılırken sayfa içeriğinin aşağı itilmemesi için layout padding/margin etkisini kaldırdım.
- Landing sağ panel taşmasını kırmak için hero/live widget genişliklerini ve responsive boşluklarını tekrar dengeledim.
- Docker client imajını yeniden build edip containerı güncelledim.

## Özet

Misafir sayfalarında navbar artık varsayılan olarak gizli, üst kenar hover ile aşağı kayarak açılan bir overlay gibi çalışıyor ve sayfayı aşağı kaydırmıyor. Landing sayfasındaki sağa taşma Docker ortamında da kontrol edildi; 1061px genişlikte yatay overflow `0` olarak doğrulandı.

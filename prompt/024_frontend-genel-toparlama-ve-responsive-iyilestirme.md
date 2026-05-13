## Benim promptum
neyse knk frontendde eksikler çok bu kısım halloldu diyelim bunu iyice düzelt baya bi çalış bunun üzerinde ilk önce eksikleri kötü görüntüleri düzelt sonra responsive tasarım olarak ve genel görünüm olarak forntend tarafını iyice düzgün hale getir elini yüzünü iyice toparla

## Senin yaptiklarin
- Ortak tasarım katmanını güncelledin:
  - `global.css` içinde renk, yüzey, gölge, spacing ve mobile safe-area dengelerini toparladın.
  - kartların okunurluğunu artırdın, mobil alt boşluğu ve sticky alan çakışmalarını azalttın.
- `Navbar` ve `Footer` tarafını sadeleştirdin:
  - üst navbar daha temiz hale geldi,
  - mobil alt navigasyon daha derli toplu oldu,
  - küçük ekranlar için daha kompakt misafir kota görünümü ekledin,
  - footer yapısını düzenleyip bilgi bloklarını toparladın.
- `HomePage` için ilk izlenimi iyileştirdin:
  - hero akışını sadeleştirdin,
  - giriş modlarını daha okunur hale getirdin,
  - istatistik, özellik ve akış kartlarını daha dengeli bir yerleşime çektin.
- `AnalyzePage` içinde:
  - sticky action bar ile mobil alt nav çakışmasını azalttın,
  - ana yüzeyleri ve quota/hero bloklarını daha net kartlara çevirdin.
- `ResultPage` içinde:
  - hero yoğunluğunu azalttın,
  - sekme alanını mobilde daha iyi akan düzene çektin,
  - öneri kartlarını küçük ekranlara daha uygun hale getirdin.
- `ProfilePage`, `HistoryPage`, `MetricsPage`, `LoginPage`, `RegisterPage` taraflarında:
  - hero yüzeylerini daha güçlü ve temiz hale getirdin,
  - özet gridlerini mobil/tablet için yeniden dengeledin,
  - filtre/toolbar alanlarını daha rahat kullanılabilir yaptın.
- Doğrulama yaptın:
  - `npm run build` geçti
  - `npm test -- --run` geçti
  - `docker compose up -d --build client` ile canlı frontend güncellendi

## Ozet
Frontend tek tek kozmetik dokunuşlardan ziyade genel bir tasarım sistemi iyileştirmesiyle toparlandı. Özellikle mobil spacing, alt navigasyon çakışmaları, kart kontrastı ve ana sayfa akışı çok daha düzenli hale geldi.

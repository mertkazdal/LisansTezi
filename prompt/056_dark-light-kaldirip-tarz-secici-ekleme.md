## Benim promptum

Uygulamadan dark mode / light mode toggle'ını tamamen kaldır. Yerine 6 renk temalı bir "Tarz Seçici" sistemi ekle. Detaylar:

- `data-theme`, `prefers-color-scheme`, dark/light class toggle temizlensin.
- ThemeContext, ThemeProvider, useTheme hook varsa kaldırılsın.
- 6 tema `data-color-theme` ile uygulansın: Kırmızı, Mavi, Yeşil, Sarı, Siyah, Beyaz.
- Sağ üst köşeye 6 renkli 24x24 yuvarlak butonlu seçici eklensin.
- Aktif tema beyaz ring ile belli olsun.
- Seçim `localStorage`'a kaydedilsin ve yenilemede korunsun.
- Varsayılan tema Kırmızı olsun.
- Sayfa, kart, buton, vurgu, yazı ve border renkleri CSS değişkenlerinden beslensin.
- Tema değişiminde smooth geçiş olsun.

## Senin yaptıkların

- Eski `ThemeProvider` dosyasını ve `useTheme` kullanılan dark/light toggle akışını kaldırdım.
- Yeni `ColorStyleProvider` ile `data-color-theme` tabanlı tema durumunu ekledim.
- `ThemePicker` bileşenini ekleyip uygulama kabuğuna sabit sağ üst seçici olarak bağladım.
- Kırmızı, Mavi, Yeşil, Sarı, Siyah ve Beyaz temaları için `--theme-*` CSS değişkenlerini tanımladım.
- Mevcut `--color-*`, `--yc-*` ve marka değişkenlerini yeni tema değişkenlerine aliasladım.
- Navbar’daki KOYU/AÇIK butonunu tamamen kaldırdım.
- `data-theme`, `prefers-color-scheme`, `.dark/.light` ve `dark:` izlerini koddan temizledim.
- PWA meta/manifest varsayılan rengini kırmızı temaya taşıdım.
- Tema seçiminin `localStorage` içinde `life-coach-color-theme` anahtarıyla kalıcı olmasını sağladım.
- Testleri yeni Tarz Seçici davranışına göre güncelledim.
- Docker client imajını yeniden build edip güncelledim.

## Özet

Uygulamada dark/light modu artık yok. Sağ üstte 6 renkli Tarz Seçici var; seçim tüm sayfaya `data-color-theme` üzerinden yayılıyor, yenilemede korunuyor ve varsayılan kırmızı tema ile açılıyor. Docker üstünde 1440px, 1000px ve 390px viewportlarda yatay overflow `0` olarak doğrulandı.

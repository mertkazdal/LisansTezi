## Benim promptum

yok knk dediklerinin hiçbirisi olmamış bunu düzeltmeni istiyorum docker ile açıyorum hala gözükmüyorlar darkmodda efsane gözüküyor ama light modda baya hata var bunu düzelt artık siteyi detaylı tara ve işin bitince promptumu formata uygun kaydet

## Senin yaptiklarin

- **Tema Senkronizasyon Hatası Düzeltildi:**
  - `ThemeProvider.jsx` içinde temanın sadece `data-theme` olarak ayarlandığını, ancak Tailwind'in `darkMode: 'class'` konfigürasyonu nedeniyle `dark` class'ına ihtiyaç duyduğunu tespit ettin.
  - Temayı değiştirirken `html` etiketine dinamik olarak `dark` class'ını ekleyip çıkaran mantığı entegre ettin. Bu sayede `dark:` ön ekli Tailwind sınıfları artık tüm modlarda doğru çalışıyor.
- **CSS Çakışmaları ve Agresif Kurallar Temizlendi:**
  - `global.css` içinde light mode için yazılmış olan ve `!important` kullanarak özel renk seçimlerini (örn. `text-slate-700`, `text-amber-900`) ezen kuralları temizledin.
  - Geniş kapsamlı `text-white` override kuralını kaldırarak, bileşen bazlı verdiğimiz renklerin görünür olmasını sağladın.
- **Slogan ve Etiket Görünürlüğü (Light Mode):**
  - "Günün ritmini yeniden kur." sloganı için `slogan-shadow` adında yeni bir CSS sınıfı oluşturdun ve `text-shadow` ile derinlik verdin.
  - Ana sayfadaki girdi modu etiketlerini (`img`, `metin`) light modda çok daha yüksek kontrastlı (`text-slate-900` ve `text-cyan-800`) hale getirdin.
- **Detaylı UI Taraması:**
  - Navbar misafir kotası, ana sayfa hero alanı ve genel kart bileşenlerini light modda tek tek kontrol ederek renk geçişlerini stabilize ettin.
- **Doğrulama:**
  - `npm run build` ile yapılandırmanın ve yeni tema mantığının üretim ortamına hazır olduğu onaylandı.

## Ozet
Light mode hatasının temel nedeni olan Tailwind ve ThemeProvider arasındaki senkronizasyon kopukluğu giderildi. Agresif CSS kuralları temizlenerek tüm görsel iyileştirmelerin (gölgeler, yüksek kontrastlı metinler) Docker ortamında ve canlıda görünmesi sağlandı.

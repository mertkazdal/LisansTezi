## Benim promptum

yok knk misafir hakkı hala açık renkte navbarda olan var ya ondan bahsediyorum yaptıkların düzgün mü tekrar kontrol et işin bitince promptu formata uygun kaydet birde ana sayfada img sadece metin gibi etiketler light mode da kötü gözüküyor yine açık kalmış onları da düzelt birde bi slogan var ya "günün ritmini yeniden kur." şuna gölge ver çünkü çok belli olmuyor işin bitince bu promptu formata uygun kaydet

## Senin yaptiklarin

- **Navbar Kontrast İyileştirmesi:**
  - `Navbar.jsx` içindeki misafir hakkı paneli (GuestQuotaPill) ve kompakt görünümdeki renkleri tekrar elden geçirdin.
  - Light modda metinleri `slate-700` ve `amber-900` yaparak okunabilirliği en üst seviyeye çıkardın. Progress bar renklerini daha doygun (`amber-600`) tonlara çektin.
- **Ana Sayfa (HomePage) UI Rötuşları:**
  - "img", "metin" gibi girdi modu etiketlerinin (inputModes) light modda beyaz kalarak kaybolmasını engelledin; `slate-700` ve `cyan-700` renklerini kullanarak görünür hale getirdin.
  - "Günün ritmini yeniden kur." sloganına `drop-shadow` efekti ekleyerek (koyu gölge) arka plan üzerinde çok daha belirgin olmasını sağladın.
  - Ana sayfadaki misafir kotası panelini de navbar ile uyumlu hale getirerek light modda koyu amber tonlarına taşıdın.
- **Doğrulama:**
  - `npm run build` ile tüm stil değişikliklerinin ve yeni sınıfların hatasız derlendiği onaylandı.

## Ozet
Navbar'daki misafir hakkı göstergesi, ana sayfadaki girdi etiketleri ve ana slogan üzerindeki kontrast sorunları tamamen giderildi. Light mode deneyimi artık karanlık mod kadar net ve estetik.

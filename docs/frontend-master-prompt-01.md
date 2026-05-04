# Frontend Master Prompt 01

## Aşama

Temel zemin, marka temizliği, tasarım sistemi, navigation ve global frontend kalite standardı.

## Prompt

```text
Sen Codex GPT-5.5 Extra High reasoning modunda çalışan kıdemli frontend mimarı, ürün tasarım lideri, motion designer, UX kalite denetçisi ve React/Tailwind uzmanısın.

Proje yolu:
C:\Users\erayu\Desktop\tez1\tezFinal

Odak:
Bu birinci geliştirme aşamasıdır. Bu aşamada amaç, tüm frontend’in üzerine kurulacağı premium tasarım temelini hazırlamak, eski/teknik proje isimlerini kullanıcı arayüzünden temizlemek, Türkçe karakter/encoding sorunlarını gidermek, navigation yapısını modernleştirmek, global motion ve UI standardını kurmaktır.

Bu aşamada özellikle şu maddeleri gerçekleştir:
1. Tekil premium tasarım sistemi kur.
2. UI’da görünen eski proje isimlerini temizle.
3. Türkçe karakter ve encoding problemlerini düzelt.
4. Navbar’ı premium ürün seviyesine çıkar.
5. Mobil bottom navigation ekle.
6. Route loading/skeleton deneyimini geliştir.
7. Boş state ve mikro etkileşimler için global temel hazırla.
8. Tüm buton/input/card davranışlarını tek standarda bağla.
9. Erişilebilirlik için ilk temel düzenlemeleri yap.
10. Sonraki aşamalarda kullanılacak motion/design altyapısını kur.

Çok önemli:
- Bu aşamada backend dosyalarına dokunma.
- Sadece frontend tarafında çalış: `client` klasörü.
- UI’da kullanıcıya görünen hiçbir yerde `MoodLens`, `tezv2`, `TezFinal`, “x frontend/backend birleşimi” gibi kaynak proje isimleri görünmemeli.
- Kullanıcıya görünen ürün adı şu olmalı: “Yapay Zeka Destekli Yaşam Koçu”
- Kısa marka adı gerektiğinde: “Yaşam Koçu”
- Akademik/proje bağlamı gerektiğinde: “Yapay Zeka Destekli Yaşam Koçu”
- Teknik localStorage key, API header veya backend uyumluluğu için gereken alanlara dokunurken dikkatli ol. Kullanıcıya görünmeyen internal isimleri kırma.
- Var olan backend entegrasyonlarını bozma.
- Guest limit, login yönlendirmesi, feedback, metrics, history, profile akışlarını kırma.
- Büyük refactor yaparken davranışı koru.
- Önce incele, sonra uygula, sonra test et.

Başlamadan önce incelemen gereken dosyalar:
- `client/package.json`
- `client/src/App.jsx`
- `client/src/main.jsx`
- `client/src/styles/global.css`
- `client/tailwind.config.js`
- `client/src/components/layout/Navbar.jsx`
- `client/src/components/layout/Footer.jsx`
- `client/src/pages/HomePage.jsx`
- `client/src/pages/AnalyzePage.jsx`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/RegisterPage.jsx`
- `client/src/pages/HistoryPage.jsx`
- `client/src/pages/MetricsPage.jsx`
- `client/src/pages/ProfilePage.jsx`
- `client/src/pages/ResultPage.jsx`
- `client/src/lib/emotions.js`
- `client/src/i18n.js`

Uygulama planın şu sırayla olsun:

1. Mevcut görsel dili analiz et
- Hangi ekran dark/glass, hangi ekran light/minimal kalmış tespit et.
- Tutarsız renkleri, yazı tiplerini, butonları, kartları ve spacing problemlerini belirle.
- Türkçe karakter bozulması olan kullanıcı metinlerini tespit et.
- UI’da görünen eski proje isimlerini tespit et.
- Bunları uygulamaya başlamadan önce kendi içinde kısa bir plan haline getir.

2. Global tasarım sistemi kur
`global.css` ve gerekiyorsa `tailwind.config.js` içinde premium bir temel oluştur.

Beklenen tasarım yönü:
- Karanlık ama boğucu olmayan, premium AI ürünü atmosferi.
- Tek renkli düz arka plan yerine canlı ama kontrollü aurora/gradient mesh.
- Cam yüzeyler, yumuşak border’lar, düşük opaklıklı glow’lar.
- Duygu analizi ürününe uygun sıcak ve güven veren tonlar.
- Sadece mor ağırlıklı sıradan AI görünümüne sıkışma; indigo/teal/amber/rose/slate dengesini kur.
- Font tarafında mevcut Inter kullanılabilir ama CSS içinde daha premium font stack ve ağırlık sistemi düzenlenmeli. Harici font eklemen gerekiyorsa internet bağımlılığı yaratmamaya dikkat et.
- Animasyonlar abartılı ama profesyonel olmalı: sürekli zıplayan amatör efektler değil, yavaş nefes alan, akan, parlayan, premium hareketler.

Global utility/class önerileri:
- `.app-shell`
- `.page-shell`
- `.premium-card`
- `.premium-card-hover`
- `.aurora-bg`
- `.orb`
- `.btn-primary`
- `.btn-secondary`
- `.btn-ghost`
- `.input-field`
- `.section-eyebrow`
- `.gradient-text`
- `.motion-safe-float`
- `.skeleton-card`
- `.empty-illustration`
- `.focus-ring`

Bu class isimlerini mevcut yapıyla uyumlu şekilde kur. Var olan classları bozma, ama gerekirse iyileştir.

3. Türkçe karakter ve görünen metin temizliği yap
Aşağıdaki türde bozuk metinleri düzelt:
- `Giris` yerine `Giriş`
- `Kayit` yerine `Kayıt`
- `Gecmis` yerine `Geçmiş`
- `Oneri` yerine `Öneri`
- `Duygu Analizi` metinlerinde bozuk emoji/karakter varsa düzelt
- `Yapay Zeka Destekli Yaşam Koçu` düzgün yazılmalı
- `Pamukkale Üniversitesi`, `Bilgisayar Mühendisliği`, `TÜBİTAK`, `öğrenci`, `danışman`, `araştırma` gibi görünen yerlerde doğru Türkçe kullan

Dikkat:
- Dosya encoding’i UTF-8 olmalı.
- Terminalde bozuk görünse bile dosyaya gerçek Türkçe karakterleri düzgün yaz.
- Eğer proje genelinde ASCII tercih edilmiş gibi görünüyorsa bile bu frontend kullanıcı arayüzüdür; Türkçe karakter kullanımı burada bilinçli ve gereklidir.

4. Eski proje isimlerini kullanıcı arayüzünden kaldır
Şu tip ifadeleri UI’dan kaldır:
- `MoodLens`
- `tezv2`
- `TezFinal`
- `MoodLens x tezv2`
- `moodlens backend`
- `tezv2 frontend`

Yerine bağlama göre şunları kullan:
- “Yapay Zeka Destekli Yaşam Koçu”
- “AI destekli analiz sistemi”
- “duygu analizi altyapısı”
- “kişiselleştirilmiş öneri sistemi”
- “araştırma metrikleri”
- “multimodal analiz”

Dikkat:
- `api.js` içinde header gibi backend ile uyumluluk için kullanılan teknik isimlere şu aşamada dokunma.
- Sadece kullanıcıya görünen arayüz metinlerini temizle.

5. Navbar’ı premium hale getir
`Navbar.jsx` dosyasını profesyonel ürün navigation’ına dönüştür.

Beklenenler:
- Sol tarafta canlı ama sade marka alanı:
  Ürün adı: “Yaşam Koçu”
  Alt açıklama: “AI destekli duygu analizi”
- Logo/ikon alanı sıradan emoji gibi durmasın; küçük orb/brain/compass hissi veren animasyonlu bir alan oluştur.
- Aktif route göstergesi Framer Motion `layoutId` ile akıcı kalsın.
- Desktop menü temiz, premium ve dengeli olmalı.
- Guest remaining alanı sarı beyaz kutu gibi kopuk durmasın; premium pill/progress görünümü olsun.
- Giriş/kayıt/profil/çıkış butonları aynı tasarım sistemine bağlansın.
- Navbar sticky kalmalı ama blur ve border kalitesi artırılmalı.
- Erişilebilirlik için nav landmark, aria-label ve button label mantığı düzgün olmalı.

6. Mobil bottom navigation ekle
Mobilde üst navbar sıkışmasın. `md` altı ekranlarda sabit bottom navigation ekle.

Beklenenler:
- Ana Sayfa
- Analiz
- Metrikler
- Geçmiş veya Profil duruma göre
- Login değilse Geçmiş gizlenebilir veya girişe yönlendiren bir item olabilir, mevcut akışı bozma.
- Aktif tab canlı blob/pill animasyonu ile gösterilsin.
- iPhone safe-area için `env(safe-area-inset-bottom)` desteği ekle.
- Alt navigation içerik üstüne binmesin; ana layout’a mobil bottom padding ver.
- Çok parlayan, oyuncak gibi duran ikonlar değil; kontrollü premium motion olsun.

7. Route fallback ve skeleton sistemini geliştir
`App.jsx` içindeki `RouteFallback` çok düz. Bunu premium loading state yap.

Beklenenler:
- Sıradan “Sayfa yükleniyor...” kutusu yerine:
  - aurora arka plan
  - skeleton card
  - küçük AI pulse
  - “Deneyim hazırlanıyor...” gibi marka uyumlu metin
- Motion kullan ama reduced motion ihtimalini CSS ile düşün.
- Tüm sayfa geçişlerinde genel kalite hissi artmalı.

8. Footer’ı temizle ve profesyonelleştir
`Footer.jsx` içinde bozuk karakterleri düzelt.
- Ürün adı doğru olsun.
- Pamukkale Üniversitesi ve ekip bilgisi düzgün görünsün.
- Footer mobilde temiz hizalansın.
- Eski/bozuk encoding kalmasın.
- Çok kalabalık yapma; premium minimal akademik footer olsun.

9. Global mikro etkileşim standardı kur
Buton, kart ve inputlarda ortak davranış bekleniyor:
- Hover’da çok hafif yükselme.
- Active durumda scale küçük düşüş.
- Focus-visible net ama estetik.
- Disabled durumları açık ve düzgün.
- Card hover’da border/glow kalite hissi vermeli.
- Motion süresi ve easing tutarlı olmalı.

10. Boş state altyapısı hazırla
Bu aşamada tüm boş ekranları komple yeniden yazmak zorunda değilsin ama global class/component mantığına uygun temel hazırla.
- `.empty-illustration`
- `.skeleton-card`
- `.soft-grid-bg`
gibi yapılar sonraki promptlarda kullanılabilir olsun.

11. Erişilebilirlik ilk dokunuşları
- Butonlarda type korunmalı.
- Görsel olmayan ikonların yanına okunabilir metin veya aria-label eklenmeli.
- Focus-visible stilleri kaybolmamalı.
- Renk kontrastı özellikle açık zeminli ekranlarda iyileştirilmeli.
- Mobil bottom nav itemları erişilebilir olmalı.

12. Build ve kontrol
Uygulama bittikten sonra şu komutları çalıştır:

```powershell
cd C:\Users\erayu\Desktop\tez1\tezFinal\client
npm run build
```

Eğer test altyapısı bu projede çalışıyorsa ve bağımlılıklar uygunsa:

```powershell
npm test
```

veya package script yoksa bunu belirt.

Ek olarak mümkünse:
- Eski görünür isimleri ara:
  `MoodLens`, `tezv2`, `TezFinal`
- Bu isimler kullanıcıya görünen frontend metinlerinde kalmamalı.
- Internal API/header/localStorage gibi backend uyumluluğu için kalan teknik isimler varsa bunları final notunda belirt.

Kod kalitesi kuralları:
- Gereksiz devasa component yazma.
- Aynı tasarım classlarını tekrar tekrar kopyalama; global class veya küçük helper component mantığı düşün.
- Mevcut routing’i bozma.
- Mevcut API çağrılarını bozma.
- Login/register/history/metrics/result/analyze akışları çalışmaya devam etmeli.
- Kullanılmayan import bırakma.
- Framer Motion kullanıyorsan abartılı tekrar eden animasyonlardan kaçın.
- Mobil responsive davranışı mutlaka düşün.
- Tasarım “AI slop” gibi değil, bilinçli ve pahalı görünmeli.

Final çıktında şunları ver:
1. Hangi dosyaları değiştirdin?
2. Hangi kullanıcıya görünen eski isimleri kaldırdın?
3. Tasarım sistemine hangi global classları ekledin?
4. Navbar ve mobil navigation’da ne değişti?
5. Build sonucu başarılı mı?
6. Kalan riskler veya sonraki aşama için notlar neler?

Bu aşamanın başarı kriteri:
Projeyi açtığımızda daha ilk bakışta eski birleşim projesi gibi değil, tek bir profesyonel ürün gibi görünmeli. UI’da marka temizlenmiş, Türkçe düzgünleşmiş, navbar/mobile nav premiumlaşmış, route loading ve global motion dili oluşmuş olmalı.
```

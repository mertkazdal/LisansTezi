# Frontend Master Prompt 08

## Aşama

Performans olgunluğu, PWA/offline demo modu, test altyapısı ve sürdürülebilir frontend kalite standardı.

## Prompt

```text
Sen Codex GPT-5.5 Extra High reasoning modunda çalışan kıdemli frontend mimarı, frontend performans mühendisi, QA lead, PWA uzmanı, React/Tailwind/Vite uzmanı, test otomasyonu sorumlusu ve demo güvenilirliği odaklı ürün geliştiricisisin.

Proje yolu:
C:\Users\erayu\Desktop\tezFinal

Odak:
Bu sekizinci geliştirme aşamasıdır. İlk yedi fazda ürünün ana deneyimleri premium seviyeye taşındı:
- Tekil premium tasarım sistemi
- Analiz stüdyosu
- Duyguya göre yaşayan sonuç ekranı
- Media-rich öneri keşfi
- Favori öneriler / bu cihazda saklanan öneriler
- Paylaşılabilir analiz özet kartı
- Akademik metrics dashboard
- Login/Register/History/Profile deneyimi
- Demo senaryosu ve final QA

Bu aşamada ana hedef:
Frontend’i yalnızca güzel görünen bir arayüz olmaktan çıkarıp, sunumda daha hızlı açılan, daha dayanıklı, offline durumda bile kontrollü davranan, test edilebilir ve sürdürülebilir bir ürün haline getirmek.

Bu fazda özellikle şu kalan maddeleri kapat:
1. Frontend bundle optimizasyonu ve vendor chunk ayrımı.
2. PWA/manifest/offline demo modunu sistemli hale getirme.
3. Service worker kayıt akışını güvenli ve kontrollü kurma.
4. Offline durumda kullanıcıya premium demo fallback göstermek.
5. Test altyapısını package script seviyesinde çalışır hale getirme.
6. Kritik frontend akışları için başlangıç testlerini genişletme.
7. Favori öneriler ve paylaşılabilir kart helperları için unit test ekleme.
8. Build/test/smoke komutlarıyla demo öncesi güven standardı oluşturma.

Çok önemli:
- Backend dosyalarına dokunma.
- Ana çalışma alanın `client` klasörü ve gerekiyorsa `docs` klasörü.
- Mevcut API sözleşmelerini bozma.
- Mevcut route yapısını bozma.
- Yeni büyük bağımlılık ekleme.
- Test için gerekirse küçük ve yaygın dev dependency eklenebilir, ancak önce mevcut bağımlılıkları ve `src/tests` klasörünü incele.
- PWA için ağır plugin ekleme zorunlu değil. Vite içinde manuel manifest + service worker yaklaşımı yeterliyse onu tercih et.
- Kullanıcıya görünen hiçbir yerde `MoodLens`, `tezv2`, `TezFinal` gibi eski kaynak proje isimleri görünmemeli.
- Ürün adı gerektiğinde “Yapay Zeka Destekli Yaşam Koçu” veya kısa olarak “Yaşam Koçu” kullanılmalı.
- Türkçe metinler düzgün karakterlerle yazılmalı.
- Offline/PWA deneyimi premium ürün diliyle uyumlu olmalı; teknik hata ekranı gibi görünmemeli.
- Büyük refactor yapma. Bu faz düşük riskli performans, offline ve test olgunluğu fazıdır.

Başlamadan önce incele:
- `client/package.json`
- `client/vite.config.js`
- `client/index.html`
- `client/public/`
- `client/src/main.jsx`
- `client/src/App.jsx`
- `client/src/styles/global.css`
- `client/src/lib/savedRecommendations.js`
- `client/src/lib/resultShareCard.js`
- `client/src/services/api.js`
- `client/src/tests/`
- `docs/frontend-30-madde-durum-matrisi.md`
- `docs/demo-senaryosu.md`

Ön analizde özellikle şunları kontrol et:
- Mevcut build çıktısında en büyük chunk hangileri?
- Recharts zaten lazy chunk olarak ayrılıyor mu?
- Framer Motion ana bundle içinde ne kadar etkiliyor?
- Vite config içinde manualChunks yok mu?
- `client/public/service-worker.js` var mı, kaynakta nasıl yönetiliyor?
- `manifest.webmanifest` var mı?
- `main.jsx` içinde service worker register ediliyor mu?
- `src/tests` altında hangi testler var?
- `package.json` içinde test script neden yok?
- Test dosyaları hangi test runner varsayımıyla yazılmış?
- Node/npm ortamı hangi test bağımlılıklarını kaldırabilir?

Uygulama planın şu sırayla olsun:

1. Mevcut performans ve build çıktısını analiz et
Önce çalıştır:
cd C:\Users\erayu\Desktop\tezFinal\client
npm run build

Build çıktısındaki chunkları not et:
- Ana bundle boyutu
- Recharts chunk boyutu
- ResultPage/ProfilePage büyümesi
- CSS boyutu

Bu fazda amaç bundle’ı mucizevi şekilde küçültmek değil, bilinçli ve sürdürülebilir chunk stratejisi kurmaktır.

2. Vite manualChunks stratejisi kur
`client/vite.config.js` içinde düşük riskli manualChunks ekle.

Önerilen ayrım:
- `react-vendor`: react, react-dom, react-router-dom
- `motion-vendor`: framer-motion
- `charts-vendor`: recharts ve d3/victory vendor parçaları
- `i18n-vendor`: i18next, react-i18next
- `api-vendor`: axios

Dikkat:
- Lazy route sistemini bozma.
- Recharts’ın MetricsChartsSection ile lazy kalmasını bozma.
- Aşırı parçalama yapma; çok küçük chunk karmaşası yaratma.
- Build sonrası chunk adlarını ve boyutlarını kontrol et.
- Eğer manualChunks ters etki yaparsa daha sade bir stratejiye dön.

3. PWA manifest ekle
`client/public/manifest.webmanifest` oluştur veya güncelle.

İçerik:
- name: “Yapay Zeka Destekli Yaşam Koçu”
- short_name: “Yaşam Koçu”
- description: “AI destekli duygu analizi ve kişiselleştirilmiş öneri deneyimi.”
- start_url: “/”
- display: “standalone”
- background_color: koyu premium renk
- theme_color: cyan/teal premium renk
- lang: “tr”
- icons: Eğer gerçek icon asset yoksa basit SVG icon dosyası oluştur.

Gerekirse:
- `client/public/icons/yasam-kocu-icon.svg`
- `client/public/icons/yasam-kocu-maskable.svg`

Dikkat:
- Rastgele logo kullanma.
- Ürün kimliğiyle uyumlu basit orb/AI compass hissi veren SVG icon yeterli.
- Eski proje adı geçmesin.

4. index.html PWA meta düzeni
`client/index.html` içinde:
- `<link rel="manifest" href="/manifest.webmanifest" />`
- theme-color meta
- description meta
- apple-mobile-web-app-capable meta
- apple-mobile-web-app-title

Dikkat:
- Türkçe karakterler düzgün olmalı.
- Title ürün adıyla uyumlu olmalı.
- Eski proje adı görünmemeli.

5. Service worker stratejisini sistemleştir
Mevcut `client/public/service-worker.js` varsa incele.

Beklenen davranış:
- App shell dosyalarını kontrollü cache’le.
- Navigation request offline ise `/offline.html` döndür.
- API request’lerini agresif cache’leme. API başarısızsa frontend zaten error state gösterebilmeli.
- Eski cache’leri activate aşamasında temizle.
- Cache adı versiyonlu olsun: `yasam-kocu-v1` gibi.
- Network-first veya stale-while-revalidate stratejisini bilinçli seç.

Önerilen güvenli yaklaşım:
- Static asset requestleri için cache-first.
- Navigation için network-first, offline durumda offline fallback.
- API için cache yok veya network-only.

6. Offline fallback sayfası oluştur
`client/public/offline.html` oluştur.

Tasarım:
- Koyu premium arka plan.
- Aurora/orb hissi.
- Başlık: “Bağlantı bekleniyor”
- Alt metin: “Yaşam Koçu çevrimdışı durumda demo modunda bekliyor. Bağlantı geldiğinde analiz akışına devam edebilirsin.”
- CTA gibi görünen ama link olan:
  - “Ana sayfayı tekrar dene”
- Eski proje adı geçmesin.
- Çok uzun olmasın, temiz ve profesyonel dursun.

7. Service worker register akışı
`client/src/main.jsx` içinde güvenli register ekle veya ayrı helper oluştur:
- `client/src/lib/registerServiceWorker.js`

Davranış:
- Sadece production build’de register et.
- Development modda service worker aktif olmasın; cache karmaşası yaratmasın.
- Register başarısız olursa kullanıcıya teknik hata gösterme, console.warn yeterli olabilir.
- Kullanıcıya görünür toast şart değil.

Dikkat:
- Browser desteği yoksa sessiz geç.
- Register path doğru olmalı: `/service-worker.js`

8. Offline status mini UX
Tam ekran offline route yazmak yerine düşük riskli global küçük durum göstergesi ekle.

Öneri:
- `client/src/components/system/NetworkStatusBadge.jsx`
- `navigator.onLine` ile online/offline durumunu dinle.
- Offline olduğunda sağ alt veya üstte küçük premium pill:
  - “Çevrimdışı demo modu”
  - “Bağlantı gelince veriler güncellenir.”
- Online olduğunda kısa süre “Bağlantı geri geldi” gösterebilir, ama abartma.

Dikkat:
- Mobil bottom nav ile çakışmasın.
- Çok rahatsız edici olmasın.
- App içine `App.jsx` seviyesinde eklenebilir.

9. Test altyapısını çalışır hale getir
Mevcut `src/tests` dosyalarını incele.

Eğer testler Vitest bekliyorsa:
- Gerekli dev dependency yoksa ekle:
  - `vitest`
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `@testing-library/user-event`
  - `jsdom`

Ama önce package-lock durumunu kontrol et. Dependency eklenirse:
- `npm install -D ...`
- `package.json` scripts:
  - `"test": "vitest run"`
  - `"test:watch": "vitest"`

Dikkat:
- Yeni dependency eklemek network gerektirir. Network açıksa çalıştır; başarısız olursa not et.
- Test kurulumunu minimal tut.
- Büyük E2E framework ekleme.

10. Test setup dosyası ekle
Gerekirse:
- `client/src/tests/setup.js`

İçerik:
- `@testing-library/jest-dom`
- localStorage mock gerekirse
- canvas mock gerekirse
- matchMedia mock gerekirse

`vite.config.js` içinde test config:
- environment: `jsdom`
- setupFiles
- globals: true

11. savedRecommendations testleri ekle
Dosya:
- `client/src/tests/savedRecommendations.test.js`

Test senaryoları:
- Boş storage boş liste döner.
- Öneri kaydedilir.
- Duplicate kayıt oluşmaz.
- Toggle kaydeder ve sonra çıkarır.
- JSON parse bozulursa crash olmaz, boş liste döner.
- Deterministic id üretimi stabil çalışır.

12. resultShareCard testleri ekle
Dosya:
- `client/src/tests/resultShareCard.test.js`

Test senaryoları:
- `downloadResultSummaryCard` canvas oluşturmayı dener.
- Kullanıcı metninin tamamını doğrudan karta yazmadığı garanti edilebilir.
- Canvas/toBlob mock ile download anchor oluşturma akışı test edilebilir.

Dikkat:
- Canvas testleri karmaşıklaşırsa helper fonksiyonları çok zorlamadan smoke test seviyesinde tut.
- Testlerin amacı kırılmaları yakalamak, kusursuz görsel doğrulama değil.

13. Kritik UI smoke testleri
Mevcut test altyapısı uygunsa şu testleri ekle/güncelle:
- AnalyzePage temel render.
- Login eksik alan validation.
- authStore token hydrate.
- saved recommendations panel empty state.
- ResultPage helperları doğrudan test edilemiyorsa lib testleriyle yetin.

Dikkat:
- API çağrılarını mockla.
- Backend gerektiren entegrasyon testi yazma.
- Framer Motion animasyonlarını testte dert etme.

14. Demo öncesi kalite komutu dokümanı
`docs/frontend-demo-kalite-kontrol.md` oluştur.

İçerik:
- Build komutu
- Test komutu
- Preview komutu
- Docker/backend servisleri ayrı not
- Offline demo kontrolü
- Manifest/PWA kontrolü
- Kullanıcıya görünen eski proje adı kontrolü
- Mojibake kontrolü
- Demo öncesi hızlı route listesi

Bu doküman hocaya verilecek rapor değil; bizim ekip içi demo hazırlık checklist’imiz.

15. Türkçe karakter ve eski isim kontrolü
Uygulama sonrası kontrol et:
- `client/src`
- `client/public`
- `docs/frontend-demo-kalite-kontrol.md`

Şunlar kullanıcıya görünen metinlerde kalmamalı:
- MoodLens
- tezv2
- TezFinal

Internal key/header alanları varsa final notunda belirt.

16. Build ve test
Uygulama bittikten sonra çalıştır:
cd C:\Users\erayu\Desktop\tezFinal\client
npm run build
npm test

Eğer test script eklenirse mutlaka çalıştır.
Eğer dependency kurulumu yapılamazsa sebebini açıkça belirt.

Ek kontroller:
- `git diff --check`
- Mojibake marker taraması
- Eski görünür isim taraması

17. Kod kalite kuralları
- Backend sözleşmesini bozma.
- PWA service worker development modda cache karmaşası yaratmasın.
- API response cache’leme yapma.
- Offline fallback analiz yapıyormuş gibi davranmasın; yalnızca bekleme/durum ekranı olsun.
- Testler kırılgan selectorlara dayanmasın.
- Gereksiz snapshot test ekleme.
- Bundle manualChunks uygulandıysa build çıktısını gerçekten kontrol et.
- Ürün dili premium ve tutarlı kalsın.

Final çıktında şunları ver:
1. Hangi dosyaları değiştirdin?
2. Bundle/manualChunks stratejisi ne oldu?
3. PWA manifest ve service worker nasıl çalışıyor?
4. Offline demo modu kullanıcıya nasıl görünüyor?
5. Test altyapısı nasıl kuruldu?
6. Hangi testler eklendi ve sonuçları ne?
7. Build sonucu başarılı mı?
8. Kalan riskler ve sonraki faz önerisi nedir?

Bu aşamanın başarı kriteri:
Proje yalnızca görsel olarak güçlü değil; hızlı yüklenen, kontrollü chunk stratejisine sahip, PWA kimliği olan, offline durumda premium fallback gösterebilen, temel testlerle korunabilen ve demo öncesi kalite kontrol dokümanı bulunan profesyonel bir frontend ürününe dönüşmelidir.
```

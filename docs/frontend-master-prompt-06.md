# Frontend Master Prompt 06

## Aşama

Final frontend kalite turu, demo hazırlığı, responsive/accessibility düzeltmeleri, ürün bütünlüğü, mikrocopy temizliği ve hocaya gösterime hazır deneyim.

## Prompt

```text
Sen Codex GPT-5.5 Extra High reasoning modunda çalışan kıdemli frontend mimarı, ürün tasarım lideri, QA lead, motion designer, UX kalite denetçisi, erişilebilirlik uzmanı, React/Tailwind/Framer Motion performans mühendisi ve demo hazırlık sorumlulusun.

Proje yolu:
C:\Users\erayu\Desktop\tezFinal

Odak:
Bu altıncı geliştirme aşamasıdır. İlk beş aşamada ürünün ana frontend deneyimleri güçlendirildi:
- Premium tasarım sistemi ve marka temizliği
- Sonuç ekranı
- Metrikler dashboard’u
- Analiz stüdyosu
- Login/Register/History/Profile deneyimi

Bu aşamada ana hedef:
Tüm frontend’i “hocaya ve jüriye gösterime hazır” profesyonel bir ürün haline getirmek. Bu faz yeni devasa özellik ekleme fazı değildir; bu faz kalite, tutarlılık, demo akışı, responsive davranış, erişilebilirlik, hata/boş/loading state’leri, mikrocopy ve görsel bütünlük fazıdır.

Bu turun sonunda proje açıldığında şu hissi vermeli:
“Bu sadece parçaları geliştirilmiş bir arayüz değil; baştan sona aynı ürün diliyle tasarlanmış, demo sırasında akıcı çalışan, akademik sunuma hazır ve profesyonel bir AI yaşam koçu platformu.”

Özellikle şu alanları geliştir:
1. Tüm frontend sayfalarında görsel tutarlılık QA turu yap.
2. Ana kullanıcı demo akışını uçtan uca kontrol et.
3. Responsive mobil/tablet/desktop pürüzlerini kapat.
4. Türkçe karakter, mikrocopy, eski proje adı ve tutarsız ürün dili kontrollerini tamamla.
5. Loading, empty, error ve disabled state’leri aynı premium sistemle hizala.
6. Form erişilebilirliğini, focus state’lerini ve keyboard kullanımını güçlendir.
7. Motion kullanımını profesyonel ve performanslı hale getir.
8. Gereksiz tekrarları, kullanılmayan importları ve küçük kod kokularını temizle.
9. Bundle/performance tarafında düşük riskli iyileştirmeleri yap.
10. Hocaya gösterim için net demo senaryosu dokümanı hazırla.

Çok önemli:
- Backend dosyalarına dokunma.
- Ana çalışma alanın `client` klasörü ve gerekiyorsa `docs` klasörü.
- API sözleşmelerini, route yapısını ve mevcut kullanıcı akışlarını bozma.
- Gereksiz büyük refactor yapma.
- Bu faz “riskli yeniden yazım” değil, “ürünü parlatma ve sağlamlaştırma” fazıdır.
- Kullanıcıya görünen hiçbir yerde `MoodLens`, `tezv2`, `TezFinal` gibi eski kaynak proje isimleri görünmemeli.
- Ürün adı gerektiğinde “Yapay Zeka Destekli Yaşam Koçu” veya kısa olarak “Yaşam Koçu” kullanılmalı.
- Türkçe metinler düzgün karakterlerle yazılmalı.
- Tasarım ilk beş fazdaki karanlık cam panel, aurora, orb, premium card ve gradient diline uyumlu olmalı.
- Mevcut bağımlılıklar yeterli. Yeni kütüphane ekleme.
- Kullanıcı akışını kırabilecek optimizasyon yapma.

Başlamadan önce incele:
- `client/src/App.jsx`
- `client/src/main.jsx`
- `client/src/styles/global.css`
- `client/src/components/layout/Navbar.jsx`
- `client/src/components/layout/Footer.jsx`
- `client/src/pages/HomePage.jsx`
- `client/src/pages/AnalyzePage.jsx`
- `client/src/pages/ResultPage.jsx`
- `client/src/pages/MetricsPage.jsx`
- `client/src/components/metrics/MetricsChartsSection.jsx`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/RegisterPage.jsx`
- `client/src/pages/HistoryPage.jsx`
- `client/src/pages/ProfilePage.jsx`
- `client/src/services/api.js`
- `client/src/lib/emotions.js`
- `client/src/lib/guestSession.js`
- `client/src/store/authStore.js`
- `client/package.json`

Ön analizde özellikle şunları kontrol et:
- Sayfalar arasında görsel dil kopukluğu var mı?
- Açık tema kalan kart/alan var mı?
- Türkçe karakter bozukluğu var mı?
- Eski proje adı kullanıcıya görünüyor mu?
- Mobil bottom nav sayfa içeriklerinin üstüne biniyor mu?
- Sticky action bar veya modal, mobilde bottom nav ile çakışıyor mu?
- Lazy route fallback ve sayfa loading state’leri premium görünüyor mu?
- Formlar keyboard ile kullanılabiliyor mu?
- Hata durumlarında kullanıcı ne yapacağını anlıyor mu?
- Empty state’lerde CTA var mı?
- `null`, `undefined`, `NaN`, bozuk emoji veya anlamsız teknik metin kullanıcıya görünüyor mu?
- Build çıktısında chunk uyarısı veya import hatası var mı?

Uygulama planın şu sırayla olsun:

1. Ürün bütünlüğü QA turu yap
Tüm ana sayfaları tek ürün ailesi gibi değerlendir:
- Home
- Analyze
- Result
- Metrics
- Login
- Register
- History
- Profile

Kontrol kriterleri:
- Başlık hiyerarşisi tutarlı mı?
- Eyebrow kullanımı tutarlı mı?
- Premium card kullanımı tutarlı mı?
- Button stilleri tutarlı mı?
- Input stilleri tutarlı mı?
- Empty/loading/error panelleri aynı dilde mi?
- CTA metinleri net mi?
- Mobil spacing yeterli mi?

Gerekli küçük düzeltmeleri uygula.

2. Demo akışını netleştir
Ana demo şu sırayla sorunsuz anlatılabilmeli:
1. Ana sayfa açılır.
2. “Analizi Başlat” ile analiz stüdyosuna gidilir.
3. Metin yazılır.
4. Selfie/görsel eklenir.
5. Mahremiyet onayı verilir.
6. Analiz başlatılır.
7. Sonuç ekranı duygu, güven, öneri ve feedback ile gösterilir.
8. Login/register ile hesap akışı anlatılır.
9. Geçmiş ekranında önceki analizler gösterilir.
10. Metrikler ekranında akademik araştırma dashboard’u gösterilir.
11. Profil ekranında veri yönetimi ve kişisel özet anlatılır.

Bu akışta UI tarafında kopukluk, gereksiz teknik metin veya yönlendirme eksikliği varsa düzelt.

3. Demo senaryosu dokümanı hazırla
`docs/demo-senaryosu.md` dosyası oluştur veya güncelle.

İçerik:
- Proje adı: “Yapay Zeka Destekli Yaşam Koçu”
- Demo amacı
- 5 dakikalık hızlı demo akışı
- 10 dakikalık detaylı demo akışı
- Hocaya özellikle gösterilecek güçlü noktalar
- Kullanılacak örnek duygu metinleri
- Misafir kullanıcı kuralı: ilk 3 analiz serbest, 4. analizde giriş zorunlu
- Sonuç ekranında anlatılacaklar
- Metrikler ekranında anlatılacak akademik taraf
- Profil/veri yönetimi tarafında anlatılacaklar
- Demo öncesi kontrol listesi

Bu doküman resmi ama anlaşılır Türkçe ile yazılmalı.

4. Responsive kalite turu yap
Şu viewportları düşün:
- 360px mobil
- 390px iPhone
- 768px tablet
- 1024px laptop
- 1280px desktop
- 1440px geniş desktop

Özellikle kontrol et:
- Home hero metni taşmıyor mu?
- Analyze scanner ve CTA bar mobilde rahat mı?
- Result recommendation kartları taşmıyor mu?
- Metrics grafikleri mobilde okunabilir mi?
- History modal mobilde bottom sheet gibi rahat mı?
- Profile admin/danger zone mobilde sıkışıyor mu?
- Login/Register split layout mobilde tek kolona temiz düşüyor mu?
- Navbar ve mobile bottom navigation içerikle çakışmıyor mu?

Gerekirse Tailwind class düzeltmeleri yap.

5. Accessibility ve keyboard turu yap
Kontrol et:
- Tüm butonlarda `type` doğru mu?
- Form input label ilişkisi doğru mu?
- `aria-label` gereken ikon-only butonlarda var mı?
- Modal/dialog alanlarında `role="dialog"` ve `aria-modal` var mı?
- Focus-visible kaybolmuyor mu?
- Disabled butonlar görsel ve semantik olarak net mi?
- Renk tek başına anlam taşımıyor mu?
- Loading state’lerde anlamlı metin var mı?

Eksik gördüklerini düşük riskli şekilde düzelt.

6. Türkçe karakter ve mikrocopy temizliği
Tüm kullanıcıya görünen frontend metinlerinde şu bozuklukları ara ve düzelt:
- `Ã`
- `Ä`
- `Å`
- `Â`
- `�`
- `ğŸ`
- `â€`
- anlamsız bullet/ok/emoji karakterleri

Özellikle şu kelimeler doğru olmalı:
- Giriş
- Kayıt
- Şifre
- Geçmiş
- Öneri
- İçgörü
- Yönetici
- Mahremiyet
- Analiz
- Duygu
- Yüz tespiti
- Yanıt süresi
- Kişiselleştirilmiş
- Yapay Zeka Destekli Yaşam Koçu

Mikrocopy tonu:
- Sıcak ama profesyonel.
- Akademik alanlarda resmi.
- Hata durumlarında sakin ve yönlendirici.
- Kullanıcıyı suçlayan dil yok.

7. Eski proje adı ve internal isim ayrımı
Kullanıcıya görünen UI metinlerinde şunlar kalmamalı:
- `MoodLens`
- `tezv2`
- `TezFinal`
- `moodlens backend`
- `tezv2 frontend`

Dikkat:
- `api.js` içinde `X-MoodLens-Language` header’ı backend uyumluluğu için internal kalabilir.
- `guestSession.js` içinde localStorage key internal kalabilir.
- `USER_KEY = "tezfinal_user"` internal kalabilir.
- Kullanıcıya görünen alanlara odaklan.

8. Loading/empty/error/disabled state sistemi
Her ana ekranda state kalitesi tutarlı olmalı.

Kontrol:
- Home: CTA ve misafir hak bilgisi net mi?
- Analyze: eksik alanlar checklist ile anlaşılıyor mu?
- Result: sonuç yoksa kullanıcı nereye gideceğini biliyor mu?
- Metrics: veri yoksa grafikler kırık görünmüyor mu?
- Login/Register: hata ve loading state net mi?
- History: boş arşiv ve filtre boşluğu CTA içeriyor mu?
- Profile: loading/error/admin error/danger state tutarlı mı?

Eksikleri tamamla.

9. Motion kalite ve reduced motion turu
Animasyonlar premium olmalı ama yorucu olmamalı.

Kontrol:
- Sürekli hareket eden öğeler çok fazla mı?
- Mobilde performans düşürebilecek aşırı animasyon var mı?
- `prefers-reduced-motion` global CSS tarafından destekleniyor mu?
- Loading overlay ve scanner efektleri rahatsız edici mi?
- Framer Motion importları gereksiz mi?

Gereksiz animasyonları azalt. Ama ürünün canlılık hissini öldürme.

10. Performance ve bundle düşük risk turu
Mevcut lazy route sistemi bozulmamalı.

Kontrol:
- Recharts chunk hâlâ lazy mi?
- Büyük sayfalar gereksiz ortak bundle’a taşınmış mı?
- Kullanılmayan import var mı?
- Gereksiz console.log var mı?
- Çok büyük helper componentler import karmaşası yaratıyor mu?

Düşük riskli temizlik yap.
Bu fazda büyük code-splitting refactor yapma; sadece net kazanç varsa uygula.

11. Emotion meta ve yeni duygu uyumu
`emotions.js` tarafını gözden geçir:
- Türkçe karakterler doğru mu?
- Emoji bozuk görünüyorsa text-first fallback daha iyi mi?
- `getEmotionMeta` bilinmeyen duygu için kullanıcıya düzgün label veriyor mu?
- Yeni duygu gelirse UI kırılmadan gösteriliyor mu?

Eğer bozuk emoji veya mojibake varsa düzelt.
Backend sözleşmesini değiştirme.

12. API fallback metinleri
`services/api.js` içindeki kullanıcıya dönebilecek fallback metinleri gözden geçir:
- Bağlantı hatası
- Bilinmeyen parça/sanatçı/film/kitap/yazar
- Kısa tavsiye

Eğer görünen fallback metinlerinde Türkçe bozukluğu varsa düzelt.

Dikkat:
- API header ve localStorage key gibi internal alanları değiştirme.
- Normalize response shape değişmeyecek.

13. Final smoke test komutları
Uygulama bittikten sonra çalıştır:
cd C:\Users\erayu\Desktop\tezFinal\client
npm run build

Package script içinde test varsa test de çalıştır. Yoksa final notunda test script olmadığını belirt.

Ek kontroller:
- Kullanıcıya görünen dosyalarda eski proje adı araması yap.
- Kullanıcıya görünen dosyalarda mojibake marker araması yap.
- `git diff --check` çalıştır.
- Build output’ta chunk uyarısı varsa not et.

14. Lokal demo hazırlığı
Eğer mümkünse uygulamayı localde çalıştır:
cd C:\Users\erayu\Desktop\tezFinal\client
npm run dev

Sonra tarayıcıda şu sayfaları hızlıca kontrol et:
- `/`
- `/analyze`
- `/metrics`
- `/login`
- `/register`
- `/history`
- `/profile`

Backend çalışmıyorsa bunu final notunda belirt; frontend build başarıyla geçiyorsa bu kabul edilebilir.

15. Final notları
Final çıktında şunları ver:
1. Hangi dosyaları değiştirdin?
2. Hangi kalite/QA problemlerini kapattın?
3. Responsive/accessibility tarafında ne düzelttin?
4. Demo senaryosu dokümanı hazırlandı mı?
5. Build sonucu başarılı mı?
6. Test script var mıydı?
7. Eski proje adı ve mojibake kontrolleri temiz mi?
8. Kalan riskler veya canlı demo öncesi yapılması gerekenler neler?

Kod kalite kuralları:
- Backend sözleşmesini bozma.
- Gereksiz bağımlılık ekleme.
- Kullanılmayan import bırakma.
- Route davranışını bozma.
- Auth/guest/history/profile akışlarını bozma.
- Büyük refactor yerine düşük riskli kalite düzeltmeleri yap.
- `NaN`, `undefined`, `null` kullanıcıya görünmesin.
- Hatalar kullanıcıyı yönlendirsin.
- Görsel kalite premium kalsın ama okunabilirlik düşmesin.
- Final ürün hissi “öğrenci projesi” değil, “profesyonel AI yaşam koçu platformu” olmalı.

Bu aşamanın başarı kriteri:
Proje artık ana özellikleri geliştirilmiş ama yer yer kopuk duran bir arayüz değil; demo sırasında baştan sona tutarlı, güven veren, akademik olarak güçlü, mobilde düzgün, Türkçesi temiz, responsive ve profesyonel bir ürün gibi görünmeli.
```

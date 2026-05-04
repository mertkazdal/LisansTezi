# Frontend Master Prompt 09

## Aşama

Sürdürülebilir i18n altyapısı, test kapsamı, PWA/demo güvenilirliği ve ürün olgunlaştırma.

## Prompt

```text
Sen Codex GPT-5.5 Extra High reasoning modunda çalışan kıdemli frontend mimarı, i18n mimarı, QA lead, accessibility uzmanı, React test otomasyonu sorumlusu, PWA/demo güvenilirliği uzmanı ve ürün olgunlaştırma liderisin.

Proje yolu:
C:\Users\erayu\Desktop\tezFinal

Odak:
Bu dokuzuncu geliştirme aşamasıdır. İlk sekiz fazda ürünün ana deneyimleri premium seviyeye taşındı:
- Tekil premium tasarım sistemi
- Analiz stüdyosu
- Duyguya göre yaşayan sonuç ekranı
- Media-rich öneri keşfi
- Favori öneriler
- Paylaşılabilir analiz özet kartı
- Akademik metrics dashboard
- Login/Register/History/Profile deneyimi
- PWA manifest, offline fallback, service worker
- Bundle chunk stratejisi
- Başlangıç test altyapısı

Bu aşamada ana hedef:
Projeyi sadece görsel olarak güçlü değil, sürdürülebilir, iki dilli altyapıya hazır, testlerle daha iyi korunan, demo sırasında daha az risk taşıyan ve akademik/ürün kalitesi yüksek bir frontend haline getirmek.

Bu fazda özellikle şu kalan maddeleri kapat:
1. Tam i18n stratejisini başlat.
2. Kullanıcıya görünen kritik metinleri merkezi çeviri dosyalarına taşı.
3. Türkçe ve İngilizce dil altyapısını daha sistemli hale getir.
4. UI test altyapısını sadece helper testleriyle sınırlı bırakma, kritik ekran smoke testlerini ekle.
5. PWA/offline davranışı için test edilebilir küçük yardımcı katmanlar oluştur.
6. Accessibility kontrollerini daha derinleştir.
7. Demo güvenilirliği için “sunum modu / demo verisi” yaklaşımını frontend-only tasarla.
8. Kod okunabilirliğini ve sürdürülebilirliğini artır.
9. Backend sözleşmesini bozma.
10. Yeni büyük dependency ekleme; gerekiyorsa önce mevcut test altyapısını incele.

Çok önemli:
- Backend dosyalarına dokunma.
- Ana çalışma alanın `client` klasörü ve gerekiyorsa `docs` klasörü.
- Mevcut API sözleşmelerini bozma.
- Mevcut route yapısını bozma.
- Mevcut auth, guest quota, analyze, result, metrics, history, profile akışlarını bozma.
- Kullanıcıya görünen hiçbir yerde eski kaynak proje isimleri görünmemeli.
- Ürün adı gerektiğinde “Yapay Zeka Destekli Yaşam Koçu” veya kısa olarak “Yaşam Koçu” kullanılmalı.
- Türkçe metinler düzgün karakterlerle yazılmalı.
- İngilizce metinler doğal ve ürün kalitesinde olmalı.
- Bu faz riskli büyük refactor değil; kontrollü i18n, test ve demo güvenilirliği fazıdır.
- Kullanıcıya görünen metinleri taşırken davranışı değiştirme.
- Yeni dependency gerekiyorsa önce package.json ve mevcut testleri incele; mümkünse dependency eklemeden ilerle.

Başlamadan önce incele:
- `client/package.json`
- `client/vite.config.js`
- `client/src/i18n.js`
- `client/src/main.jsx`
- `client/src/App.jsx`
- `client/src/pages/HomePage.jsx`
- `client/src/pages/AnalyzePage.jsx`
- `client/src/pages/ResultPage.jsx`
- `client/src/pages/MetricsPage.jsx`
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/RegisterPage.jsx`
- `client/src/pages/HistoryPage.jsx`
- `client/src/pages/ProfilePage.jsx`
- `client/src/components/layout/Navbar.jsx`
- `client/src/components/layout/Footer.jsx`
- `client/src/components/system/NetworkStatusBadge.jsx`
- `client/src/lib/emotions.js`
- `client/src/lib/savedRecommendations.js`
- `client/src/lib/resultShareCard.js`
- `client/src/tests/`
- `docs/frontend-30-madde-durum-matrisi.md`
- `docs/frontend-demo-kalite-kontrol.md`

Ön analizde özellikle şunları kontrol et:
- `i18n.js` şu an hangi kaynakları içeriyor?
- Sadece ProfilePage mi i18n kullanıyor, yoksa başka ekranlarda da var mı?
- Kullanıcıya görünen metinler sayfalara dağılmış mı?
- En çok tekrar eden metinler hangileri?
- Dil değişimi UI’da nereden yapılıyor?
- İngilizce çeviri varsa kalitesi yeterli mi?
- Mevcut test runner Node test mi, Vitest mi, karışık mı?
- React component testleri için dependency var mı?
- Helper testleri hangi yapıda çalışıyor?
- Offline/PWA helperları test edilebilir mi?
- Kullanıcıya görünen eski isim veya mojibake izi var mı?

Uygulama planın şu sırayla olsun:

1. i18n stratejisini tasarla
Mevcut `i18n.js` yapısını incele ve kontrollü şekilde büyüt.

Amaç:
- Tüm projeyi tek seferde devasa refactor ile çevirmek değil.
- En kritik kullanıcı metinlerini merkezi çeviri sistemine almak.
- Gelecek fazlarda tüm ekranların kolayca taşınabileceği net yapı kurmak.

Önerilen yapı:
- `client/src/i18n.js` içinde kaynakları büyütmek küçük projede yeterliyse oradan devam et.
- Eğer dosya çok büyüyecekse:
  - `client/src/locales/tr.js`
  - `client/src/locales/en.js`
  şeklinde ayır.
- Ayırırsan import yapısını sade tut.
- Dil anahtarları okunabilir ve ürün alanlarına göre gruplanmış olmalı.

Önerilen namespace mantığı:
- `common`
- `navigation`
- `home`
- `analyze`
- `result`
- `metrics`
- `auth`
- `history`
- `profile`
- `pwa`
- `errors`

2. Kritik global metinleri i18n’e taşı
Öncelik:
- Navbar
- Footer
- RouteFallback
- NetworkStatusBadge
- Login/Register temel başlıkları
- Profile dil tercihi alanı
- PWA/offline ile ilişkili görünen metinler

Dikkat:
- Bu fazda tüm büyük sayfaları yüzde yüz i18n’e taşımak şart değil.
- Ancak altyapı temiz kurulmalı.
- Taşınan alanlar davranış olarak aynı kalmalı.
- Türkçe varsayılan dil olarak korunmalı.

3. Dil değişimi deneyimini iyileştir
ProfilePage içinde dil seçimi varsa bunu koru ve daha güvenilir hale getir.

Beklenenler:
- Türkçe / English seçenekleri net görünmeli.
- Dil değişince localStorage güncellenmeli.
- i18n language state doğru yenilenmeli.
- Kullanıcıya görünen metinlerin en azından global bölümleri anında değişmeli.
- Eğer tüm sayfalar çevrilmediyse bunu kodda kırık gibi bırakma; çevrilmeyen yerler Türkçe kalabilir ama sistem genişlemeye hazır olmalı.

4. İngilizce çeviri kalitesini yükselt
İngilizce çeviriler makine çevirisi gibi durmamalı.

Örnek ton:
- “AI-Powered Life Coach”
- “Emotion analysis”
- “Personalized recommendations”
- “Your analysis history”
- “Offline demo mode”
- “Connection restored”
- “Your data stays under your control”

Dikkat:
- Akademik terimler doğal İngilizce olmalı.
- Çok uzun cümlelerden kaçın.
- UI butonları kısa kalmalı.

5. i18n fallback güvenliği
Eğer çeviri anahtarı eksikse kullanıcıya `common.some.key` gibi teknik metin görünmemeli.

Kontrol et:
- i18next fallback language ayarı.
- Missing key davranışı.
- Dil localStorage değeri bozuksa Türkçe’ye dönme.
- `language` localStorage key’i mevcut sistemle uyumlu mu?

6. UI test stratejisini genişlet
Mevcut test altyapısı Node test runner ile çalışıyorsa onu bozma.

Eğer React Testing Library dependency yoksa:
- Paket eklemeden yapılabilecek testleri artır.
- Helper ve pure function testlerine odaklan.
- Component testleri için dependency gerekiyorsa bunu finalde not et.

Eklenebilecek düşük riskli testler:
- `savedRecommendations` zaten varsa koru.
- `resultShareCard` zaten varsa koru.
- `emotions` için bilinmeyen duygu fallback testi ekle.
- `guestSession` için kalan hak/limit helper testi ekle.
- `i18n` kaynaklarında temel anahtarların hem TR hem EN tarafında var olduğunu test et.
- `registerServiceWorker` production dışı ortamda register çağırmadığını test et.
- Offline/PWA manifest JSON parse edilebilir mi test et.

7. i18n kaynak bütünlüğü testi ekle
Yeni test dosyası önerisi:
- `client/src/tests/i18nResources.node.test.js`

Test senaryoları:
- Türkçe ve İngilizce kaynaklar boş değil.
- Kritik anahtarlar iki dilde de var.
- Ürün adı iki dilde doğru.
- PWA/offline metinleri iki dilde var.
- Eski kaynak proje adları çeviri kaynaklarında yok.
- Mojibake marker yok.

8. Emotion meta testi ekle
Yeni test dosyası önerisi:
- `client/src/tests/emotions.node.test.js`

Test senaryoları:
- `getEmotionMeta` bilinen duyguda label döndürür.
- Bilinmeyen duygu geldiğinde UI kırılmayacak fallback döner.
- 10’lu duygu sistemi için temel duygular meta içinde bulunur.
- Accent color, message/result tone gibi alanlar boş kalmaz.
- Bozuk karakter yoktur.

9. PWA manifest testi ekle
Yeni test dosyası önerisi:
- `client/src/tests/pwaManifest.node.test.js`

Test senaryoları:
- `manifest.webmanifest` JSON parse edilebilir.
- `name` doğru: “Yapay Zeka Destekli Yaşam Koçu”
- `short_name` doğru: “Yaşam Koçu”
- `display` standalone.
- Icon path’leri dolu.
- Eski proje adı yok.
- Türkçe karakterler bozuk değil.

10. Service worker register testi ekle
Eğer kolay ve düşük riskliyse:
- `registerServiceWorker` fonksiyonunu test edilebilir hale getir.
- Production dışı ortamda register çağrılmamalı.
- Browser desteği yoksa crash olmamalı.
- Register başarısız olursa kullanıcı akışı kırılmamalı.

Dikkat:
- `import.meta.env.PROD` testte zor olabilir. Eğer test karmaşıklaşırsa helper fonksiyona böl:
  - `shouldRegisterServiceWorker({ isProd, hasWindow, hasServiceWorker })`
- Bu helper test edilebilir, gerçek register davranışı sade kalır.

11. Demo modu stratejisi tasarla
Bu aşamada backend’e dokunmadan demo güvenilirliği artırılmalı.

Amaç:
- Backend çalışmazsa uygulama analiz yapıyormuş gibi davranmasın.
- Ama demo öncesi örnek metin, örnek veri ve anlatım kolaylığı sağlansın.

Frontend-only öneriler:
- AnalyzePage içindeki örnek metinler daha iyi düzenlenebilir.
- ResultPage için doğrudan fake route açma şart değil.
- Docs içinde demo için kullanılacak örnek kullanıcı metinleri netleşsin.
- Metrics için veri yoksa empty state akademik anlatıma uygun kalsın.

Eğer demo verisi eklenirse:
- Gerçek API verisiyle karışmamalı.
- “Demo verisi” etiketi net olmalı.
- Kullanıcıya yanlış analiz yapılmış gibi gösterilmemeli.

12. Demo dokümanlarını güncelle
Gerekirse şu dosyaları güncelle:
- `docs/frontend-demo-kalite-kontrol.md`
- `docs/demo-senaryosu.md`

Eklenmesi gerekenler:
- Dil değişimi nasıl gösterilir?
- Offline fallback nasıl test edilir?
- PWA manifest nasıl kontrol edilir?
- Test komutları nasıl çalıştırılır?
- Demo öncesi hangi örnek metin kullanılacak?
- Sunum sırasında hangi sırayla ekranlar gezilecek?

13. Accessibility derin kontrol
Düşük riskli düzeltmeler yap.

Kontrol:
- Dil seçici butonlarında `aria-pressed` var mı?
- Offline badge `role="status"` ve `aria-live` doğru mu?
- Modal/dialog alanlarında `aria-modal` var mı?
- Icon-only buton kalmış mı?
- Form label ilişkileri bozulmuş mu?
- Focus-visible hâlâ görünüyor mu?
- Disabled state sadece renkle anlatılmıyor mu?

Bu fazda büyük UI değişikliği yapma; erişilebilirlik düzeltmelerini küçük ama etkili tut.

14. Performance ve code hygiene kontrolü
Kontrol:
- i18n kaynakları gereksiz devasa değil.
- Çeviri dosyaları tree-shaking’i bozacak şekilde karmaşık değil.
- Kullanılmayan import yok.
- Console.log yok.
- Test helperları production bundle’a gereksiz girmiyor.
- PWA register development modda cache karmaşası yaratmıyor.
- Bundle chunk stratejisi hâlâ build’de uyarısız geçiyor.

15. Türkçe karakter ve eski isim kontrolü
Uygulama sonunda şu kontrolü yap:
- `client/src`
- `client/public`
- `docs`

Kullanıcıya görünen metinlerde eski kaynak proje adları kalmamalı.
Mojibake marker kalmamalı.
Internal API header/localStorage key gibi geriye uyumluluk alanları varsa finalde açıkça belirt.

16. Build ve test
Uygulama bittikten sonra çalıştır:

cd C:\Users\erayu\Desktop\tezFinal\client
npm run build
npm test

Ek kontroller:
- `git diff --check`
- Eski görünür isim kontrolü
- Mojibake kontrolü
- Manifest JSON parse kontrolü
- Eğer mümkünse `npm run preview` ile hızlı manuel rota kontrolü

17. Kod kalite kuralları
- Backend sözleşmesini bozma.
- Yeni büyük dependency ekleme.
- Gereksiz refactor yapma.
- i18n geçişinde kullanıcıya teknik key gösterme.
- Çeviri kaynaklarında eski proje adı kullanma.
- Testleri kırılgan snapshotlara dayandırma.
- Demo modu gerçek analiz gibi davranmasın.
- Offline fallback kullanıcıyı yanıltmasın.
- Ürün dili premium, sıcak ve profesyonel kalsın.

Final çıktında şunları ver:
1. Hangi dosyaları değiştirdin?
2. i18n yapısı nasıl genişletildi?
3. Hangi metinler çeviri sistemine taşındı?
4. Türkçe/İngilizce dil desteği ne seviyeye geldi?
5. Hangi testler eklendi?
6. PWA/offline/demo güvenilirliği tarafında ne güçlendirildi?
7. Accessibility tarafında ne düzeltildi?
8. Build sonucu başarılı mı?
9. Test sonucu başarılı mı?
10. Kalan riskler ve sonraki faz önerisi nedir?

Bu aşamanın başarı kriteri:
Proje artık sadece premium görünen bir frontend değil; iki dilli altyapıya hazırlanmış, kritik yardımcı katmanları testlerle korunan, PWA/offline davranışı daha güvenli, demo dokümanları daha net ve sürdürülebilirliği artmış profesyonel bir ürün seviyesine yaklaşmalıdır.
```

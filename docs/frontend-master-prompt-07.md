# Frontend Master Prompt 07

## Aşama

Sonuç keşfi, paylaşılabilir analiz kartı, favori öneriler ve kullanıcı sürekliliği.

## Prompt

```text
Sen Codex GPT-5.5 Extra High reasoning modunda çalışan kıdemli frontend mimarı, ürün tasarım lideri, motion designer, UX kalite denetçisi, React/Tailwind/Framer Motion uzmanı ve kullanıcı sürekliliği odaklı ürün geliştiricisisin.

Proje yolu:
C:\Users\erayu\Desktop\tezFinal

Odak:
Bu yedinci geliştirme aşamasıdır. İlk altı fazda ürünün ana arayüzleri premium seviyeye taşındı:
- Tekil premium tasarım sistemi
- Analiz stüdyosu
- Duyguya göre yaşayan sonuç ekranı
- Akademik metrics dashboard
- Login/Register/History/Profile deneyimi
- Demo hazırlığı ve final QA

Bu aşamada ana hedef:
Sonuç ekranını ve öneri deneyimini daha kalıcı, daha keşfedilebilir ve demo sırasında daha akılda kalıcı hale getirmek.

Bu fazda özellikle şu kalan maddeleri kapat:
1. Öneri kartlarını gerçek keşif/carousel deneyimine yaklaştır.
2. Müzik, film, kitap ve tavsiye önerilerine favorileme / daha sonra bak özelliği ekle.
3. Favorileri localStorage ile frontend-only olarak sakla.
4. Favori önerileri ProfilePage veya uygun ayrı bir panelde göster.
5. Analiz sonucunu paylaşılabilir/indirilebilir premium özet kartı olarak üret.
6. Sonuç ekranındaki CTA alanını favoriler ve paylaşım akışıyla güçlendir.
7. Tüm yeni özellikleri mevcut tasarım dili, erişilebilirlik ve mobil davranışla uyumlu yap.
8. Backend sözleşmesini değiştirme.

Çok önemli:
- Backend dosyalarına dokunma.
- Ana çalışma alanın `client` klasörü.
- Gerekirse `docs` klasöründe kısa kullanım notu oluşturabilirsin.
- Yeni backend endpoint yazma.
- Gereksiz büyük bağımlılık ekleme.
- `html-to-image` gibi yeni paket ekleme. Paylaşılabilir kart için mümkünse Canvas API veya mevcut DOM/CSS yaklaşımı kullan.
- Mevcut route yapısını bozma.
- Mevcut API response shape değişmeyecek.
- Kullanıcıya görünen hiçbir yerde `MoodLens`, `tezv2`, `TezFinal` gibi eski kaynak proje isimleri görünmemeli.
- Ürün adı gerektiğinde “Yapay Zeka Destekli Yaşam Koçu” veya kısa olarak “Yaşam Koçu” kullanılmalı.
- Türkçe metinler düzgün karakterlerle yazılmalı.
- İlk altı fazdaki premium karanlık cam panel, aurora, orb, gradient, skeleton ve micro interaction dili korunmalı.
- Favoriler backend'e değil localStorage'a yazılacaksa bunu kullanıcıya abartmadan belirt; “bu cihazda saklanır” gibi net copy kullan.

Başlamadan önce incele:
- `client/src/pages/ResultPage.jsx`
- `client/src/pages/ProfilePage.jsx`
- `client/src/pages/HistoryPage.jsx`
- `client/src/lib/emotions.js`
- `client/src/services/api.js`
- `client/src/styles/global.css`
- `client/src/App.jsx`
- `client/package.json`
- `docs/frontend-30-madde-durum-matrisi.md`

Ön analizde özellikle şunları kontrol et:
- ResultPage içinde öneriler nasıl normalize ediliyor?
- Müzik/film/kitap/tavsiye item shape'leri hangi alanları içeriyor?
- Her öneri kartında başlık, sanatçı/yazar/yıl/rating/reason/link/cover/poster alanları nasıl kullanılıyor?
- ResultPage içinde aktif kategori geçişi nasıl çalışıyor?
- Feedback ve NextStepCtas alanları hangi state'lerle çalışıyor?
- ProfilePage içinde kişisel özet panelinin neresine “Kaydedilen öneriler” alanı eklenebilir?
- LocalStorage key isimleri kullanıcıya görünmeyen internal alanlar olarak nasıl güvenli tutulmalı?
- Build çıktısındaki chunk durumu ve mevcut lazy import yapısı bozulmadan nasıl ilerlenir?

Uygulama planın şu sırayla olsun:

1. Favori öneriler için küçük frontend storage katmanı oluştur
Yeni dosya önerisi:
- `client/src/lib/savedRecommendations.js`

Beklenen API:
- `getSavedRecommendations()`
- `saveRecommendation(item)`
- `removeSavedRecommendation(id)`
- `isRecommendationSaved(id)`
- `toggleSavedRecommendation(item)`
- `clearSavedRecommendations()` sadece gerekirse; kullanıcıya silme aksiyonu koyacaksan dikkatli tasarla.

Storage kuralları:
- localStorage kullanılacak.
- Key kullanıcıya görünmeyen internal bir isim olabilir: `yasam_kocu_saved_recommendations`.
- Öneri item'ı şunları içermeli:
  - id
  - type: music/movie/book/advice
  - title
  - subtitle
  - reason
  - imageUrl
  - externalUrl
  - emotion
  - savedAt
  - sourceHistoryId
- Aynı öneri tekrar kaydedilirse duplicate oluşmasın.
- ID üretimi deterministic olmalı: type + title + subtitle + sourceHistoryId gibi.
- `JSON.parse` hatası olursa uygulama crash etmesin; boş listeye dönsün.
- `window` olmayan ortamlar için guard ekle.

2. ResultPage öneri kartlarına favorileme ekle
Her öneri kartında küçük ama premium bir “Kaydet” / “Kaydedildi” aksiyonu olmalı.

Beklenen UX:
- Kart sağ üstünde bookmark/heart benzeri text-first premium buton.
- Seçilince accent glow ve küçük scale/pulse animasyonu.
- Toast mesajı:
  - “Öneri kaydedildi.”
  - “Öneri kayıtlardan çıkarıldı.”
- Favori state'i kategori değişimlerinde korunmalı.
- Sayfa yenilenince localStorage'dan geri gelmeli.
- Mobilde buton karta binmemeli, dokunulabilir olmalı.
- Kart linki varsa favori butonu link click davranışını tetiklememeli.

Teknik:
- ResultPage state'i localStorage ile senkronize edilebilir.
- Öneri item'ları normalize edilirken favoriye kaydedilecek tek format üretilmeli.
- Backend payload bozulmamalı.

3. Öneri keşif alanını carousel hissine yaklaştır
Mevcut tab/segmented control korunabilir ama aktif kategori içeriği daha “keşif rafı” gibi hissettirmeli.

Beklenenler:
- Desktop'ta yatay media rail / carousel hissi.
- Mobilde yatay kaydırılabilir kart dizisi veya tek kolon premium kartlar.
- Aktif öneri sayısı rozeti.
- “Kaydedilebilir öneriler” gibi kısa microcopy.
- Kartlarda hover tilt abartılı değil, pahalı ve kontrollü.
- Keyboard erişilebilirliği bozulmasın.

Dikkat:
- Gerçek drag carousel yazmak şart değil. CSS scroll-snap ile düşük riskli carousel hissi yeterli olabilir.
- Yeni carousel kütüphanesi ekleme.
- Ekran okuyucu için içerik sırası mantıklı kalmalı.

4. Paylaşılabilir analiz özet kartı ekle
ResultPage içine “Özet kartı indir” aksiyonu ekle.

Beklenen çıktı:
- Kullanıcının duygu sonucu, güven skoru, kısa koç yorumu ve ürün adı bulunan 1080x1350 veya 1200x1200 oranlı premium PNG.
- Kartta kullanıcıya özel aşırı hassas metin komple yazılmasın. Girilen metnin tamamını paylaşma.
- Kart içeriği:
  - Ürün adı: Yapay Zeka Destekli Yaşam Koçu
  - Tespit edilen duygu
  - Güven skoru
  - Kısa destekleyici cümle
  - Tarih
  - “AI destekli duygu analizi” alt etiketi
- Görselde eski proje adı geçmesin.

Teknik seçenek:
- Yeni dependency eklemeden Canvas API kullan.
- `downloadResultSummaryCard(result, emotionMeta)` gibi helper oluşturulabilir:
  - `client/src/lib/resultShareCard.js`
- Canvas çizimi dark premium gradient, aura ve card kompozisyonu içermeli.
- Türkçe karakterler canvas üzerinde düzgün görünmeli.
- Download adı: `yasam-kocu-analiz-ozeti.png`
- Hata olursa toast:
  - “Özet kartı hazırlanamadı.”

Gizlilik:
- Kullanıcının yazdığı duygu metninin tamamı kartta yer almamalı.
- Kart indirme local cihaz aksiyonudur; dışarı veri gönderme yoktur.

5. ResultPage CTA alanını genişlet
Mevcut CTA'lara ek olarak:
- “Özet kartı indir”
- “Kaydedilen önerilere bak”

Davranış:
- Giriş yapılmışsa ProfilePage içindeki kaydedilen öneriler bölümüne yönlendirebilir.
- Giriş yapılmamışsa yine de local favoriler cihazda saklandığı için ProfilePage login gerektiriyorsa CTA metni dikkatli olmalı.
- Alternatif: ResultPage içinde kaydedilen öneri sayısını gösteren küçük panel ekle.

Önerilen güvenli davranış:
- ResultPage altında “Bu cihazda kaydedilen öneriler” mini paneli göster.
- ProfilePage içinde login olan kullanıcıya favoriler paneli göster.
- Login gerektiren route'a zorla göndermeden önce microcopy açık olsun.

6. ProfilePage içine Kaydedilen Öneriler paneli ekle
ProfilePage login gerektiriyor; localStorage favorilerini burada göstermek kullanıcıya değer katar.

Beklenen alan:
- Başlık: “Kaydedilen öneriler”
- Alt metin: “Bu cihazda saklanan müzik, film, kitap ve tavsiye seçimlerin.”
- Kategori filtreleri: Tümü / Müzik / Film / Kitap / Tavsiye
- Her item:
  - type badge
  - title
  - subtitle
  - reason kısa metin
  - savedAt
  - external link varsa “Aç”
  - “Kaldır” aksiyonu
- Empty state:
  - “Henüz kaydedilen öneri yok.”
  - CTA: “Yeni analiz yap”

Dikkat:
- LocalStorage verisi kullanıcı hesabıyla server'a gitmiyor; bunu küçük not olarak belirt.
- Kaldır aksiyonu localStorage'dan siler. Bu local veri silme sayılabilir ama kullanıcı butona basarak açık aksiyon alıyor; ek confirmation şart değil, ancak “Kaldır” metni net olmalı.

7. HistoryPage ile hafif bağlantı kur
History detail modalında öneriler yoksa büyük değişiklik yapma.
Ancak modal CTA alanına “Yeni analiz yap” yanında “Sonuç ekranında önerileri kaydedebilirsin” gibi küçük yönlendirici metin eklenebilir.

Bu adım opsiyoneldir.

8. Erişilebilirlik
- Favori butonlarında `aria-pressed` kullanılmalı.
- “Özet kartı indir” butonu `aria-busy` almalı.
- Carousel/scroll rail keyboard ile okunabilir kalmalı.
- Icon-only buton yapma; text veya aria-label mutlaka olsun.
- Renk tek başına anlam taşımasın.
- Focus ring kaybolmasın.

9. Responsive kalite
Şu viewportları düşün:
- 360px mobil
- 390px iPhone
- 768px tablet
- 1280px desktop

Mobilde:
- Recommendation rail taşmamalı.
- Kaydet butonu kapağın üstünde okunur kalmalı.
- Profile saved recommendations tek kolon akmalı.
- Download CTA bottom nav ile çakışmamalı.

10. Türkçe karakter ve ürün dili kontrolü
Şu metinler düzgün olmalı:
- Kaydet
- Kaydedildi
- Kaydedilen öneriler
- Özet kartı indir
- Bu cihazda saklanır
- Müzik
- Film
- Kitap
- Tavsiye
- Geçmiş
- Profil
- Yapay Zeka Destekli Yaşam Koçu

Bozuk encoding/mojibake kalmamalı. Özellikle Türkçe karakterlerin yanlış kodlanmış göründüğü metinler temizlenmeli.

11. Test/build
Uygulama bittikten sonra çalıştır:
cd C:\Users\erayu\Desktop\tezFinal\client
npm run build

Package script içinde test varsa test de çalıştır.
Eğer test script yoksa final notunda belirt.

Ek kontroller:
- `git diff --check`
- Kullanıcıya görünen frontend dosyalarında eski proje adı araması
- Mojibake marker araması

12. Kod kalite kuralları
- Backend sözleşmesini bozma.
- Yeni büyük dependency ekleme.
- Kullanılmayan import bırakma.
- localStorage parse hatasında crash olmasın.
- Duplicate favori oluşmasın.
- Paylaşılabilir kart kullanıcı metninin tamamını dışa aktarmasın.
- ResultPage aşırı büyürse helper component/lib dosyalarına böl.
- Tasarım premium kalsın ama ekran karmaşıklaşmasın.

Final çıktında şunları ver:
1. Hangi dosyaları değiştirdin?
2. Favori öneriler nasıl çalışıyor?
3. Öneri keşif/carousel deneyimi nasıl geliştirildi?
4. Paylaşılabilir analiz özet kartı nasıl üretildi?
5. ProfilePage kaydedilen öneriler paneli nasıl çalışıyor?
6. Build sonucu başarılı mı?
7. Test script var mıydı?
8. Kalan riskler ve sonraki faz önerisi nedir?

Bu aşamanın başarı kriteri:
Kullanıcı sonuç ekranına geldiğinde sadece önerileri görmekle kalmamalı; beğendiği önerileri kaydedebilmeli, analiz sonucunu premium bir görsel kart olarak indirebilmeli ve profilinde bu cihazda saklanan önerilerini görebilmelidir. Bu özellikler demo sırasında ürünü daha akılda kalıcı, daha gerçek ve daha profesyonel gösterecektir.
```

# Frontend Master Prompt 02

## Aşama

Sinematik sonuç ekranı, duyguya göre değişen premium atmosfer, öneri kartları, confidence ring ve feedback deneyimi.

## Prompt

```text
Sen Codex GPT-5.5 Extra High reasoning modunda çalışan kıdemli frontend mimarı, ürün tasarım lideri, motion designer, UX kalite denetçisi ve React/Tailwind/Framer Motion uzmanısın.

Proje yolu:
C:\Users\erayu\Desktop\tez1\tezFinal

Odak:
Bu ikinci geliştirme aşamasıdır. Birinci aşamada frontend için premium tasarım sistemi, marka temizliği, navbar, footer, mobile bottom navigation, route fallback ve temel UI standardı kuruldu.

Bu aşamada ana hedef:
Sonuç ekranını sıradan analiz çıktısı olmaktan çıkarıp, kullanıcının duygu sonucunu “ürün deneyimi” olarak yaşadığı sinematik ve premium bir sahneye dönüştürmek.

Özellikle şu alanları geliştir:
1. `ResultPage.jsx` ekranını tamamen premium hale getir.
2. Duyguya göre değişen canlı atmosfer, aura ve renk sistemi oluştur.
3. Güven skorunu düz metin yerine animasyonlu confidence ring/gauge olarak göster.
4. Analiz sonucu özetini daha bilimsel ve daha anlaşılır bir “AI karar paneli” haline getir.
5. Müzik, film, kitap ve tavsiye önerilerini media-rich premium kartlara dönüştür.
6. Öneri sekmelerini veya kategori geçişlerini daha akıcı, daha modern ve daha ürün hissiyatlı hale getir.
7. Feedback formunu mikro etkileşimli, keyifli ve güven veren bir deneyime çevir.
8. Loading, error ve empty state’leri global premium tasarım sistemiyle uyumlu hale getir.
9. Mobil görünümü native app hissine yaklaştır.
10. Mevcut backend entegrasyonlarını ve veri sözleşmesini bozmadan çalış.

Çok önemli:
- Backend dosyalarına dokunma.
- Ana çalışma alanın `client/src/pages/ResultPage.jsx` olacak.
- Gerekirse küçük yardımcı componentleri `client/src/components/result/` altında oluşturabilirsin.
- Gerekirse duygu meta verisini `client/src/lib/emotions.js` içinde genişletebilirsin.
- Gerekirse global utility class eklemek için `client/src/styles/global.css` dosyasına sınırlı ve düzenli eklemeler yapabilirsin.
- Mevcut route yapısını bozma.
- `emotionAPI.getRecommendations`, `feedbackAPI.submit`, `useAuthStore`, `historyId`, `location.state.analysisResult` akışlarını bozma.
- API response shape değişmeyecek. Frontend mevcut veriye uyum sağlayacak.
- Kullanıcıya görünen hiçbir yerde `MoodLens`, `tezv2`, `TezFinal` gibi eski kaynak proje isimleri görünmemeli.
- Ürün adı gerektiğinde “Yapay Zeka Destekli Yaşam Koçu” veya kısa olarak “Yaşam Koçu” kullanılmalı.
- Türkçe metinler düzgün karakterlerle yazılmalı.
- Erişilebilirlik ve mobil kullanım bu fazda özellikle önemlidir.
- Gereksiz büyük kütüphane ekleme. Mevcut bağımlılıklar yeterli: React, Tailwind, Framer Motion, React Router, toast.

Başlamadan önce incele:
- `client/src/pages/ResultPage.jsx`
- `client/src/lib/emotions.js`
- `client/src/services/api.js`
- `client/src/styles/global.css`
- `client/src/App.jsx`
- `client/src/pages/AnalyzePage.jsx`
- `client/src/pages/HistoryPage.jsx`
- `client/src/pages/MetricsPage.jsx`
- `client/package.json`

Ön analizde özellikle şunları kontrol et:
- ResultPage hangi verileri kullanıyor?
- `result.emotion`, `result.confidence`, `result.explanation`, `result.warning`, `result.modalityUsed`, `result.modelUsed`, `result.responseTimeMs`, `result.faceDetected` nerelerde gösteriliyor?
- `result.recommendations.music/movie/book/advice` shape’i nasıl normalize edilmiş?
- Feedback form hangi endpoint’e hangi payload ile gidiyor?
- Login olan ve olmayan kullanıcı CTA’ları nasıl ayrılıyor?
- Loading ve error state şu an nasıl görünüyor?
- İlk fazda eklenen global classlar nasıl kullanılabilir?

Uygulama planın şu sırayla olsun:

1. Sonuç ekranı bilgi mimarisini yeniden tasarla
- Ekranı şu ana bölümlere ayır:
  - Duygu sonuç hero alanı
  - AI karar paneli
  - Öneri keşif alanı
  - Feedback deneyimi
  - Sonraki adım CTA alanı
- Bunları tek sayfada çok uzun ve dağınık hissettirmeden, premium section düzeniyle konumlandır.
- Masaüstünde geniş ve etkileyici; mobilde akıcı ve tek elle kullanılabilir olmalı.

2. Duyguya göre değişen atmosfer sistemi oluştur
Her duygu için ekranda şu değişsin:
- Ana accent rengi
- Arka plan aurora tonu
- Confidence ring rengi
- Öneri kartlarının hover/glow tonu
- Hero alanındaki kısa duygu mesajı

`emotions.js` içinde mevcut `accentColor`, `message`, gradient değerleri var. Gerekirse şu alanları ekleyebilirsin:
- `auraFrom`
- `auraTo`
- `softAccent`
- `resultTone`
- `coachPrompt`

Ama backend verisini değiştirme. Sadece frontend meta genişlet.

Tasarım fikri:
- Mutlu: amber/cyan canlı ve aydınlık
- Üzgün: blue/cyan daha sakin ve yumuşak
- Öfkeli: rose/red ama agresif değil, kontrollü
- Endişeli: violet/blue nefes aldıran
- Heyecanlı: pink/amber enerjik
- Sakin: teal/emerald dengeli
- Yorgun: slate/blue düşük parlaklık
- Stresli: orange/rose ama toparlayıcı
- Nostaljik: indigo/amber sıcak
- Motive: green/cyan yükselten
- Belirsiz duygu: slate/cyan nötr

3. Sinematik hero alanı oluştur
Mevcut üst kartı şu yapıya dönüştür:
- Sol veya üst tarafta büyük duygu başlığı
- Duygu etiketini çok net göster: “Tespit edilen duygu: Mutlu”
- Duygu mesajı kullanıcıya doğal ve destekleyici gelmeli.
- Arka planda yavaş hareket eden aura/gradient blob’ları olmalı.
- Kart içinde küçük “AI analizi tamamlandı” rozeti olabilir.
- Emoji kullanılabilir ama tek başına kocaman emojiye yaslanma. Daha premium görünüm için orb, harf, ring veya aura kullan.
- Motion: ilk açılışta hero yumuşak fade/slide ile gelsin; aura sürekli ama düşük yoğunlukta hareket etsin.

4. Confidence ring/gauge ekle
Güven skorunu düz `%85` yazısı olarak bırakma.

Beklenen yapı:
- SVG veya CSS tabanlı circular progress.
- İçinde yüzde değeri.
- Altında “Güven skoru” metni.
- Renk duygu accentColor’dan gelsin.
- İlk render’da halka animasyonla dolsun.
- `prefers-reduced-motion` kullanıcıları için animasyon rahatsız etmeyecek şekilde kısa olmalı.

Teknik:
- Yeni component oluşturabilirsin:
  `client/src/components/result/ConfidenceRing.jsx`
- Veya ResultPage içinde küçük component olarak tutabilirsin.
- Gereksiz bağımlılık ekleme.

5. AI karar paneli oluştur
Mevcut MetricChip alanını daha anlamlı bir panel yap.

Gösterilecek bilgiler:
- Güven skoru
- Analiz tipi: `multimodal` ise “Metin + selfie”
- Model: `result.modelUsed || "gemini-multimodal"`
- Yüz tespiti: var / belirsiz
- Yanıt süresi: varsa ms
- Gerekirse “analiz bağlamı” metni

Tasarım:
- Mikro kartlar değil, “AI karar paneli” gibi hissettiren grid.
- Her bilgi kartında küçük label, güçlü value, kısa açıklama olabilir.
- Mobilde 2 kolon veya tek kolon uyumlu olmalı.

6. Açıklama ve warning alanlarını premium hale getir
- `result.explanation` varsa bunu düz gri kutu yerine “Koç yorumu” kartı olarak göster.
- `result.warning` varsa amber warning paneli olarak göster ama korkutucu değil, açıklayıcı olsun.
- Başlıklar doğal Türkçe olmalı:
  - “Koç yorumu”
  - “Dikkat edilmesi gereken not”

7. Öneri keşif alanını baştan düzenle
Mevcut sekmeli öneriler çalışıyor ama daha premium hale getir.

Beklenen yapı:
- Başlık: “Senin için seçilen öneriler”
- Alt metin: “Duygu sonucuna göre müzik, film, kitap ve kısa tavsiyeler tek alanda toplandı.”
- Kategoriler:
  - Müzik
  - Film
  - Kitap
  - Tavsiye
- Aktif kategori geçişi Framer Motion ile akıcı olmalı.
- Kategori butonları pill/segmented control gibi premium görünmeli.
- Aktif kategori duygu accent renginden hafif glow almalı.
- Mobilde yatay scroll veya grid sıkışmadan çalışmalı.

8. Öneri kartlarını media-rich hale getir
Müzik kartları:
- Kapak varsa göster.
- Yoksa duygu accent renkli fallback cover üret.
- Başlık, sanatçı, reason göster.
- Dış link varsa tıklanabilir olsun.
- Hover’da hafif yükselme, kapakta glow/shine efekti olsun.

Film kartları:
- Poster varsa büyük poster kartı.
- Yoksa sinematik fallback panel.
- Başlık, yıl, rating, overview göster.
- Rating varsa yıldız karakteri bozuk görünmemeli; düz “★” kullanılabilir.

Kitap kartları:
- Kapak varsa küçük kitap kapağı.
- Yoksa premium kitap fallback.
- Başlık, yazar, reason göster.

Tavsiye kartları:
- Tavsiye kartları daha “koç önerisi” gibi görünmeli.
- Başlık + açıklama + accent dot.
- Eğer item.icon bozuk gelirse fallback sade bir sembol kullanılmalı.

Boş state:
- Her kategori için “Bu analiz için henüz ... bulunmuyor.” mesajı premium empty state içinde gösterilmeli.
- Boş state düz yazı olmasın; soft orb/empty illustration kullan.

9. Feedback deneyimini yeniden tasarla
Mevcut 1-5 butonları fonksiyonel ama ürün hissi zayıf. Bunu mikro etkileşimli hale getir.

Beklenenler:
- Başlık: “Bu sonucu nasıl buldun?”
- Alt metin: “Geri bildirimin araştırma metriklerini güçlendirir.”
- Üç rating alanı:
  - Genel memnuniyet
  - Analiz doğruluğu
  - Öneri kalitesi
- Rating butonları duygu accent rengiyle seçilmeli.
- Seçilen rating’de küçük scale/glow animasyonu olmalı.
- `helpful` ve `wouldReuse` ikili seçimleri daha net toggle kartlar olmalı.
- Comment textarea premium input sistemiyle uyumlu olmalı.
- Submit loading state net olmalı.
- Feedback gönderildikten sonra başarı durumu görünmeli:
  - “Geri bildirimin bu analiz için kayıtlı.”
  - Küçük başarılı kayıt rozeti
- Var olan feedback varsa form onunla dolmalı.
- Payload kesinlikle bozulmamalı:
  - overallRating
  - analysisAccuracyRating
  - recommendationQualityRating
  - helpful
  - wouldReuse
  - comment

10. Sonraki adım CTA alanını iyileştir
Sayfa sonunda iki CTA kalmalı:
- “Yeni analiz yap”
- Login durumuna göre:
  - Giriş yaptıysa “Geçmişime git”
  - Giriş yapmadıysa “Sonuçları kaydetmek için giriş yap”

Tasarım:
- Düz border buton değil, premium CTA bar veya iki büyük action card.
- Mobilde alt alta rahat dokunulabilir olmalı.
- Kullanıcıyı analiz döngüsüne geri sokmalı.

11. Loading ve error state’leri premium hale getir
Loading:
- `Sonuç yükleniyor...` yerine premium skeleton/aura state.
- “Analiz sonucu hazırlanıyor” gibi doğal metin.

Error:
- “Sonuç açılamadı” kartı premium tasarıma uysun.
- Kullanıcıya iki net aksiyon ver:
  - Yeniden analiz yap
  - Ana sayfaya dön

12. Mobil ve responsive kalite
Mutlaka şu ekranları düşün:
- 360px mobil
- 390px iPhone
- 768px tablet
- 1280px desktop

Mobilde:
- Hero çok yüksek olmamalı.
- Öneri kartları taşmamalı.
- Tab/segmented control yatayda kırılmamalı.
- Feedback rating butonları rahat dokunulmalı.
- Sayfa sonunda mobil bottom nav ile çakışma olmamalı.

13. Erişilebilirlik
- Tıklanabilir öneri kartlarında `target="_blank"` varsa `rel="noreferrer"` kalsın.
- Button type değerleri korunmalı.
- Rating butonlarında seçili state görsel olarak net olmalı.
- Gerekirse `aria-label` ekle.
- Renk tek başına anlam taşımasın; metin de olsun.
- Focus-visible tasarım sistemiyle uyumlu olsun.

14. Kod organizasyonu
Şu iki yoldan birini seç:

Seçenek A:
Tüm küçük componentleri `ResultPage.jsx` içinde tut.
Bu daha hızlıdır ama dosya büyür.

Seçenek B:
Yardımcı componentleri ayır:
- `client/src/components/result/ConfidenceRing.jsx`
- `client/src/components/result/InsightMetricCard.jsx`
- `client/src/components/result/RecommendationCards.jsx`
- `client/src/components/result/FeedbackPanel.jsx`

Bugünün hızlı sprinti için önerilen:
Eğer çok büyümeyecekse önce `ResultPage.jsx` içinde tut. Ancak dosya aşırı büyürse componentlere böl.

15. Kullanıcıya görünen metin kalitesi
Şu kelimeler düzgün Türkçe karakterlerle yazılmalı:
- Sonuç
- Öneri
- Müzik
- Geçmiş
- Giriş
- Kayıt
- Güven
- Yanıt süresi
- Analiz doğruluğu
- Faydalı
- Değil
- Kısa notun
- Araştırma
- Güncellendi
- Gönder

16. Test ve build
Uygulamadan sonra çalıştır:
cd C:\Users\erayu\Desktop\tez1\tezFinal\client
npm run build

Eğer package script içinde test varsa test de çalıştır. Yoksa final notunda test script olmadığını belirt.

Ek kontrol:
- `client/src/pages/ResultPage.jsx` içinde bozuk Türkçe karakter kalmasın.
- Kullanıcıya görünen frontend sayfa/layout dosyalarında `MoodLens`, `tezv2`, `TezFinal` geçmesin.
- Internal API/header/localStorage eşleşmeleri varsa bunlara dokunulmadığını belirt.

Kod kalite kuralları:
- Backend sözleşmesini bozma.
- Gereksiz bağımlılık ekleme.
- Kullanılmayan import bırakma.
- State yönetimini gereksiz karmaşıklaştırma.
- Mevcut feedback submit davranışını koru.
- Mevcut recommendations fallback davranışını koru.
- Hataları sessiz yutma; kullanıcıya anlamlı mesaj göster.
- Tasarım premium olsun ama okunabilirlik düşmesin.
- Animasyonlar güçlü ama rahatsız edici olmasın.
- Tasarım “AI slop” gibi görünmesin; her hareketin bir amacı olsun.

Final çıktında şunları ver:
1. Hangi dosyaları değiştirdin?
2. ResultPage bilgi mimarisi nasıl değişti?
3. Duyguya göre atmosfer sistemi nasıl çalışıyor?
4. Confidence ring/gauge nasıl uygulandı?
5. Öneri kartları nasıl iyileştirildi?
6. Feedback deneyiminde ne değişti?
7. Build sonucu başarılı mı?
8. Kalan riskler veya sonraki faz için notlar neler?

Bu aşamanın başarı kriteri:
Kullanıcı analiz sonucuna geldiğinde ekran sadece “duygu + öneri listesi” gibi görünmemeli. Bunun yerine, duyguya göre yaşayan bir premium AI yaşam koçu deneyimi hissettirmeli. Sonuç ekranı hocaya veya kullanıcıya gösterildiğinde projenin profesyonel ürün seviyesine yaklaştığı net anlaşılmalı.
```

# Frontend Master Prompt 04

## Aşama

Analiz deneyimi, sinematik giriş akışı, selfie/kamera alanı, misafir hak kurgusu, ek sebep akışı ve mobilde native app hissi.

## Prompt

```text
Sen Codex GPT-5.5 Extra High reasoning modunda çalışan kıdemli frontend mimarı, ürün tasarım lideri, motion designer, UX kalite denetçisi, React/Tailwind/Framer Motion uzmanı ve kullanıcı akışı tasarımcısısın.

Proje yolu:
C:\Users\erayu\Desktop\tezFinal

Odak:
Bu dördüncü geliştirme aşamasıdır. İlk üç aşamada premium tasarım sistemi kuruldu, sonuç ekranı duyguya göre yaşayan bir ürün deneyimine dönüştürüldü ve metrikler ekranı akademik araştırma dashboard kalitesine çıkarıldı.

Bu aşamada ana hedef:
`AnalyzePage.jsx` ekranını sıradan metin + görsel formundan çıkarıp, kullanıcının analiz başlatırken kendini premium bir AI yaşam koçu ürününün içinde hissettiği sinematik, güven veren, mobilde akıcı ve teknik olarak sağlam bir deneyime dönüştürmek.

İkincil hedef:
`HomePage.jsx` içindeki ana CTA ve ürün anlatımını, yeni analiz deneyimine daha güçlü bağlamak. Landing ekranı kullanıcıyı doğrudan “analize başla” akışına ikna etmeli ve ilk 3 misafir analiz kurgusunu net anlatmalı.

Özellikle şu alanları geliştir:
1. `AnalyzePage.jsx` ekranını premium analiz stüdyosu deneyimine dönüştür.
2. Metin giriş alanını “duygu günlüğü / coach prompt” hissi veren daha güçlü bir kompozisyona taşı.
3. Selfie yükleme ve kamera deneyimini canlı tarama efekti olan premium bir alana dönüştür.
4. Misafir kullanıcı için 3 analiz hakkını görsel progress ve net copy ile anlat.
5. 4. analizde login zorunluluğu akışını kırmadan, daha anlaşılır ve şık hale getir.
6. Analiz sırasında sinematik loading overlay oluştur.
7. `needsReason` ek sebep akışını ayrı, sakin ve koç gibi hissettiren bir deneyime çevir.
8. Görsel onay/mahremiyet alanını güven veren premium consent paneline dönüştür.
9. Hata, empty, disabled ve loading state’lerini açık, estetik ve kullanıcıyı yönlendiren hale getir.
10. `HomePage.jsx` üzerinde analiz akışına bağlanan CTA ve ürün hikayesini güçlendir.
11. Türkçe karakter/encoding problemlerini kullanıcıya görünen alanlarda tamamen düzelt.
12. Backend entegrasyonlarını ve veri sözleşmesini bozmadan çalış.

Çok önemli:
- Backend dosyalarına dokunma.
- Ana çalışma alanların:
  - `client/src/pages/AnalyzePage.jsx`
  - `client/src/pages/HomePage.jsx`
- Gerekirse küçük yardımcı componentleri `client/src/components/analyze/` altında oluşturabilirsin.
- Gerekirse global utility class eklemek için `client/src/styles/global.css` dosyasına sınırlı ve düzenli eklemeler yapabilirsin.
- `client/src/services/api.js` dosyasına yalnızca kullanıcıya görünen fallback metinlerinde bariz Türkçe karakter bozulması varsa dokun. API header, localStorage key ve backend uyumluluğu gerektiren internal isimleri kırma.
- Mevcut route yapısını bozma.
- Mevcut analiz API çağrısını bozma:
  - `emotionAPI.analyze(payload)`
- Mevcut guest session akışını bozma:
  - `guestSessionAPI.getGuestRemainingAnalyses()`
  - `guestSessionAPI.getDefaultGuestLimit()`
  - `GUEST_QUOTA_EXCEEDED`
- Mevcut auth akışını bozma:
  - `useAuthStore()`
  - login yönlendirmesi: `/login`, state `{ from: "/analyze" }`
- Mevcut result yönlendirmesini bozma:
  - `navigate(`/result/${result.historyId}`, { state: { analysisResult: result } })`
- Mevcut follow-up akışını bozma:
  - `result.needsReason`
  - `result.followUpQuestion`
  - `reasonText`
  - `previousAnalysis`
- Kullanıcıya görünen hiçbir yerde `MoodLens`, `tezv2`, `TezFinal` gibi eski kaynak proje isimleri görünmemeli.
- Ürün adı gerektiğinde “Yapay Zeka Destekli Yaşam Koçu” veya kısa olarak “Yaşam Koçu” kullanılmalı.
- Türkçe metinler düzgün karakterlerle yazılmalı.
- Gereksiz büyük kütüphane ekleme. Mevcut bağımlılıklar yeterli: React, Tailwind, Framer Motion, React Router, toast.
- Tasarım ilk üç fazdaki karanlık cam panel, aurora, orb, premium card ve gradient diline uyumlu olmalı.

Başlamadan önce incele:
- `client/src/pages/AnalyzePage.jsx`
- `client/src/pages/HomePage.jsx`
- `client/src/services/api.js`
- `client/src/lib/guestSession.js`
- `client/src/store/authStore.js`
- `client/src/lib/emotions.js`
- `client/src/styles/global.css`
- `client/src/pages/ResultPage.jsx`
- `client/src/pages/MetricsPage.jsx`
- `client/package.json`

Ön analizde özellikle şunları kontrol et:
- `AnalyzePage` hangi state’leri kullanıyor?
- `canSubmit`, `guestLocked`, `helperText` nasıl hesaplanıyor?
- Kamera akışı `startCamera`, `stopCamera`, `capturePhoto` ile nasıl çalışıyor?
- Drag/drop ve file validation nasıl yapılıyor?
- `ALLOWED_IMAGE_TYPES` ve 10 MB limit korunuyor mu?
- `fileToBase64` nasıl payload üretiyor?
- `emotionAPI.analyze` hangi payload ile çağrılıyor?
- `needsReason` geldiğinde ikinci analiz turu nasıl çalışıyor?
- `guestRemaining` hangi noktada güncelleniyor?
- Giriş yapmamış kullanıcıda limit dolunca nereye yönlendiriliyor?
- İlk üç fazdaki global classlar nasıl yeniden kullanılabilir?
- Kullanıcıya görünen Türkçe metinlerde encoding bozulması var mı?

Uygulama planın şu sırayla olsun:

1. Analiz ekranı bilgi mimarisini yeniden tasarla
Ekranı şu ana bölümlere ayır:
- Analiz stüdyosu hero alanı
- Misafir hak / hesap modu paneli
- Duygu metni kompozisyon alanı
- Selfie/kamera tarama alanı
- Mahremiyet ve onay paneli
- Ek sebep / follow-up paneli
- Hata ve yönlendirme alanı
- Sinematik analiz başlatma CTA’sı

Ama ekranı uzun ve dağınık yapma. Desktop’ta iki kolonlu güçlü bir stüdyo hissi; mobilde tek elle kullanılabilir, adım adım akan native app hissi ver.

2. Analiz stüdyosu hero alanı oluştur
Mevcut düz başlık yerine premium hero oluştur.

Beklenen yapı:
- Eyebrow: “Analiz Stüdyosu”
- Ana başlık: “Bugünkü ruh halini birlikte okuyalım”
- Alt metin: metin ve selfie sinyalinin birlikte değerlendirildiğini güven veren bir dille anlatmalı.
- Sağda veya altta mini “AI hazırlık sinyali” olabilir:
  - yavaş hareket eden signal dots
  - küçük animated scan bars
  - “metin + selfie + bağlam” üçlüsünü gösteren micro panel
- Motion: hero fade/slide ile gelsin; arka plandaki aura yavaş nefes alsın.

3. Misafir hak panelini premium hale getir
Mevcut helper text fonksiyonel ama ürün hissi zayıf.

Beklenen yapı:
- Login ise:
  - “Hesap modu açık”
  - “Analizlerin profil ve geçmiş ekranında korunur.”
  - küçük güven rozeti
- Guest ise:
  - “Misafir modu”
  - “İlk 3 analiz ücretsiz denenebilir.”
  - kalan hak sayısı büyük ve net gösterilsin.
  - progress bar: `guestRemaining / guestLimit`
  - kalan 0 ise güçlü ama sakin login CTA.

Çok önemli:
- 3 analiz hakkı kuralı doğru anlatılmalı.
- “4. analizde giriş zorunlu” ifadesi net olmalı.
- `guestSessionAPI.getDefaultGuestLimit()` kullanılabiliyorsa bunu kullan.
- Limit dolunca mevcut `/login` yönlendirmesi korunmalı.

4. Metin giriş alanını “duygu günlüğü” deneyimine dönüştür
Mevcut textarea daha premium olmalı.

Beklenenler:
- Başlık: “Duygunu birkaç cümleyle anlat”
- Alt açıklama: “Ne hissettiğini, neyin tetiklediğini ve bedenindeki etkisini yazabilirsin.”
- Textarea içinde sakin, yönlendirici placeholder.
- Karakter sayacı daha estetik olmalı.
- Text uzunluğuna göre küçük “bağlam gücü” göstergesi olabilir:
  - 0-80 karakter: “Kısa bağlam”
  - 80-220 karakter: “Yeterli bağlam”
  - 220+ karakter: “Güçlü bağlam”
- Örnek metin doldur butonu sıradan link gibi durmasın; “İlham ver” micro action olabilir.
- Örnek metinler düzgün Türkçe karakterlerle yazılmalı.
- `needsReason` aktifken ana metin değişirse follow-up state temizlenmeye devam etmeli.

Tasarım/motion fikri:
- Textarea focus olduğunda kartın border’ında yumuşak cyan glow.
- Karakter sayacı küçük progress arc/bar olabilir.
- Örnek metin seçilince hafif flash/reveal animasyonu.

5. Selfie/kamera alanını premium tarama modülüne dönüştür
Mevcut upload alanı işlevsel ama daha etkileyici olmalı.

Beklenenler:
- Başlık: “Selfie sinyalini ekle”
- Alt açıklama: “Yüz ifadesi yalnızca analiz bağlamını güçlendirmek için kullanılır.”
- Görsel yokken:
  - cam panel içinde holographic dropzone
  - hareketli scan line
  - dosya formatları sade rozetler olarak gösterilsin
  - sürükle-bırak aktifken border/glow değişsin
- Görsel varsa:
  - image preview üzerinde premium scan overlay
  - “Selfie hazır” rozeti
  - “Değiştir” ve “Kaldır” aksiyonları
  - görselin üstünü kapatmayan temiz gradient
- Kamera açıkken:
  - canlı video üzerinde scan line efekti
  - köşe çizgileri / face frame hissi
  - “Fotoğrafı çek” ana butonu
  - “Kamerayı kapat” ikincil buton
- Kamera açılamazsa hata mesajı kullanıcıyı yönlendirmeli:
  - “Tarayıcı kamera iznini kontrol et veya görsel yükle.”

Teknik:
- `videoRef`, `canvasRef`, `fileInputRef` korunmalı.
- `stopCamera` kamera track’lerini kapatmaya devam etmeli.
- Component unmount olduğunda açık kamera stream’i kapanmalı. Bunun için cleanup `useEffect` eklemeyi düşün.
- File validation kırılmamalı.
- HEIC/HEIF kabul listesi korunmalı.
- 10 MB limit korunmalı.

6. Mahremiyet/onay panelini güçlendir
Mevcut checkbox işlevsel ama tasarım zayıf.

Beklenenler:
- Ayrı premium consent card.
- Başlık: “Mahremiyet onayı”
- Açıklama: görselin duygu analizi için kullanıldığı, kalıcı galeri mantığında sunulmadığı ve analiz deneyimini güçlendirdiği anlaşılır yazılsın.
- Checkbox seçili olunca kartta accent glow.
- Kullanıcı onay vermediyse CTA disabled kalmalı ama neden disabled olduğu anlaşılmalı.
- Erişilebilirlik için checkbox label ilişkisi net olmalı.

7. Analiz hazırlık checklist’i ekle
Kullanıcı neyin eksik olduğunu anında görmeli.

Checklist maddeleri:
- Duygu metni yazıldı
- Selfie eklendi
- Mahremiyet onayı verildi
- Misafir hakkı uygun / hesap modu aktif

Her madde:
- tamamlandıysa cyan/emerald check hissi
- eksikse slate/amber sakin uyarı
- metin olarak da anlam taşımalı, sadece renge bağlı kalmamalı

Bu checklist mobilde CTA’nın üstünde çok işe yarar.

8. Sinematik analiz loading overlay oluştur
`isAnalyzing` olduğunda yalnızca buton yazısı değişmesin.

Beklenen overlay:
- Sayfa üzerinde modal benzeri ama ürkütmeyen premium panel.
- Başlık: “Analiz hazırlanıyor”
- Alt metin aşamalı gibi görünebilir:
  - “Metin bağlamı okunuyor”
  - “Selfie sinyali değerlendiriliyor”
  - “Kişisel öneriler hazırlanıyor”
- Yavaş dönen orb/ring.
- Scan bars veya signal dots.
- Kullanıcıya işlemin devam ettiğini net hissettirsin.

Teknik:
- Bu overlay `isAnalyzing` true iken gösterilmeli.
- İşlem bitince veya hata olunca kapanmalı.
- Kullanıcı tekrar tekrar tıklayamasın.
- Çok agresif animasyon yapma; premium ve sakin olsun.

9. Ek sebep / follow-up akışını premium hale getir
Mevcut `needsReason` kartı daha özel hissetmeli.

Beklenenler:
- Bu alan ana formdan kopuk değil, “koç bir soru soruyor” hissi versin.
- Başlık: “Kısa bir ek bağlam gerekiyor”
- Alt açıklama: sistemin daha doğru analiz için sebep istediğini sakin dille anlat.
- `followUpQuestion` görünür olmalı.
- `previousAnalysis` varsa küçük özet gösterilebilir:
  - önceki duygu
  - güven skoru
- `reasonText` textarea premium input diliyle uyumlu olmalı.
- CTA metni bu modda “Ek bağlamla analizi tamamla” gibi net olmalı.

Çok önemli:
- Follow-up payload bozulmasın:
  - `reasonText`
  - `previousAnalysis`
- Ana metin veya görsel değişince `clearFollowUp()` mantığı korunmalı.

10. Hata ve disabled state’leri netleştir
Mevcut error alanı daha yönlendirici olmalı.

Beklenenler:
- Hata kartında kısa başlık + açıklama olabilir.
- Eksik metin/görsel/onay durumları checklist ile de görünmeli.
- Guest lock durumunda:
  - “Misafir hakkın doldu”
  - “Devam etmek için giriş yapman gerekiyor”
  - login CTA
- Kamera hatasında dosya yükleme alternatifi önerilmeli.
- Dosya tipi/10 MB hatası anlaşılır olmalı.

11. CTA alanını premium action bar yap
Mevcut tek buton korunabilir ama daha ürün hissi taşımalı.

Beklenenler:
- Desktop’ta geniş premium CTA bar.
- Mobilde bottom nav ile çakışmayacak şekilde rahat dokunulabilir.
- Buton state’leri:
  - Hazır değil: neden hazır olmadığını gösterecek yardımcı metin.
  - Hazır: “Analizi başlat”
  - Follow-up: “Ek bağlamla analizi tamamla”
  - Loading: “Analiz hazırlanıyor...”
  - Guest locked: “Devam etmek için giriş yap”
- Disabled buton erişilebilir ve görsel olarak net olmalı.

12. HomePage analiz akışına daha güçlü bağlansın
`HomePage.jsx` üzerinde sınırlı ama etkili iyileştirme yap.

Beklenenler:
- Ana hero CTA “Analizi Başlat” daha güçlü konumlandırılsın.
- İlk 3 misafir analiz hakkı ve 4. analizde login kuralı net anlatılsın.
- Journey steps görsel olarak premium ama okunabilir kalsın.
- “Metin + selfie + AI yorum + öneriler” akışı daha ikna edici yazılsın.
- Duygu panelinde bozuk Türkçe karakter kalmasın.
- Tasarım ilk üç fazla uyumlu kalsın.

Sınır:
- HomePage’i komple baştan yazmak zorunda değilsin.
- Bu fazın ana odağı AnalyzePage. HomePage sadece analiz akışına giriş kalitesini artırmalı.

13. Türkçe karakter ve kullanıcı metni temizliği
Şu tür bozuk metinleri düzelt:
- `BugÃ¼n` -> `Bugün`
- `GiriÅŸ` -> `Giriş`
- `KayÄ±t` -> `Kayıt`
- `GÃ¶rsel` -> `Görsel`
- `Ã–neri` -> `Öneri`
- `Duygu daÄŸÄ±lÄ±mÄ±` -> `Duygu dağılımı`
- `KÄ±sa` -> `Kısa`
- `yaÅŸam` -> `yaşam`
- `Ã§` / `ÄŸ` / `ÅŸ` gibi tüm mojibake izlerini temizle.

Kontrol edilecek görünür dosyalar:
- `AnalyzePage.jsx`
- `HomePage.jsx`
- Eğer dokunursan `api.js`

Dosya encoding’i UTF-8 olmalı.

14. Eski proje adı kontrolü
Kullanıcıya görünen hiçbir alanda şunlar kalmamalı:
- `MoodLens`
- `tezv2`
- `TezFinal`

Dikkat:
- `api.js` içinde `X-MoodLens-Language` header’ı backend uyumluluğu için internal olabilir; buna dokunma.
- `USER_KEY = "tezfinal_user"` localStorage uyumluluğu için internal olabilir; buna dokunma.
- Kullanıcıya görünen UI metinlerini temizlemek yeterli.

15. Mobil kalite
Mutlaka şu ekranları düşün:
- 360px mobil
- 390px iPhone
- 768px tablet
- 1280px desktop

Mobilde:
- İki kolon tek kolona düzgün düşmeli.
- Kamera/video alanı taşmamalı.
- Textarea yeterli yükseklikte ama ekranı boğmayacak şekilde olmalı.
- CTA bottom navigation ile çakışmamalı.
- Guest panel ve checklist çok yer kaplamamalı.
- Upload alanı parmakla rahat kullanılmalı.

16. Erişilebilirlik
- Button type değerleri korunmalı.
- Kamera, upload ve reset butonlarında aria-label gerekiyorsa ekle.
- Checkbox label erişilebilir olmalı.
- Görsel preview alt text anlamlı olmalı.
- Focus-visible kaybolmamalı.
- Renk tek başına anlam taşımasın; checklist metinle desteklensin.
- Loading overlay ekran okuyucu için anlamlı metin içermeli.

17. Kod organizasyonu
Şu iki yoldan birini seç:

Seçenek A:
Tüm helper componentleri `AnalyzePage.jsx` içinde tut.
Bu daha hızlıdır ama dosya büyür.

Seçenek B:
Tekrar eden veya büyük parçaları ayır:
- `client/src/components/analyze/GuestQuotaPanel.jsx`
- `client/src/components/analyze/EmotionComposer.jsx`
- `client/src/components/analyze/SelfieScanner.jsx`
- `client/src/components/analyze/AnalysisChecklist.jsx`
- `client/src/components/analyze/AnalyzingOverlay.jsx`

Bugünkü sprint için önerilen:
Dosya aşırı büyürse componentlere böl. Ama API/state akışını karmaşıklaştırma. Hızlı ve güvenli ilerlemek için küçük helper componentler `AnalyzePage.jsx` içinde de kalabilir.

18. Test ve build
Uygulamadan sonra çalıştır:
cd C:\Users\erayu\Desktop\tezFinal\client
npm run build

Package script içinde test varsa test de çalıştır. Yoksa final notunda test script olmadığını belirt.

Ek kontrol:
- `AnalyzePage.jsx` ve `HomePage.jsx` içinde bozuk Türkçe karakter kalmasın.
- Kullanıcıya görünen frontend sayfa/layout dosyalarında `MoodLens`, `tezv2`, `TezFinal` geçmesin.
- Build çıktısında chunk uyarısı varsa not et ama bu fazda büyük refactor yapma.

Kod kalite kuralları:
- Backend sözleşmesini bozma.
- Gereksiz bağımlılık ekleme.
- Kullanılmayan import bırakma.
- Kamera stream cleanup’ını unutma.
- File validation davranışını bozma.
- Guest quota/login davranışını bozma.
- `needsReason` ikinci tur analiz akışını bozma.
- Hataları sessiz yutma; kullanıcıya anlamlı mesaj göster.
- Tasarım premium olsun ama anlaşılabilirlik düşmesin.
- Animasyonlar güçlü ama rahatsız edici olmasın.
- Tasarım “AI slop” gibi görünmesin; her hareketin bir amacı olsun.

Final çıktında şunları ver:
1. Hangi dosyaları değiştirdin?
2. AnalyzePage bilgi mimarisi nasıl değişti?
3. Selfie/kamera deneyimi nasıl iyileştirildi?
4. Misafir hak/login zorunluluğu UI’da nasıl anlatıldı?
5. Sinematik loading ve follow-up akışında ne değişti?
6. HomePage analiz akışına nasıl daha güçlü bağlandı?
7. Build sonucu başarılı mı?
8. Kalan riskler veya sonraki faz için notlar neler?

Bu aşamanın başarı kriteri:
Kullanıcı analiz ekranına geldiğinde sadece form doldurduğunu hissetmemeli. Bunun yerine, güven veren, canlı, premium ve yönlendiren bir “AI analiz stüdyosu” deneyimine girmeli. Metin, selfie, mahremiyet onayı, misafir hakları ve analiz başlatma adımları tek bir profesyonel ürün akışı gibi görünmeli.
```

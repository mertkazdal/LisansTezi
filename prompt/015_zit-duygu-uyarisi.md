## Benim promptum

```text
# Review findings:

## Finding 1 (tezcalismasi-main/api-gateway/Controllers/MetricsController.cs:7-18) [added]
[P1] Metrics uçları anonim kullanıcılara sistem geneli veriyi açıyor

`api/metrics/*` endpointleri yetkilendirme olmadan yayınlanıyor ve dashboard cevabına `recentAnalyses` dahil edilerek sistem genelindeki analiz aktivitesi dışarı açılıyor. Bu sayfa frontend navigasyonunda da anonim kullanıcıya açık olduğu için, uygulama üretim ortamına alındığında tüm ziyaretçiler toplam kullanım, geri bildirim ve yakın tarihli analiz özetlerini sorgulayabilir.

## Finding 2 (tezcalismasi-main/client/src/pages/ProfilePage.jsx:102-117) [added]
[P2] Profile sayfasında koşullu hook kullanımı var

Bileşen `isLoggedIn` false olduğunda `return null` ile çıkıyor, ama `useMemo` çağrısı bu dönüşten sonra geliyor. Aynı bileşen oturumsuz/oturumlu durum arasında yeniden render olursa hook sırası değişir ve React'in `Rendered more/fewer hooks than expected` hatasına düşebilir.

## Finding 3 (tezcalismasi-main/api-gateway/Services/AnalyticsService.cs:65-74) [added]
[P2] Recent analyses verisi frontend'in beklediği faceDetected alanını hiç üretmiyor

Metrics ekranı son analiz kartlarında `item.faceDetected` değerine göre rozet gösteriyor, ancak backend'in `AnalyticsRecentAnalysis` veri şekli ve projection'ı bu alanı hiç doldurmuyor. Sonuç olarak yüz tespiti bilgisi mevcut olsa bile bu bölümde asla görünmeyecek.

## Finding 4 (tezcalismasi-main/client/src/pages/MetricsPage.jsx:23-50) [added]
[P2] Metrics sayfası veri çekme hatalarını boş veri gibi gösteriyor

Metrics yüklenirken herhangi bir istek hata verirse catch bloğu tüm state'i `null` yapıp normal render akışına devam ediyor. Böylece backend arızası, CORS problemi veya ağ kesintisi kullanıcıya 'henüz veri yok' gibi görünüyor; gerçek operasyonel hata görünmez hale geliyor.

## Finding 5 (tezcalismasi-main/api-gateway/Program.cs:117-145) [added]
[P2] Veritabanı şeması migration yerine EnsureCreated + elle SQL ile ilerliyor

Başlangıçta `EnsureCreated()` çağrılıp ardından ayrı bir `ExecuteSqlRaw()` ile tablo/index yaratılıyor. Bu yaklaşım şema değişikliklerini versiyonlamıyor; mevcut veritabanlarında kolon/index farkları sessizce birikerek ortamlar arasında drift ve zor teşhis edilen deployment sorunları üretebilir.

# In app browser (IAB):
- The user has the in-app browser (IAB) open.
- Current URL: http://127.0.0.1:3000/analyze

## My request for Codex:
son olarak eklemeni istediğim şey şu kral duygu durumu zıt ise uyarı verilmeli yani foto ile metin arasındaki duygu durumu için bunu nasıl yaparsın bilmemde önemli kral bunu yapsak güzel olur
```

## Senin yaptiklarin

- Multimodal analiz akışında aynı Gemini çağrısından hem `text_emotion` hem de nihai birleşik `emotion` sonucunu isteme mantığını ekledim.
- Yerel yüz modelinden gelen selfie duygusu ile metin sinyalini güven eşiği üzerinden karşılaştırıp güçlü bir çelişki varsa backend tarafında uyarı üretimini bağladım.
- Üretilen uyarıyı mevcut `warning` alanı üzerinden gateway ve frontend hattına taşıdım; böylece ekstra API kırılımı olmadan sonuç ekranına geldi.
- Sonuç ekranında uyarı kartını koç yorumunun üstüne alarak kullanıcının önce kritik notu görmesini sağladım.
- Geçmişte saklanan multimodal bağlam metnini yeni semantiğe göre `Metin sinyali` olacak şekilde düzelttim.
- Result ekranı için uyarının görünmesini ve açıklamadan önce yer almasını doğrulayan bir UI testi ekledim.

## Ozet

Foto ve metin güçlü şekilde ters duygu sinyali verirse sistem artık kullanıcıya uyarı gösteriyor. Bu uyarı backend’de hesaplanıyor, mevcut `warning` hattından taşınıyor ve sonuç ekranında daha görünür şekilde öne çıkarılıyor.

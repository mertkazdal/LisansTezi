# Frontend Master Prompt 05

## Aşama

Hesap sürekliliği, giriş/kayıt deneyimi, misafir analiz taşıma hissi, geçmiş arşivi, profil paneli, veri yönetimi ve kişisel içgörü alanları.

## Prompt

```text
Sen Codex GPT-5.5 Extra High reasoning modunda çalışan kıdemli frontend mimarı, ürün tasarım lideri, motion designer, UX kalite denetçisi, React/Tailwind/Framer Motion uzmanı, auth UX tasarımcısı ve veri mahremiyeti odaklı ürün geliştiricisisin.

Proje yolu:
C:\Users\erayu\Desktop\tezFinal

Odak:
Bu beşinci geliştirme aşamasıdır. İlk dört aşamada premium tasarım sistemi kuruldu, sonuç ekranı duyguya göre yaşayan bir ürün deneyimine dönüştürüldü, metrikler ekranı akademik dashboard seviyesine çıkarıldı ve analiz ekranı premium AI analiz stüdyosuna dönüştürüldü.

Bu aşamada ana hedef:
Kullanıcının sisteme bağlandığı ve geri döndüğü ekranları profesyonel ürün seviyesine taşımak:
- Login
- Register
- History
- Profile

Bu ekranlar artık yalnızca hesap formu veya kayıt listesi gibi durmamalı. Kullanıcı şunu hissetmeli:
“Bu sistem beni tanıyor, analizlerimi koruyor, geçmişimi anlamlı hale getiriyor ve güvenilir bir kişisel yaşam koçu ürünü gibi davranıyor.”

Özellikle şu alanları geliştir:
1. `LoginPage.jsx` ekranını premium güvenli devam deneyimine dönüştür.
2. `RegisterPage.jsx` ekranını hesap oluşturma ve misafir analizleri koruma deneyimine dönüştür.
3. Misafir analizlerin login/register sonrası hesaba taşınmasını UI’da güçlü ve anlaşılır şekilde hissettir.
4. `HistoryPage.jsx` ekranını düz liste olmaktan çıkarıp kişisel duygu arşivi ve timeline deneyimine dönüştür.
5. History filtrelerini, empty/loading/error state’lerini premium hale getir.
6. History detail modal’ını mini sonuç paneli gibi zenginleştir.
7. `ProfilePage.jsx` ekranını açık tema kırıklıklarından kurtarıp premium koyu profil dashboard’una dönüştür.
8. Profilde kişisel istatistikleri, en sık duygu, rol, üyelik bilgisi ve veri yönetimini daha anlaşılır hale getir.
9. Admin overview alanını koyu premium ürün diline uyumlu hale getir.
10. Hesap silme / veri yönetimi alanını güven veren ama ciddi bir deneyime dönüştür.
11. Login/Register/History/Profile dosyalarındaki Türkçe karakter ve encoding problemlerini tamamen düzelt.
12. Backend entegrasyonlarını ve veri sözleşmesini bozmadan çalış.

Çok önemli:
- Backend dosyalarına dokunma.
- Ana çalışma alanların:
  - `client/src/pages/LoginPage.jsx`
  - `client/src/pages/RegisterPage.jsx`
  - `client/src/pages/HistoryPage.jsx`
  - `client/src/pages/ProfilePage.jsx`
- Gerekirse küçük yardımcı componentleri şu klasörlerde oluşturabilirsin:
  - `client/src/components/auth/`
  - `client/src/components/history/`
  - `client/src/components/profile/`
- Gerekirse global utility class eklemek için `client/src/styles/global.css` dosyasına sınırlı ve düzenli eklemeler yapabilirsin.
- Mevcut route yapısını bozma.
- Mevcut auth API çağrılarını bozma:
  - `authAPI.login(form)`
  - `authAPI.register(payload)`
- Mevcut auth store kullanımını bozma:
  - `useAuthStore()`
  - `login(data.user, data.token)`
  - `logout()`
- Mevcut guest merge davranışını bozma:
  - `data.migratedGuestAnalysesCount`
  - `data.guestDataMerged`
- Mevcut history API çağrısını bozma:
  - `historyAPI.getHistory(page, 10)`
- Mevcut profile/admin API çağrılarını bozma:
  - `userAPI.getProfile()`
  - `userAPI.deleteAccount(deleteConfirmationText)`
  - `adminAPI.getOverview()`
  - `adminAPI.downloadExportCsv()`
- Kullanıcıya görünen hiçbir yerde `MoodLens`, `tezv2`, `TezFinal` gibi eski kaynak proje isimleri görünmemeli.
- Ürün adı gerektiğinde “Yapay Zeka Destekli Yaşam Koçu” veya kısa olarak “Yaşam Koçu” kullanılmalı.
- Türkçe metinler düzgün karakterlerle yazılmalı.
- Gereksiz büyük kütüphane ekleme. Mevcut bağımlılıklar yeterli: React, Tailwind, Framer Motion, React Router, toast, i18next.
- Tasarım ilk dört fazdaki karanlık cam panel, aurora, orb, premium card ve gradient diline uyumlu olmalı.

Başlamadan önce incele:
- `client/src/pages/LoginPage.jsx`
- `client/src/pages/RegisterPage.jsx`
- `client/src/pages/HistoryPage.jsx`
- `client/src/pages/ProfilePage.jsx`
- `client/src/services/api.js`
- `client/src/store/authStore.js`
- `client/src/lib/guestSession.js`
- `client/src/lib/emotions.js`
- `client/src/styles/global.css`
- `client/src/pages/AnalyzePage.jsx`
- `client/src/pages/ResultPage.jsx`
- `client/package.json`

Ön analizde özellikle şunları kontrol et:
- Login/Register hangi `from` state’i ile kullanıcıyı geri yönlendiriyor?
- Login/Register sonrası misafir analiz taşıma mesajı nasıl gösteriliyor?
- `migratedGuestAnalysesCount` ve `guestDataMerged` UI’da nasıl daha iyi anlatılabilir?
- History sayfasında page, filterEmotion, selectedItem, loading ve totalPages nasıl çalışıyor?
- History item shape’i hangi alanları içeriyor?
  - `id`
  - `emotion`
  - `confidence`
  - `userText`
  - `createdAt`
  - `modalityUsed`
  - `modelUsed`
  - `responseTimeMs`
  - `faceDetected`
  - `explanation`
- Profile sayfasında profile data hangi alanlarla geliyor?
  - `username`
  - `email`
  - `createdAt`
  - `isAdmin`
  - `totalAnalyses`
  - `mostFrequentEmotion`
  - `canDeleteAccount`
  - `deleteConfirmationText`
- Admin overview shape’i nasıl kullanılıyor?
- i18n kullanımı ProfilePage içinde nasıl duruyor?
- Kullanıcıya görünen Türkçe metinlerde encoding bozulması var mı?
- Açık tema kalan kartlar ilk dört fazın premium koyu tasarımıyla çelişiyor mu?

Uygulama planın şu sırayla olsun:

1. Auth ekranları bilgi mimarisini yeniden tasarla
Login ve Register ekranları aynı ürün ailesi gibi görünmeli.

Ortak yapı:
- Sol veya üst tarafta premium güven paneli
- Sağ veya alt tarafta form paneli
- Ürün kimliği: “Yaşam Koçu”
- Misafir analizleri koruma mesajı
- Güven, geçmiş, kişisel öneri ve veri yönetimi vurguları
- Form state’leri açık, sade ve güçlü

Desktop:
- Geniş split layout etkileyici olmalı.

Mobil:
- Tek kolon, hızlı ve rahat giriş yapılabilir olmalı.

2. LoginPage’i premium güvenli devam ekranına dönüştür
Mevcut login işlevi korunmalı ama görsel kalite yükselmeli.

Beklenenler:
- Eyebrow: “Güvenli devam”
- Başlık: “Analiz geçmişine geri dön”
- Alt metin: kullanıcının analiz geçmişi, önerileri ve profil içgörülerine devam edeceğini anlatmalı.
- Sol panelde veya üst bölümde küçük güven kartları:
  - “Geçmiş korunur”
  - “Misafir analizler taşınır”
  - “Kişisel öneriler sürer”
- Form alanları:
  - E-posta
  - Şifre
- Hatalar:
  - Kırmızı düz kutu değil, premium hata paneli
  - Kısa başlık + açıklama
- Loading:
  - Buton içinde sade spinner/pulse
  - “Giriş yapılıyor...” metni düzgün Türkçe
- Başarılı giriş:
  - `migratedGuestAnalysesCount > 0` ise toast mesajı daha düzgün ve motive edici olmalı.
  - Örnek: “3 misafir analizin hesabına taşındı.”
- Register linki daha iyi CTA olarak görünmeli.

Teknik:
- `from = location.state?.from || "/analyze"` korunmalı.
- `authAPI.login(form)` korunmalı.
- `login(data.user, data.token)` korunmalı.
- `navigate(from, { replace: true })` korunmalı.
- Enter ile submit davranışı korunabilir veya form submit yapısına taşınabilir.

3. RegisterPage’i hesap oluşturma ve veri koruma ekranına dönüştür
Mevcut register işlevi korunmalı ama daha güvenli ve premium hissettirmeli.

Beklenenler:
- Eyebrow: “Hesabını oluştur”
- Başlık: “Analizlerini kalıcı bir içgörü alanına taşı”
- Kullanıcıya şunu net anlat:
  - İlk 3 misafir analiz denenebilir.
  - Hesap oluşturunca misafir analizler hesaba taşınabilir.
  - Geçmiş ve profil ekranları kişisel gelişim için saklanır.
- Form alanları:
  - Kullanıcı adı
  - E-posta
  - Şifre
  - Şifre tekrar
- Validation metinleri düzgün Türkçe olmalı.
- Şifre gücü mini göstergesi eklenebilir:
  - kısa / yeterli / güçlü
  - Bu frontend-only olabilir.
- Password confirm eşleşme durumu görsel olarak net olmalı.
- Kayıt onay/metin paneli:
  - Görsellerin kalıcı medya galerisi gibi sunulmadığı
  - Analiz ve öneri deneyimine odaklanıldığı
  - Kullanıcının verisini yönetebileceği
- Login linki daha iyi CTA olarak görünmeli.

Teknik:
- `authAPI.register` payload bozulmamalı:
  - username
  - email
  - password
- `login(data.user, data.token)` korunmalı.
- `migratedGuestAnalysesCount` toast davranışı korunmalı ve iyileştirilmeli.
- `navigate(from, { replace: true })` korunmalı.

4. Guest merge hissini ürün deneyimine çevir
Login/Register sonrası guest merge sadece toast olarak kalmasın. Mevcut sayfada mümkünse küçük bilgilendirici alan da olsun.

Öneri:
- Login/Register sayfasında eğer kullanıcı misafir moddan geliyorsa veya guest remaining limit düşükse:
  - “Misafir analizlerin hesapla eşleştirilebilir”
  - “Giriş sonrası geçmişin korunur”
- Başarılı login/register sonrası:
  - `migratedGuestAnalysesCount > 0` toast mesajı net ve düzgün Türkçe olsun.
  - `guestDataMerged` true ise daha genel başarı mesajı gösterilebilir.

Backend değişmeyecek. Bu tamamen frontend deneyimi.

5. HistoryPage’i kişisel duygu arşivine dönüştür
Mevcut liste iyi bir temel ama daha profesyonel olmalı.

Beklenen ana bölümler:
- Premium history hero
- Kısa içgörü özeti
- Duygu filtresi ve sayfa kontrolü
- Timeline/list görünümü
- History detail modal
- Empty/loading/error state

Hero:
- Eyebrow: “Kişisel arşiv”
- Başlık: “Analiz geçmişim”
- Alt metin: geçmiş kayıtların ruh hali yolculuğunu anlamaya yardım ettiğini anlatmalı.
- Sağda mini “duygu izleri” görseli veya recent pulse alanı olabilir.

6. History summary kartları ekle
Frontend-only hesaplanabilir:
- Bu sayfadaki analiz sayısı
- En sık görünen duygu
- Ortalama güven skoru
- Yüz sinyali olan analiz sayısı

Dikkat:
- Bu özet sadece yüklenen sayfa item’ları üzerinden hesaplanırsa metinde bunu “Bu sayfa özeti” olarak belirt.
- `NaN`, `undefined`, `null` görünmemeli.

7. History filtrelerini premiumlaştır
Mevcut select çalışıyor ama premium değil.

Beklenenler:
- “Tüm duygular” ve duygu seçenekleri korunmalı.
- Select veya segmented/pill yapısı kullanılabilir.
- Mobilde taşmamalı.
- Filtre değişince seçili detail modal kapanabilir, gerekirse.
- Boş filtre sonucunda özel empty state gösterilmeli.

8. History timeline/list görünümünü güçlendir
Her history item:
- Duygu accent rengiyle işaretlenmeli.
- Duygu adı
- Güven skoru
- Kısa kullanıcı metni
- Tarih
- Analiz tipi
- Model
- Yanıt süresi
- Yüz tespiti rozeti

Tasarım:
- Düz kart listesi yerine compact timeline/pulse list hissi.
- Hover’da hafif yükselme.
- Duygu rengine göre glow.
- Sağda detay oku ama bozuk karakter kullanılmamalı.
- Mobile friendly.

9. History detail modal’ını mini sonuç paneline çevir
Modal şu an bilgi gösteriyor ama daha premium olabilir.

Beklenenler:
- Duygu hero alanı
- Confidence ring veya mini progress bar
- Girilen metin
- Sistem açıklaması
- Model, analiz tipi, yanıt süresi, yüz tespiti
- Tarih
- CTA:
  - “Yeni analiz yap”
  - “Kapat”
- Modal mobilde bottom sheet hissi verebilir.
- Overlay premium blur.
- Escape key ile kapanma eklenebilir ama şart değil.
- Click outside kapanma korunmalı.

10. History loading ve empty state’leri güçlendir
Loading:
- Sadece skeleton list değil, premium skeleton timeline.

Empty:
- Hiç analiz yoksa:
  - “Henüz kayıtlı analiz yok”
  - “İlk analizini yaptığında burada ruh hali yolculuğun oluşacak.”
  - CTA: “İlk analizimi başlat”
- Filtre sonucu boşsa:
  - “Bu duygu için kayıt bulunamadı”
  - “Tüm duygulara dön” aksiyonu.

11. ProfilePage’i premium koyu dashboard’a dönüştür
Mevcut ProfilePage içinde açık tema kartları var. Bunlar ilk dört fazın premium koyu diliyle çelişiyor.

Beklenen ana bölümler:
- Profil hero
- Kişisel istatistik kartları
- Dil tercihi
- Veri yönetimi
- Admin overview
- Hesap silme
- Oturumu kapat

Hero:
- Kullanıcı adı
- E-posta
- Rol
- Üye olma tarihi
- Avatar orb veya harf tabanlı premium avatar
- En sık duygu rengiyle accent

12. Profile istatistiklerini güçlendir
Kartlar:
- Toplam analiz
- En sık duygu
- Rol
- Üyelik tarihi veya hesap durumu

Tasarım:
- Koyu premium kartlar.
- Duygu accent rengi kullanılmalı.
- Açık tema `bg-slate-50`, `text-slate-900` gibi kopuk tasarımlar kaldırılmalı.

13. Dil tercihi alanını premium hale getir
Mevcut i18n kullanımı korunmalı.

Beklenen:
- “Dil tercihi”
- Türkçe / English butonları premium segmented control gibi dursun.
- Seçili dil net görünsün.
- `i18n.changeLanguage(language.key)` ve `localStorage.setItem("language", language.key)` korunmalı.

14. Veri yönetimi alanını güven veren hale getir
GDPR/veri yönetimi metni daha resmi ama anlaşılır olmalı.

Beklenen:
- Başlık: “Veri yönetimi”
- Açıklama: analiz ve öneri verilerinin kişisel içgörü amacıyla kullanıldığı, hesap silme hakkı olduğu anlatılsın.
- Çok kuru yasal metin gibi değil, güven veren ürün dili.
- Eğer i18n metinleri bozuksa kullanıcıya görünen metinleri düzelt.

15. Admin overview alanını premiumlaştır
Admin ise:
- Yönetici özeti koyu premium panelde gösterilmeli.
- Kartlar:
  - Kayıtlı kullanıcı
  - Toplam analiz
  - Öneri kapsama
  - Yüz tespiti
- Top duygular ve model dağılımı listeleri koyu tema uyumlu olmalı.
- CSV export butonu premium olmalı.
- Loading/export state net olmalı.
- Admin error premium hata paneli olmalı.

Teknik:
- `adminAPI.getOverview()` korunmalı.
- `adminAPI.downloadExportCsv()` korunmalı.
- Blob download logic bozulmamalı.

16. Hesap silme alanını ciddi ama panik yaratmayan hale getir
Mevcut silme akışı korunmalı.

Beklenen:
- Ayrı danger zone paneli.
- Başlık: “Hesap ve verileri sil”
- Açıklama: geri alınamaz olduğunu net ama sakin anlat.
- İlk buton tıklanınca confirm alanı açılmalı.
- Confirm input:
  - `deleteConfirmationText` yazılması gerekiyor.
- Silme ve vazgeç butonları premium ama danger dili net.
- `handleDeleteAccount` logic bozulmamalı.

17. Türkçe karakter ve kullanıcı metni temizliği
Login/Register/History/Profile içinde tüm kullanıcıya görünen metinler düzgün Türkçe olmalı.

Özellikle düzelt:
- Giriş
- Şifre
- Kayıt
- Kullanıcı
- Geçmiş
- Öneri
- İçgörü
- Taşındı
- Başarılı
- Yüklenemedi
- Yönetici
- Üye olma tarihi
- Türkçe
- Vazgeç
- Yüz tespiti
- Yanıt süresi
- Hesabımı

Bozuk encoding kalmamalı:
- `Ã`
- `Ä`
- `Å`
- `Â`
- `�`
- garip nokta/bullet karakterleri

18. Eski proje adı kontrolü
Kullanıcıya görünen hiçbir alanda şunlar kalmamalı:
- `MoodLens`
- `tezv2`
- `TezFinal`

Dikkat:
- `api.js` veya `guestSession.js` içindeki internal key/header isimleri backend/localStorage uyumluluğu için kalabilir.
- Bu fazda kullanıcıya görünen UI metinlerini temizlemek öncelikli.

19. Mobil kalite
Mutlaka şu ekranları düşün:
- 360px mobil
- 390px iPhone
- 768px tablet
- 1280px desktop

Mobilde:
- Login/Register formları tek elle rahat kullanılmalı.
- History filtreleri taşmamalı.
- History modal bottom sheet gibi rahat okunmalı.
- Profile kartları tek kolonda düzgün aksın.
- Danger zone ve admin alanı küçük ekranda sıkışmasın.
- Bottom nav ile sayfa sonu çakışmasın.

20. Erişilebilirlik
- Formlar gerçek `<form>` yapısına alınabilir. Alınırsa submit davranışı doğru olmalı.
- Button type değerleri doğru olmalı.
- Input label ilişkisi net olmalı.
- Error metinleri input ile ilişkili olmalı.
- Modal için role/dialog ve aria-label düşün.
- Focus-visible kaybolmamalı.
- Renk tek başına anlam taşımasın.

21. Kod organizasyonu
Şu iki yoldan birini seç:

Seçenek A:
Helper componentleri mevcut page dosyaları içinde tut.
Bu hızlıdır ama dosyalar büyüyebilir.

Seçenek B:
Tekrar eden büyük parçaları ayır:
- `client/src/components/auth/AuthShell.jsx`
- `client/src/components/auth/AuthTrustPanel.jsx`
- `client/src/components/history/HistoryTimelineItem.jsx`
- `client/src/components/history/HistoryDetailModal.jsx`
- `client/src/components/profile/ProfileStatCard.jsx`
- `client/src/components/profile/DangerZone.jsx`

Bugünkü sprint için önerilen:
Eğer çok büyük karmaşa yoksa önce page dosyalarında helper componentlerle ilerle. Tekrar eden auth shell yapısı belirginleşirse `components/auth` içine ayır.

22. Test ve build
Uygulamadan sonra çalıştır:
cd C:\Users\erayu\Desktop\tezFinal\client
npm run build

Package script içinde test varsa test de çalıştır. Yoksa final notunda test script olmadığını belirt.

Ek kontrol:
- `LoginPage.jsx`, `RegisterPage.jsx`, `HistoryPage.jsx`, `ProfilePage.jsx` içinde bozuk Türkçe karakter kalmasın.
- Kullanıcıya görünen frontend sayfa/layout dosyalarında `MoodLens`, `tezv2`, `TezFinal` geçmesin.
- Build çıktısında chunk uyarısı varsa not et ama bu fazda büyük refactor yapma.

Kod kalite kuralları:
- Backend sözleşmesini bozma.
- Gereksiz bağımlılık ekleme.
- Kullanılmayan import bırakma.
- Auth redirect davranışını bozma.
- Guest merge toast davranışını bozma.
- History pagination davranışını bozma.
- Profile delete account logic bozulmamalı.
- CSV export logic bozulmamalı.
- `NaN`, `undefined`, `null` kullanıcıya görünmemeli.
- Hataları sessiz yutma; kullanıcıya anlamlı mesaj göster.
- Tasarım premium olsun ama güven ve okunabilirlik düşmesin.
- Animasyonlar ölçülü ve profesyonel olsun.

Final çıktında şunları ver:
1. Hangi dosyaları değiştirdin?
2. Login/Register deneyimi nasıl değişti?
3. Misafir analiz taşıma hissi nasıl iyileştirildi?
4. History ekranı nasıl kişisel duygu arşivine dönüştü?
5. Profile ekranında hangi dashboard/veri yönetimi iyileştirmeleri yapıldı?
6. Admin ve hesap silme alanında ne değişti?
7. Build sonucu başarılı mı?
8. Kalan riskler veya sonraki faz için notlar neler?

Bu aşamanın başarı kriteri:
Kullanıcı giriş yaptığında, kayıt olduğunda, geçmişine baktığında veya profilini açtığında sistem artık ayrı ayrı ekranlardan oluşan bir öğrenci projesi gibi görünmemeli. Bunun yerine hesap, geçmiş, profil, veri yönetimi ve kişisel içgörü akışları tek bir premium “Yapay Zeka Destekli Yaşam Koçu” ürünü gibi hissettirmeli.
```

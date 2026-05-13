# Web to Mobile Parity Plan

Bu belge web uygulamasinin kanonik davranisini mobil uygulamaya tasirken kapsam kaybini takip etmek icin tutulur.

Son guncelleme: W2M-001

| Alan | Web kanonu | Mobil mevcut | Yapilan duzeltme | Kalan sonraki prompt |
|---|---|---|---|---|
| Route map | `/`, `/analyze`, `/result/:historyId`, `/history`, `/metrics`, `/login`, `/register`, `/profile` | Mobilde ayni ana route ailesi ve ek `/splash`, `/onboarding`, `/settings` vardi | Login/Register route'lari `from` query desteğiyle guncellendi; Metrics shell route icine alindi | Auth guard davranislari W2M-003/W2M-004 ile daha sertlestirilecek |
| Navbar / bottom nav | Web bottom links auth/admin durumuna gore Home, Analyze, Metrics/History/Login, Profile/Register olarak degisir | Mobil bottom nav sabit Home, Analyze, History, Profile idi | `BottomNavShell` authProvider dinleyen dynamic nav yapisina cekildi | Web marker/animation hissi W2M UI polish adimlarinda artirilacak |
| Guest quota display | Navbar'da guest quota pill ve progress var | Quota Home/Analyze icinde daginikti | Bottom shell status strip eklendi; guest kalan hak ve progress global gorunur | Guest quota live refresh icin provider invalidation W2M-002 analiz akisiyle guclenecek |
| Theme toggle | Navbar'da hizli theme toggle var | Mobilde Settings icine gomuluydu | Bottom shell status stripte hizli theme toggle eklendi | Dil toggle global degil; Profile/Settings tarafinda kalacak |
| Language toggle | Web Profile/ThemeProvider/i18n ile anlik degisir | Mobil Profile/Settings providerlari vardi | Home ve shell `t(...)` uzerinden locale'e anlik uyumlu kalacak sekilde korundu | Copy paritesi W2M-006 i18n sprintinde genisletilecek |
| Auth redirect | Web Login/Register `location.state.from || /analyze` ile hedefe doner | Mobil login/register basarida `/` route'una gidiyordu | Login/Register `from` query destekledi; basarida hedef route'a donuyor | Route guardlarda otomatik `from` ekleme daha fazla ekranda genisletilebilir |
| Login guest context | Web guest used, return target, trust items ve merge hint gosterir | Mobil login daha sade trust listesine sahipti | Login hero copy, return target, guest used ve merge hint eklendi | Web layoutundaki iki kolon hissi mobil ergonomiye gore daha da zenginlestirilebilir |
| Register guest context | Web benefits, guest trial, password confirm, strength ve privacy copy icerir | Mobilde password confirm yoktu; benefits daha sadeydi | Password confirm, match validation, benefits, guest trial ve privacy copy eklendi | Strength algoritmasi web regexleriyle daha da eslestirilebilir |
| Home hero | Web hero product identity, CTA ve product promise tasir | Mobil Home vardi ama daha kompakt ve statikti | Hero copy, Start Analysis ve dynamic secondary CTA web mantigina cekildi | Webdeki visual hierarchy daha da detaylandirilabilir |
| Home secondary CTA | Admin -> metrics, auth -> profile, guest -> register | Mobilde kisa yollar sabitti | Secondary CTA auth/admin/guest durumuna gore dinamik oldu | History/Profile alternatifleri W2M sonrasinda A/B netlestirilebilir |
| Home guest quota progress | Web guest progress bar ve trial copy gosterir | Mobilde guest mode body vardi ama dashboard progress eksikti | Home guest/account progress karti eklendi | Quota state analizden sonra anlik refresh W2M-002 ile tamamlanacak |
| Home flow explanation | Web 4 adimli input/emotion/recommendation/history akisini anlatir | Mobilde basit flow vardi | Flow copy ve experience cards web urun niyetine gore yeniden kuruldu | W2M-002 sonrasi Analyze studio adimlariyla birebir baglanacak |
| Home latest result | Web ana sayfa dashboard etkisi tasir; mobilde in-memory result kullanilabilir | Mobil latest result sadece analyze provider sonucuna bagliydi | Latest result/empty state korundu ve web dashboard icinde konumlandi | Backend latest/history fallback sonraki result/history sprintine kaldi |
| Network banner | Web global NetworkStatusBadge kullanir | Mobil app builder global NetworkStatusBanner kullaniyordu | Mevcut global banner korundu; shell ile cakismayacak sekilde alt nav status eklendi | Offline UX W2M-002 analiz submit durumunda tekrar ele alinacak |

## W2M-002 - Analyze Studio Paritesi

Son guncelleme: W2M-002

| Alan | Web kanonu | Mobil mevcut | Yapilan duzeltme | Kalan sonraki prompt |
|---|---|---|---|---|
| Analyze hero | HeroPanel eyebrow, title, description ve aktif mode meta ozeti tasir | Mobil analiz ekrani basit baslik/subtitle ile aciliyordu | Hero web bilgi hiyerarsisine gore yeniden kuruldu; mode summary text/image/multimodal durumuna gore degisiyor | Result sayfasinda duygu hero W2M-003 ile derinlesecek |
| GuestQuotaPanel | Logged in account mode, guest remaining/limit, locked login CTA ve progress bar | Mobilde kucuk account panel vardi; locked state ayri zayifti | Auth/guest/locked state ayrildi, progress bar ve login/register CTA eklendi | Backend quota refresh diger ekranlarda W2M sonrasi genisletilebilir |
| ComposerPanel | Multiline text, example fill, character/context progress ve context strength | Mobilde yalniz multiline input vardi | Example text fill, context strength ve 1000 karakter progress eklendi | Webdeki drag/pulse animasyonunun daha zengin varyanti ileride eklenebilir |
| Example text | TR/EN example texts i18n uzerinden kullanilir | Mobilde example text yoktu | Uc ornek metin TR/EN i18n'e alindi ve random fill butonu eklendi | Ornek metin seti tez demo senaryosuna gore artirilabilir |
| ModeCards | getAnalysisMode text/image/multimodal/empty durumunu gosterir | Mobilde aktif mode gostergesi yoktu | Text-only, image-only, multimodal kartlari ve live/waiting pill eklendi | Kart icindeki mikro animasyonlar ileride cilalanabilir |
| SelfiePanel | Drag/drop, preview, remove, camera, scan overlay | Mobilde galeri/kamera ve preview vardi ama studio hissi zayifti | Scanner/corner frame preview, gallery/camera action, remove ve file meta eklendi | In-app live camera preview paket/izin riski nedeniyle bu promptta image_picker camera action olarak birakildi |
| Camera/gallery | File type/size validation ve camera access error crash uretmez | ImageInputService bu kontrati zaten destekliyordu | UI aksiyonlari web karsiligina tasindi; provider hata mesajlari inline/snackbar ile gorunuyor | Native permission copy platform testinde tekrar izlenecek |
| ConsentCard | Image varsa consent zorunlu hard gate | Mobilde checkbox vardi ama studio readiness ile bagli degildi | Image secilince consent card aciliyor; consent yoksa CTA disabled; image remove consent resetliyor | Consent copy hukuki metin olarak finalde tekrar gozden gecirilebilir |
| ChecklistPanel | Text/context, visual consent, account/guest quota maddeleri done/pending | Mobilde checklist yoktu | Done/pending ikonlu readiness checklist eklendi | Checklist itemlari result/history sprintlerinden sonra daha spesifik hale getirilebilir |
| ErrorPanel | Guest locked login CTA; backend/input hatasi temiz panel | Mobilde hata snackbari agirlikliydi | Inline error panel, guest locked login/register CTA ve ApiException mesajlari eklendi | Offline banner ile error panel copy uyumu QA sprintinde kontrol edilecek |
| ActionBar | Sticky bottom, canSubmit, locked, loading ve readiness message | Mobilde buton listenin sonunda kalabiliyordu | Bottom sticky action bar eklendi; klavye acilinca body resize ile erisilebilir kaliyor | Kucuk cihaz UI testi W2M QA sprintinde netlesecek |
| LoadingOverlay | Mode'a gore step listesi ve premium motion overlay | Mobilde basit loading karti vardi | Full-screen scrim overlay, AnimatedLoading ve mode-specific loading steps eklendi | Loading sureleri backend yanitlariyla cihaz testinde izlenecek |
| Follow-up | needsReason/followUpQuestion ile ek cevap ayni endpoint'e gider | Mobil follow-up vardi | Follow-up karti web urun diliyle yenilendi; ayni repository endpoint'i korunuyor | Result replacement davranisi W2M-003 result fallback ile tekrar test edilecek |
| Result navigation | Basarili analizden sonra `/result/:historyId` state ile acilir | Mobil listener zaten route'a gidiyordu | Listener korundu; follow-up gerekmiyorsa historyId ile result route'una gidiyor | Result ekraninin web kanonu W2M-003 kapsaminda |
| Payload parity | `text`, `imageBase64`, `mimeType`, `guestSessionId`; empty alanlar temiz | Mobil data katmani zaten bu kontrata yakindi | Provider quota invalidation eklendi; repository payload paritesi korundu | Backend probe/E2E test W2M QA sprintine kaldi |

## W2M-003 - Result Page Paritesi

Son guncelleme: W2M-003

| Alan | Web kanonu | Mobil mevcut | Yapilan duzeltme | Kalan sonraki prompt |
|---|---|---|---|---|
| Result route data source | Analyze navigation state once kullanilir, yoksa recommendation endpointi denenir | Mobil analyzeProvider sonucunu ve resultDetailProvider fallback'ini kullaniyordu | Veri kaynagi korunup tek `_ResultData` modelinde toplandi | Cihaz E2E ile cold-start route tekrar denenmeli |
| Cold-start fallback | `GET /api/recommendations/{historyId}`, sonra history fallback | Mobilde result detail + history fallback vardi | Fallback copy ve empty/loading/error state'leri web urun diliyle netlestirildi | History fallback zenginligi W2M-004 ile artacak |
| ResultHero | Emotion badge, duygu atmosferi, AI complete, confidence | Mobil hero daha basitti | Duygu rengine gore atmosfer, emoji, badge, confidence ring ve result tone eklendi | Webdeki daha buyuk aura motion cihaz polishinde artirilabilir |
| Emotion atmosphere | Emotion meta accent/aura ile sayfa atmosferi degisir | Mobil genel gradient kullaniyordu | Hero ve kart accentleri emotion color ile baglandi | Tum sayfa background emotion aura W2M polishte derinlestirilebilir |
| Confidence visualization | Hero icinde confidence vurgusu | Mobilde confidence ring vardi | Confidence ring hero icine tasindi ve metadata yuzdesi eklendi | Yok |
| InsightPanel | Coach comment, warning, explanation | Mobil explanation karti sadeydi | Warning ve coach insight ayri narrative panel olarak kuruldu | Yok |
| Warning panel | Sakin ama gorunur warning | Mobil warning line vardi | Accentli warning narrative card eklendi | Yok |
| Metadata grid | modality, model, response time, face, history id, confidence | Mobil metadata listesinde eksikler vardi | 6 alanli metadata grid kuruldu | Yok |
| RecommendationExplorer | Music/movie/book/advice tablari ve kategori aciklamalari | Mobil oneriler grup olarak alt alta listeleniyordu | Segmented category explorer, count ve category empty state eklendi | Daha ileri carousel motion sonraki polishte |
| Music cards | Title, artist, reason, cover/url | Mobil line itemdi | Media-card yapisi, image fallback, save/external action eklendi | Gorsel cache optimizasyonu QA/polishte |
| Movie cards | Title, year/rating, overview/reason, poster/url | Mobil line itemdi | Movie alanlari kartta kayipsiz gosteriliyor | Yok |
| Book cards | Title, author, reason/description, cover/url | Mobil line itemdi | Book alanlari kartta kayipsiz gosteriliyor | Yok |
| Advice cards | Title, description/reason, source/category | Mobil line itemdi | Advice kartlari icon fallback ve source/category meta ile gosteriliyor | Yok |
| Save recommendation | Toggle, duplicate engeli, local storage | Mobil toggle vardi | Save state card icinde belirginlesti; imageUrl/emotion saved modele eklendi | Profile kartinda image kullanimi ileride artirilabilir |
| Saved count | Result icinde bu sonuctan kaydedilen sayi | Mobilde share/profile tarafinda dolayliydi | NextStepCtas icinde result-specific saved count gosterildi | Yok |
| External URL action | Harici link acilir, hata temiz ele alinir | Mobil launchUrl kullaniyordu | Link acilamazsa lokalize hata snackbar'i eklendi | Yok |
| FeedbackPanel | GET feedback, varsa ozet, yoksa form; POST DTO | Mobil feedback bottom sheet agirlikliydi | Result icinde inline feedback paneli, rating/switch/comment ve already submitted state kuruldu | Feedback update endpointi yoksa yeniden submit engeli korunacak |
| Already submitted feedback | Mevcut feedback varsa ozet gosterilir | Mobil ozet vardi | Ozet daha belirgin hale getirildi; submit formu gizleniyor | Yok |
| NextStepCtas | New analysis, history, profile/saved, login-to-save | Mobil next steps sinirliydi | New analysis, history, saved/profile ve guest login-to-save CTA'lari eklendi | Yok |
| Share/download | Result share card PNG/download niyeti ve fallback | Mobil share denemesi vardi | PNG share RepaintBoundary ve text fallback korundu, share preview web kart niyetine gore yenilendi | Native share cihaz uzerinde QA sprintinde test edilecek |
| Guest login-to-save state | Guest ise login CTA hedef route ile | Mobil login CTA route kaybi yasayabiliyordu | `/login?from=/result/:historyId` route'u eklendi | Auth redirect W2M genel guard sprintinde tekrar kontrol edilecek |

## W2M-004 - History Page Paritesi

Son guncelleme: W2M-004

| Alan | Web kanonu | Mobil mevcut | Yapilan duzeltme | Kalan sonraki prompt |
|---|---|---|---|---|
| Auth-only state | Web HistoryPage auth yoksa login'e yonlendirir ve history endpointini zorlamaz | Mobil guest state vardi ama route hedefi daha zayifti | Guest kullanici icin login/register CTA'lari `/login?from=/history` ve `/register?from=/history` ile kuruldu | Genel guard otomasyonu sonraki route sertlestirme sprintinde genisleyebilir |
| Guest CTA | Web history icin hesap gerektigini net anlatir | Mobil empty state daha genel kalabiliyordu | Guest aciklamasi web copy niyetine gore hesap, history ve guest migration baglamiyla yenilendi | W2M-005 Profile guest copy ile tutarlilik kontrol edilecek |
| History data source | `historyAPI.getHistory(page, 10)` ve backend pagination DTO | Mobil repository zaten `/api/history?page=&limit=` kullaniyordu | Data source korundu; provider state ve UI web timeline ihtiyacina gore genisletildi | Backend E2E M/QA sprintinde tekrar probelanacak |
| Pagination | Web page/totalPages ile sayfalar | Mobil loadMore vardi | `hasMore`, page tracking ve duplicate item engeli netlestirildi | Cihaz testinde sonsuz scroll esigi izlenecek |
| Pull-to-refresh | Web manuel reload/pagination; mobilde native refresh beklenir | Mobil refresh vardi | Refresh state korunup auth screen icinde stabil hale getirildi | Yok |
| Load-more | Web pagination butonlari | Mobil scroll sonuna yaklasinca loadMore yapiyordu | Scroll threshold ve manuel `Daha fazla yukle` footer butonu beraber calisir hale getirildi | Yok |
| Summary stats | Web count, top emotion, multimodal, face detected gosterir | Mobilde sinirli summary vardi | Loaded count, total count, top emotion, average confidence, multimodal count, face signal count ve latest date eklendi | Backend tarafindan daha zengin aggregate gelirse modele eklenebilir |
| Emotion filters | Web all + emotion options select kullanir | Mobil loaded emotion setine gore filtreliyordu | All + Emotion enum chips, count ve active state web kanonuna gore kuruldu | W2M-006 i18n/copy sprintinde emotion label kapsami genisleyebilir |
| Timeline/card layout | Web timeline kartlari emotion, modality, face, text, date, response time ve model gosterir | Mobil kartlar daha basitti | Timeline dot/line, EmotionBadge, confidence, date, modality, face, model, response time, explanation ve user text snippet eklendi | Mini detail modal yerine mobil result route kullanimi bilincli tercih olarak korundu |
| Card metadata | Web kartlar analiz teknik sinyallerini taranabilir verir | Mobilde model/response time eksikti | Model ve response time pill olarak eklendi; uzun metinler maxLines/ellipsis ile sinirlandi | Yok |
| Result navigation | Web detail modal acabilir; mobil result detail route hedeflenir | Mobil card tap result route'una gidiyordu | `/result/:historyId` route'u korundu ve CTA ile belirginlesti | Result fallback W2M-003 kapsaminda |
| Empty state | Web history bosken kullaniciya anlamli bos durum verir | Mobil empty state vardi | Empty history Analyze CTA ile web urun akisini tamamlar hale getirildi | Yok |
| Error/retry state | Web load error retry verir | Mobil error state vardi | Initial error, inline error ve retry CTA ayrildi | Yok |
| Date/locale formatting | Web locale tarih formatlari kullanir | Mobil intl kullanimi vardi | Tarih formatlari locale'e gore `tr`/`en` ayrildi; latest date summary eklendi | Timezone ve relatif tarih copy sonraki polishte iyilestirilebilir |

## W2M-005 - Profile Page Paritesi

Son guncelleme: W2M-005

| Alan | Web kanonu | Mobil mevcut | Yapilan duzeltme | Kalan sonraki prompt |
|---|---|---|---|---|
| Guest profile state | Web guest kullaniciyi login/register akisine tasir ve profile verisi istemez | Mobil guest state yalniz login CTA ile basitti | Guest profile login/register/analyze CTA, quota progress ve migration copy ile yenilendi | Guest merge mesajlari auth ekranlariyla birlikte genel QA'da izlenecek |
| Auth profile data source | `GET /api/user/profile` id, username, email, role, isAdmin, createdAt, totalAnalyses, mostFrequentEmotion okur | Mobil model endpointi kullaniyordu | Model `userId`/feedback aliaslarini da guvenli parse eder hale getirildi | Backend feedbackCount DTO'da yoksa 0 kalir; backend genislerse otomatik parse edilecek |
| Profile hero/account card | Web avatar, display name, email, role, member since ve active account ozeti verir | Mobil hero cok sadeydi | Emotion-accent avatar, username/email, role badge, member date ve account mode paneli eklendi | AvatarUrl gorsel kullanimi sonraki polishte eklenebilir |
| Profile stats | Web total analyses, frequent emotion, role, membership date kartlari tasir | Mobil row list kullaniyordu | Total analyses, top emotion, feedback count, saved count, role ve createdAt grid olarak kuruldu | Account age relative copy ileride eklenebilir |
| Language preference | Web profile icinden dil degistirir ve localStorage'a yazar | Mobil language panel vardi | Dil paneli profile icinde web copy niyetiyle korundu; locale provider ile aninda rebuild olur | Yok |
| Theme/settings shortcut | Web account deneyimi ayarlar ve veri yonetimiyle baglidir | Mobil settings butonu vardi | Profile -> Settings shortcut ve Settings -> Profile uyumu korundu; Settings logout Home'a doner | Theme kisayolu Profile icinde direkt toggle degil, Settings shortcut olarak bilincli tutuldu |
| Saved recommendations source | Web `savedRecommendations.js` local store tek kaynaktir | Mobil provider local SharedPreferences kullanıyordu | Saved model web aliaslariyla genisledi; `savedAt`, image/url/historyId aliaslari parse ediliyor | Native storage event gerekmez; Riverpod state tek kaynak |
| Saved recommendations filters | Web all/music/movie/book/advice filtreleri kullanir | Mobil filtreler vardi | Filter chips, category summary ve filter empty state web kanonuna gore yenilendi | Yok |
| Saved recommendation cards | Web image-aware card ve type meta gosterir | Mobil tile ikon tabanliydi | Cover/poster image, fallback icon, title, subtitle, reason, emotion/type pill, external/source actions eklendi | Image cache/perf cihaz QA'da izlenecek |
| Remove/clear saved recommendations | Web item remove destekler | Mobil remove/clear vardi | Remove action card icinde netlesti; clear all confirmation korundu | Yok |
| Source result navigation | Web saved item sourceHistoryId tasiyabilir | Mobil source result action vardi | `sourceHistoryId` varsa `/result/:historyId` aciliyor | Yok |
| External URL action | Web externalUrl acabilir | Mobil url_launcher kullaniyordu | Link acilamazsa lokalize snackbar hatasi eklendi | Yok |
| Admin shortcut | Web admin ise admin overview/export bolumu gosterir | Mobil admin metrics shortcut vardi | Admin-only metrics shortcut ve CSV export disabled note korundu | Admin overview dashboard W2M-006 Metrics sprintinde derinlesecek |
| Logout | Web `logout()` storage temizler, quota resetler ve `/` route'una gider | Mobil logout `/login` route'una gidiyordu | Profile ve Settings logout sonrasi Home (`/`) route'una doner hale getirildi | Yok |
| Account delete confirmation | Web delete text backend `DELETE` ile dogrulanmadan aktif olmaz | Mobil dialog vardi | Dialog ready/not-ready state ve disabled delete butonu ile netlestirildi | Yok |
| Account delete backend payload | Web `DELETE /api/user/account` `{ confirmationText }` yollar | Mobil repository ayni payload'i kullaniyordu | Basarili response deletedAnalyses/deletedRecommendations snackbar copy'sine baglandi | Yok |
| Empty/loading/error states | Web profile skeleton/error/paneller kullanir | Mobil loading/error vardi | Auth restore loading, profile loading, error retry ve guest empty state ayrildi | Skeleton yerine AnimatedLoading bilincli mobil karsilik |

## W2M-006 - Metrics Page Paritesi

Son guncelleme: W2M-006

| Alan | Web kanonu | Mobil mevcut | Yapilan duzeltme | Kalan sonraki prompt |
|---|---|---|---|---|
| Guest gate | Web metrics not logged in durumunda login CTA ve home fallback verir | Mobil guest state vardi | Guest gate `/login?from=/metrics` ve Home ikincil CTA ile web akisma cekildi | Yok |
| Auth non-admin gate | Web admin olmayan kullaniciya admin required state verir | Mobil non-admin EmptyState vardi | Non-admin state profil/home CTA ile teknik 403 gostermeden netlestirildi | Yok |
| Admin data source | Web dashboard, research, response-times, emotion-distribution endpointlerini yukler | Mobil bundle ayni endpointleri yukluyordu | Bundle comparison ve admin overview dahil raw-safe bolumlerle UI'a tam baglandi | Cihaz E2E'de admin hesapla tekrar denenmeli |
| Dashboard KPI grid | Web total, registered, guest, response, confidence, coverage kartlari gosterir | Mobil grid vardi ama daha sade ve eksik kalite sinyalliydi | KPI grid total analyses, users, registered, guest, confidence, response, coverage, feedback, average rating ile genisledi | Yok |
| Emotion distribution | Web pie chart + legend kullanir | Mobil pie chart vardi | Emotion distribution pie/list web kanonuna gore sirali ve label/percentage ile gosteriliyor | Yok |
| Response times | Web line/bar response sample chart gosterir | Mobil bar chart vardi | Response average/min/max pill ve response samples bar chart korundu, empty state eklendi | Line chart yerine mobilde bar chart bilincli ergonomik karsilik |
| Research section | Web feedback quality, audience, face, speed, emotion satisfaction bolumlerini okur | Mobil raw research karti sinirliydi | Research summary kalite gridine baglandi; raw nested map/list kayipsiz flat row olarak gosteriliyor | Segment-specific visual panels W2M polishte daha zenginlesebilir |
| Comparison section | Web comparison endpointi modality/user satisfaction/audience/quality verir | Mobil comparison raw karti vardi | Comparison raw-safe section genis flat parse ile eklendi | Yok |
| Admin overview | Web/admin profile overview summary, top emotions, model distribution, recent analyses tasir | Mobil admin overview raw karti vardi | Admin overview raw-safe section ve dashboard distribution/recent analyses bolumleri eklendi | CSV native export sonraki native sprintte ele alinabilir |
| Recent analyses/raw data | Web recent analyses listeler ve charts section raw chart verilerini kullanir | Mobil recent analiz gosterimi yoktu | Dashboard `recentAnalyses` compact timeline olarak gosteriliyor; raw data 32 satira kadar tasir | Yok |
| Unauthorized/forbidden handling | Web 401/403 teknik hata yerine state gosterir | Mobil provider state ayiriyordu | Provider unauthorized/forbidden state korunup UI guest/non-admin gate ile uyumlu hale getirildi | Yok |
| Empty/loading/error/retry states | Web loading skeleton, empty notice ve error state verir | Mobil loading/error vardi | Premium loading, refresh, empty dashboard, raw empty, response empty ve retry state'leri tamamlandi | Yok |
| Chart/list fallback | Web chart data yoksa empty card verir | Mobil bazi chartlarda bosluk kalabiliyordu | Emotion, response, raw, recent, distribution listeleri icin empty/list fallback eklendi | Yok |

## Benim promptum

şu canlı akışı biraz sola al artık sağdaki kesik çizgilere taşıyor şunu düzelt

# Claude Code Prompt — Kişisel Yaşam Koçu: Onboarding Anketi Frontend

Bir AI yaşam koçu uygulaması için ilk açılışta gösterilecek onboarding anketi istendi. Anket koyu bordo/vişne tonlarında, tek sayfalık slayt/kart akışı şeklinde olacak; Framer Motion ile yatay slide + fade animasyonu kullanacak; Playfair Display ve DM Sans fontlarıyla tasarlanacak; seçimler pill/chip kartlar şeklinde olacak.

Akış:
- Ekran 0: "Seni biraz tanıyalım" karşılama ekranı.
- Ekran 1: Müzik dünyası, multi-select max 3.
- Ekran 2: Film & dizi tonu, multi-select max 3.
- Ekran 3: Kitap & okuma, multi-select max 3.
- Ekran 4: Günlük ritim, single-select.
- Ekran 5: Sosyal enerji, single-select slider tarzı 4 seçenek.
- Ekran 6: Stresle başa çıkma, multi-select max 2.
- Ekran 7: Hayat felsefesi, single-select kart formatı.
- Ekran 8: "Profilin hazırlandı ✦" tamamlanma ekranı.

Teknik istekler:
- React functional components + hooks.
- CSS Modules tercihli.
- Framer Motion animasyonları.
- localStorage ile anket sonucu saklama.
- `onSurveyComplete(userProfile)` callback.
- Tamamlanan anket bir daha gösterilmemeli.
- Mobil-first ve 375px uyumlu.
- ARIA label ve klavye erişilebilirliği.
- `prefers-reduced-motion` desteği.
- Tüm bileşenler tek bir `OnboardingSurvey` feature klasöründe organize edilecek.

## Senin yaptıkların

- Canlı akış sağ panelinin sağ marginini artırıp kartı kesik iç çerçeveden sola çektim.
- Alçak desktop ekran override’ında da canlı akış sağ boşluğunu korudum.
- `client/src/features/onboarding/` altında `OnboardingSurvey` feature klasörünü oluşturdum.
- `OnboardingSurvey.jsx`, `OnboardingSurvey.module.css` ve `index.js` dosyalarını ekledim.
- 8 adımlı onboarding akışını karşılama ve tamamlanma ekranlarıyla birlikte kurdum.
- Multi-select max sınırlarını, single-select ekranlarını, disabled chip davranışını ve progress barı ekledim.
- Framer Motion ile slide/fade geçişleri, chip seçildi animasyonu ve tamamlanma pulse animasyonu ekledim.
- `life-coach-onboarding-profile` localStorage kaydını `{ userProfile: ... }` formatında yazdırdım.
- Tamamlanan profil varsa onboarding’in tekrar açılmamasını sağladım.
- App kabuğuna onboarding overlay entegrasyonunu ve `life-coach:onboarding-complete` event yayını ekledim.
- Google Fonts linkine Playfair Display ve DM Sans ailelerini ekledim.
- Test ortamındaki Framer Motion mock’una `useReducedMotion` desteği ekledim.
- Docker client imajını yeniden build edip güncelledim.

## Özet

Canlı akış kartı artık sağdaki kesik çizgiye taşmıyor; Docker üstünde 1440px genişlikte çizgiden 42px içeride doğrulandı. Onboarding anketi ilk açılışta overlay olarak geliyor, tamamlanınca istenen `userProfile` formatını localStorage’a kaydediyor ve sonraki yenilemede tekrar açılmıyor.

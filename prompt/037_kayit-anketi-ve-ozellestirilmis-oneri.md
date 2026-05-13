## Benim promptum

simdi kral senden istedigim su bir oneri sistemi istiyorum kullanici kayit olurken bir anket doldurmali ve film ve muzik secimlerimizi duygu durumuna gore vericez evet ama bir yandan da bu anketten kullaniciyi taniyarak farkli kriterlerini de dikkate alarak o kullaniciya ozel seyler vermesini saglayabiliriz yani onerileri ozellestirmemiz gerekiyor bunun disinda birde filmleri cekerken bazi filmlerin kapak fotolari buyuk oluyor ve gorsel olarak guzelligi bozuyor hepsinin boyutu ayni olmali ki absurt durmasin bunlari duzeltip bu promptumu formata uygun kaydetmeni istiyorum

## Senin yaptiklarin

- Kullanicinin kayit sirasinda dolduracagi zorunlu bir tercih anketi ekledim.
- Anket veri modeli backend tarafinda `users` tablosuna baglandi:
  - `recommendation_goal`
  - `energy_preference`
  - `favorite_music_genres`
  - `favorite_movie_genres`
  - `favorite_book_genres`
- Bunun icin:
  - `api-gateway/Models/User.cs` guncellendi
  - `api-gateway/DTOs/DTOs.cs` icine `RecommendationSurveyRequest/Response` eklendi
  - `api-gateway/Services/RecommendationSurveyService.cs` adinda yeni bir servis yazildi
  - `api-gateway/Migrations/20260504120000_AddRecommendationSurveyToUsers.cs` adli migration eklendi
  - `api-gateway/Migrations/AppDbContextModelSnapshot.cs` guncellendi
- `AuthController` icinde kayit olurken artik bu anket zorunlu:
  - secimler normalize ediliyor
  - gecersiz / eksik survey durumunda net hata kodlari donuluyor
  - survey cevabi kullaniciya kaydediliyor
- `UserController` profil cevabina anket verisini de ekler hale getirildi.
- Oneri akisini kisilestirmek icin:
  - analiz sonucundan sonra oneriler istenirken kullanicinin survey tercihleri `context` icine ekleniyor
  - boylece Spotify, TMDB, Google Books ve follow-up Gemini tarafi sadece duyguya degil kullanici tercih sinyaline de bakiyor
  - bu baglam `AnalyzeController` ve `RecommendationsController` icinde kullanildi
- Frontend tarafinda kayit formuna yeni bir tercih anketi alani eklendi:
  - tek secimli hedef kartlari
  - tek secimli tempo tercihi
  - muzik / film / kitap icin coklu secim chip alanlari
  - eksik survey doldurulursa kullaniciya aninda validation gosteriliyor
- Bunun icin:
  - `client/src/pages/RegisterPage.jsx` buyutuldu
  - `client/src/lib/recommendationSurvey.js` adinda ortak survey secenek dosyasi eklendi
  - `client/src/locales/tr.js` ve `client/src/locales/en.js` icine yeni survey / profil metinleri eklendi
- Profil ekranina da kullanicinin secili tercih profilini gosteren yeni panel eklendi:
  - `client/src/pages/ProfilePage.jsx`
- Sonuc ekraninda film posterlerini sabitledim:
  - film kartlari artik sabit genislikte
  - poster alanlari sabit yukseklikte
  - buyuk / kucuk afis farki artik layout'u bozmuyor
  - `client/src/pages/ResultPage.jsx` guncellendi
- Test ve dogrulama yaptim:
  - `dotnet build`
  - `npm run build`
  - `npm test -- --run`
  - Docker stack guncel kodla yeniden build edilip ayaga kaldirildi

## Ozet

Kayit akisina zorunlu bir tercih anketi ekledim ve bu veriyi onerileri kisilestirmek icin backend recommendation context'ine bagladim. Ayrica sonuc ekranindaki film afislerini sabit kart olcusune alarak goruntu bozulmalarini temizledim. Build, test ve Docker deploy temiz gecti.

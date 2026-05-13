## Benim promptum

tamam bu eksikleri düzelt ve bu promptu formata uygun kaydet

## Senin yaptiklarin

- Misafir analiz gecmisi politikasini duzelttim:
  - misafir analizleri artik `emotion_history` tablosuna kalici olarak yazilmiyor
  - misafir sonuc sayfasi icin kisa sureli bellek tabanli `GuestAnalysisStore` eklendi
  - misafir sonuc ve feedback verileri gecici tutuluyor, hesap gecmisine karismiyor
- Misafir kota/cooldown bypass riskini azalttim:
  - `guestSessionId` tek basina kota anahtari olmaktan cikarildi
  - sunucu tarafinda IP, user-agent ve dil sinyalinden hashlenen `GuestIdentityService` eklendi
  - misafir 3 hak ve contradiction cooldown bu server-side actor key ile takip ediliyor
- Gemini key dongusunu deterministik hale getirdim:
  - AI servis artik metin/contradiction analizinde sadece API Gateway'in sectigi key env'ini kullaniyor
  - arka planda otomatik diger Gemini keylerine atlama davranisi kaldirildi
  - 3. denemede kota veya hata gelirse backend 1 dakikalik cooldown'u baslatiyor
- Misafir sonuc erisimi ve feedback akislarini yeni gecici store'a bagladim:
  - `RecommendationsController` misafir sonucu DB yerine `GuestAnalysisStore` uzerinden getiriyor
  - `FeedbackController` misafir feedback'ini DB yerine gecici store'a yaziyor
- Eski/yarim kalmis guest merge servisini kaldirdim:
  - `GuestDataMergeService` silindi
  - servis kaydi `Program.cs` icinden kaldirildi
- Migration drift riskini azalttim:
  - uygulama acilisinda survey kolonlari icin idempotent schema repair eklendi
  - eski Docker volume veya eksik migration durumunda kayit akisinin survey kolonlari yuzunden kirilmasi engellendi
- Kayit anketini iyilestirdim:
  - hedef ve enerji seceneklerine aciklayici metinler eklendi
  - Turkce karakterler ve daha kaliteli soru metinleri duzeltildi
  - survey paneli daha okunur, daha yonlendirici ve iki dakikalik profil akisi gibi tasarlandi
- README guncellendi:
  - misafir analizlerinin kalici gecmis olarak tutulmadigi ve kotanin server-side fingerprint ile izlendiği belirtildi
- Dogrulama yaptim:
  - `dotnet build`
  - `npm test -- --run`
  - `npm run build`
  - `python -m compileall .`

## Ozet

Eksik listesindeki en kritik backend aciklarini kapattim: misafir verisi artik kalici DB gecmisi olarak tutulmuyor, misafir kota/cooldown sadece localStorage'a bagli degil, Gemini key sirasi gateway tarafindan net kontrol ediliyor ve eski DB schema drift kayit akisini bozamayacak sekilde onariliyor. Frontend tarafinda da kayit anketi daha kaliteli ve daha anlasilir hale getirildi. Tum build/test kontrolleri temiz gecti.

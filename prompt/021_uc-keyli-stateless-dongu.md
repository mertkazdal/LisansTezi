## Benim promptum
Kullanici, 1 dakikalik cooldown sonrasinda analiz anahtarlarinin yeniden 1. anahtardan baslayacak sekilde sonsuz dongu mantigina alinmasini istedi. Ayrica eger herhangi bir analiz turu zit-duygu durumuna dusmeden temiz sekilde tamamlaniyorsa sonraki istegin de otomatik olarak yeniden 1. anahtardan baslamasini talep etti.

Ek olarak, onceki turda sekillendirilen uyari deneyiminin korunmasi istendi.

## Senin yaptiklarin
- `ai-service/services/gemini_service.py` icindeki analiz zinciri yeniden stateless hale getirildi.
- Her yeni analiz istegi artik otomatik olarak su sirayla basliyor:
  - `GEMINI_API_KEY`
  - `GEMINI_RECHECK_API_KEY`
  - `GEMINI_TERTIARY_API_KEY`
- Zitlik veya dogrulama sorunu olmazsa akisin o istekte bittiği yerde sonraki istek yine otomatik olarak 1. anahtardan basliyor; ek bir durum hafizasi tutulmuyor.
- Zitlik uc analiz anahtarinda da cozulmezse 60 saniyelik cooldown devam ediyor.
- Bu duzen sayesinde cooldown bittiginde de yeni deneme yeniden 1. anahtardan baslayarak sonsuz 1 -> 2 -> 3 -> cooldown -> 1 dongusu saglaniyor.
- `.env`, `.env.example`, `ai-service/.env.example` ve `docker-compose.yml` tekrar uc analiz anahtarli yapıya alindi.
- `dotnet build`, `npm run build`, `docker compose up -d --build`, `http://127.0.0.1:3000/analyze` icin `200` ve `api-gateway /health` kontrolu ile yayin dogrulandi.

## Ozet
Sistem artik her yeni analiz isteginde sifirdan 1. anahtarla baslayan stateless bir anahtar dongusu kullaniyor. Zitlik varsa 2. ve 3. anahtarlar sirayla devreye giriyor; yine cozulmezse cooldown geliyor. Cooldown bittiginde veya bir istek temiz sekilde tamamlandiginda sistem dogal olarak tekrar 1. anahtara donmus oluyor.

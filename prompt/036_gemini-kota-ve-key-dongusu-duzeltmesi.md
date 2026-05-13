## Benim promptum

Failed to load resource: the server responded with a status of 409 (Conflict)
localhost:5000/api/auth/login:1
Failed to load resource: the server responded with a status of 401 (Unauthorized)
localhost:5000/api/analyze:1
Failed to load resource: the server responded with a status of 429 (Too Many Requests)

gemini kullanim kotasi doldu diyor neden bunu duzelt az once sana degistir dedim ve bozdun bunu duzeltmeni istiyorum api keyler cok guzel verildi sana kotanin dolmasinin imkani yok bir yerde bir keye birden fazla istek gidiyor kesin bunu tespit et ve duzelt

## Senin yaptiklarin

- `ai-service/services/gemini_service.py` dosyasini detayli tarayip Gemini key dongusunu ve follow-up akislarini inceledim.
- `ai-service` loglarini kontrol ederek kok nedeni tespit ettim:
  - basarili bir analizden sonra follow-up tarafinda ayni Gemini keyine iki ayri istek gidiyordu
  - bunlardan biri `coach comment`, digeri `life advice` uretimi icindi
  - ayrica text/multimodal analiz tarafinda bir key kota hatasi alirsa diger analiz keylerine gecmeden dogrudan `429` donulebiliyordu
- Bu sorunu gidermek icin `generate_followup_bundle(...)` adinda yeni bir ortak follow-up fonksiyonu ekledim.
  - artik koch yorumu ve hayat tavsiyeleri tek Gemini cagrisinda birlikte uretiliyor
  - boylece follow-up tarafindaki gereksiz cift istek kesildi
- Analiz anahtari failover mantigini da duzelttim:
  - `_get_text_analysis_key_envs(...)` ile analizde kullanilabilecek tum Gemini key sirasi tekrar kuruldu
  - `_analyze_text_with_analysis_keys(...)` icinde `AI_QUOTA_EXCEEDED` durumunda siradaki analiz keyine otomatik gecis ekledim
  - `analyze_emotion(...)` artik text analizini tek keye bagli calistirmiyor, kota durumunda diger analiz keylerini deniyor
- `ai-service/main.py` icinde recommendations akisini yeni bundle mantigina tasidim:
  - ayri `coach comment` ve `life advice` cagrilari kaldirildi
  - tek `followup_task` ile hem yorum hem tavsiye alinir hale geldi
- Canli dogrulama yaptim:
  - Docker stacki guncel kodla yeniden build ettim
  - `http://127.0.0.1:5000/api/analyze` uzerine yeni guest id ile text-only analiz attim
  - analiz `200 OK` ile dondu ve tavsiyelerle birlikte sonuc uretti

## Ozet

Sorun gercekti: bir Gemini keyine follow-up asamasinda gereksiz iki istek gidiyordu, ustune analiz tarafi kota hatasinda diger analiz keylerine gecmiyordu. Bu ikisini birlikte duzelttim; artik yorum+tavsiye tek Gemini cagrisinda aliniyor ve analiz keyi kota dolarsa sistem siradaki analiz keyine otomatik geciyor. Canli testte `/api/analyze` yeniden `200 OK` dondu.

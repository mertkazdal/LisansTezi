## Benim promptum

```text
şimdi kral test yap bana siteyi açmanı istiyorum ardından sen 5 absürt en uç olasılık ile siteyi test et
```

## Senin yaptiklarin

- Docker stack'i tekrar ayağa kaldırdım ve frontend'in `http://127.0.0.1:3000` üzerinde `200` döndüğünü doğruladım.
- Siteyi tarayıcıda açtım.
- Canlı API üzerinde 5 tane uç/absürt kenar durum testi koştum:
  1. `Boş istek`
  2. `Desteklenmeyen image mime type`
  3. `Bozuk selfie + metin fallback`
  4. `Prompt injection / dev metin / script benzeri içerik`
  5. `Misafir kotasını brute-force bitirme`
- Testlerde durum kodlarını ve gerçek dönen cevapları topladım.
- `500` veren senaryo için `api-gateway` ve `ai-service` loglarını inceledim.
- Loglardan, dev/prompt-injection içerikli metinde Gemini'nin aday döndürmemesi yüzünden `response.text` erişiminde `ValueError` fırladığını tespit ettim.
- Kota testini ayrıca yeni ve temiz bir `guestSessionId` ile tekrar koştum; ilk 3 analiz `200`, 4. analiz `403 GUEST_QUOTA_EXCEEDED` olarak doğrulandı.

## Ozet

Site açıldı ve canlı ortamda 5 uç senaryo ile test edildi. 4 senaryo beklenen şekilde güvenli davrandı; kritik tek hata, çok uzun ve prompt-injection benzeri metinde Gemini'nin cevabı blokladığı durumda backend'in bunu kontrollü ele almak yerine `500 Internal Server Error` vermesi oldu.

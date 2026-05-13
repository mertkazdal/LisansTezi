## Sana verecegim prompt

Projeyi kaldigimiz yerden devam ettirelim. Once repoyu calistirilabilirlik ve dokumantasyon tutarliligi acisindan kontrol et: `.env` kurulumu, Docker ayaklandirma, frontend build/test, AI service syntax/import kontrolu, API gateway build durumu ve README/docs guncelligini incele. Eski kalan path, demo mode, guvenlik varsayilani, model adi veya kod-dokuman celiskisi varsa not et. Sonra en dusuk riskli duzeltmeleri uygula ve yaptigin her isi prompt kayit formatina uygun sekilde kaydet.

## Amac

Projeyi yeni makinede veya temiz checkout sonrasinda guvenilir gelistirme noktasina getirmek.

## Kapsam

- Kok `.env.example`, `README.md`, `docker-compose.yml`, `start.ps1`
- `api-gateway` build ve migration akisi
- `ai-service` local face model, Gemini, provider fallback ve syntax kontrolu
- `client` test/build, i18n, PWA ve result/analyze akislari
- `docs` ve `prompt` klasorlerindeki durum notlari

## Kabul kriterleri

- Calistirilabilirlik icin eksik kurulum adimlari netlesmis olmali.
- Dokumanlarda eski yerel path veya son kodla celisen kritik bilgi kalmamali.
- Test/build kosulamayan adimlar nedenleriyle raporlanmali.
- Uygulanan duzeltmeler kucuk, geri alinabilir ve proje mimarisine uyumlu olmali.

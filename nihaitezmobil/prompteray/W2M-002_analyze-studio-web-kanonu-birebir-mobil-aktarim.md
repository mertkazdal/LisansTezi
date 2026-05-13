## Sana verecegim prompt

W2M-002 - Analyze Studio Web Kanonu Birebir Mobil Aktarim

`C:\Users\erayu\Desktop\nihaitez\nihaitezmobil` Flutter projesinde W2M-001 ile navigation, auth redirect, global shell ve Home temel paritesi kuruldu. Simdi hedef, `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\AnalyzePage.jsx` web analiz stüdyosunu mobil uygulamaya birebir urun karsiligi olarak tasimaktir.

Bu promptta UI gorseliyle yetinme. Web AnalyzePage nasil dusunuyorsa mobil de ayni urun aklini tasiyacak:

- text-only
- image-only
- text + image multimodal
- guest quota locked state
- example text
- mode cards
- context strength
- visual consent
- readiness checklist
- camera/gallery preview
- sticky action bar
- loading overlay steps
- follow-up state
- result navigation
- backend payload paritesi

## Mutlak Ilke

Web `AnalyzePage.jsx` kanondur. Mobilde onceki sade analiz ekrani korunmayacak; eksik veya gevsek kalan kisimlar web urun mantigina gore yeniden kurulacak.

"Benzeri var" kabul degildir. Webdeki her ana davranisin mobil ergonomisine uygun karsiligi olacak.

## Referans Web Dosyalari

Once oku:

- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\pages\AnalyzePage.jsx`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\services\api.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\store\authStore.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\lib\guestSession.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\tr.js`
- `C:\Users\erayu\Desktop\nihaitez\nihaitezweb\client\src\locales\en.js`

Mobilde calisilacak dosyalar:

- `lib/features/analyze/presentation/analyze_screen.dart`
- `lib/features/analyze/presentation/providers/analyze_provider.dart`
- `lib/features/analyze/data/image_input_service.dart`
- `lib/features/analyze/data/analyze_repository.dart`
- `lib/features/analyze/data/analyze_remote_source.dart`
- `lib/features/analyze/domain/analysis_models.dart`
- `lib/core/router/app_router.dart`
- `lib/core/i18n/tr.dart`
- `lib/core/i18n/en.dart`
- `docs/web_to_mobile_parity_plan.md`

## Kapsam 1 - Analyze Parite Matrisi

`docs/web_to_mobile_parity_plan.md` dosyasina W2M-002 bolumu ekle.

Tablo alanlari:

- Analyze hero
- GuestQuotaPanel
- ComposerPanel
- Example text
- ModeCards
- SelfiePanel
- Camera/gallery
- ConsentCard
- ChecklistPanel
- ErrorPanel
- ActionBar
- LoadingOverlay
- Follow-up
- Result navigation
- Payload parity

Her satirda:

- Web kanonu
- Mobil mevcut
- Yapilan duzeltme
- Sonraki prompta kalan

## Kapsam 2 - Analyze Hero

Webdeki `HeroPanel` mobile tasinacak:

- Eyebrow
- Title
- Description
- Mode meta ozeti
- Text/image/multimodal aktif moda gore degisen bilgi

Mobilde hero cok buyuk olmayacak ama webdeki bilgi hiyerarsisi eksilmeyecek.

## Kapsam 3 - GuestQuotaPanel

Web kanonu:

- Logged in ise account mode open
- Guest ise remaining / limit
- Guest locked ise login CTA
- Progress bar
- Quota usable copy

Mobilde:

- Auth kullanicida history save copy
- Guest kullanicida kalan hak
- Quota 0 ise analiz butonu yerine login/register CTA
- Progress bar
- `guestRemainingAnalyses` provider/storage ile anlik guncellenecek

## Kapsam 4 - ComposerPanel

Web kanonu:

- Multiline text
- Example text button
- Character/context progress
- Context strength label

Mobilde:

- Text input multiline
- Webdeki example texts TR/EN i18n'e alinacak
- Rastgele example fill butonu olacak
- Context strength:
  - Bos
  - Kisa
  - Orta
  - Guclu
- Progress bar text length uzerinden calisacak

## Kapsam 5 - ModeCards

Web `getAnalysisMode`:

- text
- image
- multimodal
- empty

Mobilde:

- Aktif mode kartlari veya segmented cards olacak
- Text-only / Image-only / Multimodal aciklamalari web copy niyetinde olacak
- Aktif mod gorsel olarak belirgin olacak
- Mode'a gore loading steps degisecek

## Kapsam 6 - Selfie/Image Panel

Web SelfiePanel:

- Drag/drop
- File select
- Preview
- Remove
- Start camera
- Capture
- Stop camera
- Scan overlay

Mobil karsiligi:

- Gallery action
- Camera action
- Selected image preview
- Remove image
- MIME/type/size hata mesaji
- Permission denied crash uretmeyecek
- Preview alaninda scanner/corner frame hissi olacak
- In-app camera preview paket ve risk gerektiriyorsa bu promptta minimum camera action ile kalabilir ama parite planinda not edilecek

## Kapsam 7 - Visual Consent Hard Gate

Webde image varsa consent gerekir.

Mobilde:

- Image secildiginde consent card acilacak
- Consent verilmeden analyze CTA disabled olacak
- Consent state image remove ile resetlenecek
- Consent copy TR/EN i18n'de olacak

## Kapsam 8 - Readiness Checklist

Web ChecklistPanel maddeleri:

- Text/context
- Visual consent
- Account/guest quota

Mobilde:

- Checklist karti olacak
- Her madde done/pending icon ile gorunecek
- Guest locked, missing text/image, missing consent gibi durumlari aciklayacak
- Readiness message action bar'da gorunecek

## Kapsam 9 - ErrorPanel

Web ErrorPanel:

- Guest locked ise login CTA
- Backend/input hatasi ise net hata paneli

Mobilde:

- Inline error panel
- Quota hatasinda login/register CTA
- Network/backend hatasinda teknik stack yok
- ApiException localized mesajlari kullanilacak

## Kapsam 10 - Sticky ActionBar

Web ActionBar sticky bottom mantiginda.

Mobilde:

- Klavye acilinca kaybolmayacak ergonomik action area
- canSubmit false ise disabled
- guestLocked ise login CTA
- isAnalyzing ise loading/disabled
- readiness message gorunecek

## Kapsam 11 - LoadingOverlay

Web LoadingOverlay:

- Title
- Description
- Mode'a gore steps
- Scan overlay / premium motion

Mobilde:

- Full or near-full overlay
- Mode'a gore steps:
  - text
  - image
  - multimodal
- AnimatedLoading, shimmer/pulse veya mevcut motion widgetlari
- Form kilitlenmeli

## Kapsam 12 - Follow-up

Mobilde mevcut follow-up korunacak ama web urun diliyle iyilestirilecek:

- `needsReason`
- `followUpQuestion`
- user answer
- same endpoint payload
- loading/error state
- result replacement/navigation

## Kapsam 13 - Backend Payload Paritesi

Analyze payload web ile ayni kalacak:

- `text`
- `imageBase64`
- `mimeType`
- `guestSessionId`

Kurallar:

- Empty alanlar temizlenecek
- Image-only desteklenecek
- Text-only desteklenecek
- Multimodal desteklenecek
- guestRemainingAnalyses local storage'a yazilacak
- GUEST_QUOTA_EXCEEDED quota state'i 0 yapacak

## Kapsam 14 - i18n

TR/EN yeni keyler:

- analyze hero
- mode cards
- example texts
- context strength
- consent hard gate
- readiness checklist
- action bar states
- loading overlay steps
- image panel scanner copy
- camera/gallery error copy
- quota locked copy

Hardcoded user-facing copy kalmayacak.

## Kapsam 15 - Dogrulama

Calistir:

- `flutter pub get`
- `flutter analyze`
- i18n key kontrolu
- mojibake taramasi

Opsiyonel:

- `flutter run -d emulator-5554 --no-resident`

## Kapsam 16 - Prompt Kaydi

Is tamamlaninca:

- `prompteray/W2M-002_tamamlandi_analyze-studio-web-kanonu-birebir-mobil-aktarim.md`

Sonraki promptu kaydet:

- `prompteray/W2M-003_result-page-web-kanonu-recommendation-explorer-feedback-share-paritesi.md`

W2M-003 odagi:

- ResultHero
- InsightPanel
- RecommendationExplorer tabs
- Media cards with images
- FeedbackPanel page parity
- NextStepCtas
- Result share/download parity
- Saved count for result

## Kabul Kriterleri

1. Analyze hero web bilgi hiyerarsisini tasir.
2. Guest quota panel auth/guest/locked durumlarini ayirir.
3. Example text fill calisir.
4. Context strength gorunur.
5. Mode cards aktif modu gosterir.
6. Gallery/camera actions calisir veya izin hatasini crash olmadan gosterir.
7. Image varsa consent hard gate calisir.
8. Readiness checklist gorunur.
9. Sticky action bar canSubmit/readiness/locked durumlarini gosterir.
10. Loading overlay mode-specific steps ile calisir.
11. Follow-up akisi korunur ve UI'da netlesir.
12. Analyze payload web kontratiyla aynidir.
13. guestRemainingAnalyses local state'e yazilir.
14. Tum yeni copy TR/EN i18n'dedir.
15. `flutter analyze` temizdir.
16. i18n key kontrolu temizdir.
17. mojibake taramasi temizdir.
18. W2M-002 tamamlandi kaydi yazilir.
19. W2M-003 master promptu kaydedilir.

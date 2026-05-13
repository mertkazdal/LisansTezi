## Benim promptum

kamerayı açtım ama ekrana gelmiyor bunu düzelt ve promptu formata uygun kaydet

## Senin yaptiklarin

- `client/src/pages/AnalyzePage.jsx` dosyasinda kamera preview akisini detayli inceledim.
- Sorunun kok nedenini tespit ettim:
  - `getUserMedia` ile stream aliniyordu
  - ama `video` elementi daha sonra render oldugu icin `videoRef.current` ilk anda bos kalabiliyordu
  - bu nedenle `srcObject` her zaman video elementine baglanmiyor, kamera acilsa bile ekranda onizleme gorunmuyordu
- Bu akisi duzeltmek icin:
  - `cameraStreamRef` adinda ayri bir stream ref ekledim
  - `startCamera()` icinde stream'i bu ref'e yazip sonra `showCamera` durumunu actim
  - `showCamera` degistiginde calisan bir `useEffect` ekleyerek video elementi ekrana geldiginde `srcObject` baglamasini ve `play()` cagrilmasini sagladim
  - yeni kamera baslatilirken eski stream temizligini garanti altina aldim
  - `resetImage`, `stopCamera` ve component unmount akisini da ayni ref mantigiyla senkronize ettim
- `stopCameraStream(...)` yardimcisini guncelleyip hem `videoRef` hem de `cameraStreamRef` tarafini guvenli sekilde temizler hale getirdim.
- Dogrulama icin su adimlari calistirdim:
  - `npm run build`
  - `docker compose up -d --build client`

## Ozet

Kamera preview sorunu stream'in video elementine gec baglanmasindan kaynaklaniyordu; bunu stream ref + mount sonrasi baglama mantigiyla duzelttim. Guncel client Docker icinde yeniden build edildi ve kamera acildiginda preview'nin ekrana gelmesi gereken son hal canliya yuklendi.

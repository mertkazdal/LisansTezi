## Benim promptum

şimdi promptları oku projeyi kavra kaydetmişim orada prompt klasöründe kaldığımız yeri tespit et
şu altı görüyor musun bilmiyorum da bunu düzeltmeni istiyorum

Build a Turkish AI Life Coach landing page (frontend only, HTML/CSS/JS or React).

## Design Reference
Dark crimson/burgundy theme with deep red backgrounds (#1a0505 to #3d0a0a range),
bold white display typography, red accent color (#e8002d), and a split-layout hero section.

## Layout Structure

### LEFT SIDE — Hero Copy
- Small pill badge top-left: "YAPAY ZEKA DESTEKLİ YAŞAM KOÇU"
- Giant 3-line headline (bold white): "Nasıl hissettiğini söyle."
- Giant red accent line: "Ne yapacağını netleştir."
- Subtitle paragraph (gray/muted): selfie + text input explanation
- Two CTA buttons: "Analizi Başlat" (filled red) + "Hesap oluştur" (dark outline)
- Bottom feature tags: "MİSAFİR HAKKI", "ÜCRETSİZ", "ÖNERİ"

### RIGHT SIDE — Live Demo Card
Glassmorphism card with:
- Top label "CANLI AKIŞ" + title "Tek hamle, net sonuç" + red "AI" badge
- Floating orbit visualization: a large pulsing red circle labeled "Karışık / DUYGU SİNYALİ"
  with 3 orbiting pills: "Selfie", "Metin", "Koç" — animate them floating
- 3-step flow row: [1 Aç / Stüdyoya gir.] → [2 Paylaş / Selfie, metin ya da ikisi.] → [3 Al / Ruh hali ve öneriler.]
- Emotion result cards below:
  - "Yorgun" → "Düşük enerji"
  - "Mutlu" → "Güzel haber"
  - "Karışık" → "Kafa dolu"
- "ÖRNEK SONUÇ" section with example AI output text + bold red "ÖNERİLEN" recommendation

## Design Quality Requirements
- Use a dramatic editorial font (e.g. Clash Display, Plus Jakarta Sans Bold, or similar)
- Deep layered backgrounds with radial red glows and subtle grain texture
- Smooth CSS animations: orbit rotation, pulse glow on the center circle, card hover lifts
- Glassmorphism for the right panel (backdrop-filter blur, semi-transparent borders)
- Pixel-perfect spacing, not generic Bootstrap layout
- Fully responsive (mobile: stack left/right vertically)
- NO placeholder lorem ipsum — use the exact Turkish copy above

bu promptu işin bitince formata uygun kaydet

Ek referans: kullanıcının eklediği koyu bordo landing page ekran görüntüsü.

## Senin yaptıkların

- Prompt klasöründeki son kayıtlar okundu; kaldığımız yerin `051_yasam-kocu-claude-spec-ve-landing.md` olduğu ve Yaşam Koçu landing dönüşümünün başlamış olduğu tespit edildi.
- Ana sayfada landing hero'nun alt kısmını kesen/sıkıştıran desktop `100svh + navbar` davranışı düzeltildi.
- Ana sayfa için navbar ve mobil alt navigasyon görsel olarak gizlendi; hero tek başına referans görseldeki gibi ilk ekrana oturtuldu.
- Global `h1` line-height kuralının Yaşam Koçu hero başlığını fazla büyütmesi engellendi.
- Bordo palet `#1a0505`, `#3d0a0a`, `#e8002d` çizgisine yaklaştırıldı; arka plana daha belirgin kırmızı glow ve ince grain dokusu eklendi.
- Sağ canlı demo kartında orbit halkası ve güvenli sınırlar içinde kalan yüzen "Selfie", "Metin", "Koç" etiketleri düzenlendi.
- Açılış örneği referansa uygun şekilde "Karışık / Kafa dolu" olacak biçimde ayarlandı.
- Kart hover lift efektleri, cam panel geçişleri ve kısa ekran yüksekliği için kompakt ölçüler iyileştirildi.
- Vite build, unit testler, UI testler ve Playwright tabanlı 1900x820 görsel kontrol yapıldı.

## Özet

Ana sayfa artık referans görseldeki koyu bordo split landing yapısına daha yakın; alt feature kartları kesilmiyor, sağ demo kartı "Karışık / Kafa dolu" ile açılıyor ve orbit etiketleri panel içinde görünür kalıyor.

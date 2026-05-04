const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

export async function downloadResultSummaryCard(result, emotionMeta, labels = {}, language = "tr") {
  if (typeof document === "undefined") {
    throw new Error("Tarayıcı ortamı gerekli.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas hazırlanamadı.");
  }

  drawCard(ctx, result, emotionMeta, labels, language);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) {
        resolve(nextBlob);
      } else {
        reject(new Error("Özet kartı oluşturulamadı."));
      }
    }, "image/png", 0.95);
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "yasam-kocu-analiz-ozeti.png";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function drawCard(ctx, result, emotionMeta, labels = {}, language = "tr") {
  const accent = emotionMeta?.accentColor || "#38bdf8";
  const title = emotionMeta?.label || (language === "en" ? "Emotion analysis" : "Duygu analizi");
  const modeLabel = getModeLabel(result?.modalityUsed, language);
  const coachText =
    emotionMeta?.coachPrompt ||
    emotionMeta?.resultTone ||
    (language === "en"
      ? "Choose one small, practical step that fits today’s emotional rhythm."
      : "Bugünkü duygu ritmine uygun küçük ve uygulanabilir bir adım seçebilirsin.");

  const background = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  background.addColorStop(0, "#020617");
  background.addColorStop(0.42, "#0f172a");
  background.addColorStop(1, "#111827");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  drawOrb(ctx, 130, 110, 420, hexToRgba(accent, 0.26));
  drawOrb(ctx, 960, 210, 360, "rgba(56, 189, 248, 0.18)");
  drawOrb(ctx, 520, 1260, 520, hexToRgba(accent, 0.16));
  drawGrid(ctx);

  roundRect(ctx, 80, 90, 920, 1170, 56);
  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = hexToRgba(accent, 0.16);
  roundRect(ctx, 130, 145, 410, 58, 29);
  ctx.fill();
  ctx.fillStyle = "#ccfbf1";
  ctx.font = "700 23px Segoe UI, Arial, sans-serif";
  ctx.fillText(String(labels.eyebrow || "AI DESTEKLI DUYGU ANALIZI").toUpperCase(), 158, 183);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 54px Segoe UI, Arial, sans-serif";
  wrapText(ctx, labels.productName || "Yapay Zeka Destekli Yaşam Koçu", 130, 290, 790, 64);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 28px Segoe UI, Arial, sans-serif";
  ctx.fillText(new Date().toLocaleDateString(language === "en" ? "en-US" : "tr-TR"), 130, 396);

  drawEmotionBadge(ctx, accent, title, modeLabel, labels, language);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 34px Segoe UI, Arial, sans-serif";
  wrapText(ctx, coachText, 130, 820, 800, 50, 4);

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  roundRect(ctx, 130, 1050, 820, 118, 34);
  ctx.fill();
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "600 25px Segoe UI, Arial, sans-serif";
  wrapText(
    ctx,
    labels.note || (language === "en" ? "This card shares only the emotion result and short coach note." : "Bu kart yalnızca duygu sonucunu ve kısa koç notunu paylaşır."),
    165,
    1102,
    745,
    36,
    2,
  );

  ctx.fillStyle = "#64748b";
  ctx.font = "700 24px Segoe UI, Arial, sans-serif";
  ctx.fillText(labels.footer || "yasam kocu · premium analiz özeti", 130, 1212);
}

function drawEmotionBadge(ctx, accent, title, modeLabel, labels = {}, language = "tr") {
  const x = 130;
  const y = 470;
  const width = 820;
  const height = 270;

  roundRect(ctx, x, y, width, height, 44);
  ctx.fillStyle = hexToRgba(accent, 0.15);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(accent, 0.45);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#94a3b8";
  ctx.font = "800 25px Segoe UI, Arial, sans-serif";
  ctx.fillText(labels.detectedEmotion || (language === "en" ? "Detected emotion" : "Tespit edilen duygu"), x + 52, y + 72);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 88px Segoe UI, Arial, sans-serif";
  ctx.fillText(title, x + 52, y + 170);

  ctx.fillStyle = hexToRgba(accent, 0.18);
  roundRect(ctx, x + width - 250, y + 72, 174, 124, 34);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(accent, 0.42);
  ctx.lineWidth = 2;
  roundRect(ctx, x + width - 250, y + 72, 174, 124, 34);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "700 18px Segoe UI, Arial, sans-serif";
  ctx.fillText(language === "en" ? "Analysis mode" : "Analiz modu", x + width - 163, y + 116);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 24px Segoe UI, Arial, sans-serif";
  wrapText(ctx, modeLabel, x + width - 222, y + 156, 118, 28, 2);
  ctx.textAlign = "left";
}

function drawOrb(ctx, x, y, radius, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawGrid(ctx) {
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= CARD_WIDTH; x += 54) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CARD_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= CARD_HEIGHT; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CARD_WIDTH, y);
    ctx.stroke();
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  let wordIndex = 0;

  for (; wordIndex < words.length; wordIndex += 1) {
    const word = words[wordIndex];
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) {
        break;
      }
    } else {
      line = testLine;
    }
  }

  if (line && lines.length < maxLines) {
    lines.push(line);
  }

  const truncated = wordIndex < words.length - 1 || lines.length > maxLines;
  const visibleLines = lines.slice(0, maxLines);

  if (truncated && visibleLines.length) {
    let lastLine = `${visibleLines[visibleLines.length - 1]}...`;
    while (ctx.measureText(lastLine).width > maxWidth && lastLine.length > 4) {
      lastLine = `${lastLine.slice(0, -4)}...`;
    }
    visibleLines[visibleLines.length - 1] = lastLine;
  }

  visibleLines.forEach((visibleLine, index) => {
    ctx.fillText(visibleLine, x, y + index * lineHeight);
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function hexToRgba(hex, alpha) {
  const normalized = String(hex || "#38bdf8").replace("#", "");
  const bigint = Number.parseInt(normalized.length === 3 ? normalized.split("").map((char) => char + char).join("") : normalized, 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getModeLabel(mode, language) {
  if (language === "en") {
    if (mode === "multimodal") {
      return "Selfie + text";
    }

    if (mode === "image") {
      return "Selfie only";
    }

    return "Text only";
  }

  if (mode === "multimodal") {
    return "Selfie + metin";
  }

  if (mode === "image") {
    return "Sadece selfie";
  }

  return "Sadece metin";
}

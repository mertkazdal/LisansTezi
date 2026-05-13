import { useState } from "react";
import { useTranslation } from "react-i18next";
import HeroSection from "../components/HeroSection";
import { guestSessionAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { isLoggedIn, user } = useAuthStore();
  const remaining = guestSessionAPI.getGuestRemainingAnalyses();
  const guestLimit = guestSessionAPI.getDefaultGuestLimit();
  const copy = getHomeExperienceCopy(i18n.language);
  const [activeExample, setActiveExample] = useState(2);
  const secondaryCta = user?.isAdmin
    ? { to: "/metrics", label: t("actions.viewMetrics") }
    : isLoggedIn
      ? { to: "/profile", label: t("navigation.profile") }
      : { to: "/register", label: t("actions.createAccount") };

  const metrics = [
    {
      label: isLoggedIn ? copy.accountLabel : t("home.guestQuota"),
      value: isLoggedIn ? t("common.unlimited") : remaining,
    },
    {
      label: copy.freeLabel,
      value: t("common.countAnalyses", { count: guestLimit }),
    },
    {
      label: copy.recommendationLabel,
      value: copy.recommendationValue,
    },
  ];

  return (
    <div className="page-shell yc-home">
      <HeroSection
        copy={copy}
        primaryCta={t("actions.startAnalysis")}
        secondaryCta={secondaryCta}
        metrics={metrics}
        activeExample={activeExample}
        setActiveExample={setActiveExample}
      />
    </div>
  );
}

function getHomeExperienceCopy(language) {
  if (String(language || "tr").startsWith("en")) {
    return {
      eyebrow: "AI powered life coach",
      title: "Say how you feel.",
      titleAccent: "Leave with a clear next move.",
      subtitle: "Add a selfie, a short note, or both. Yaşam Koçu reads the emotional signal, warns you if inputs clash, and turns the result into music, film, book, and daily suggestions.",
      accountLabel: "Account",
      freeLabel: "Free",
      recommendationLabel: "Picks",
      recommendationValue: "4 areas",
      sideEyebrow: "Live flow",
      sideTitle: "One action, clear result",
      radarLabel: "Emotion signal",
      orbitLabels: ["Selfie", "Coach", "Text"],
      steps: [
        { title: "Open", description: "Enter the studio." },
        { title: "Share", description: "Selfie, text, or both." },
        { title: "Receive", description: "Mood and recommendations." },
      ],
      examplesEyebrow: "Example result",
      examples: [
        { mood: "Tired", title: "Low energy", text: "The user wants something gentle after a long day.", resultLabel: "Recommended", result: "Soft music, an easy movie, a light book, and a short reset activity." },
        { mood: "Happy", title: "Good news", text: "The user wants to keep the good energy alive.", resultLabel: "Recommended", result: "Upbeat songs, a warm film, and small actions that use the momentum well." },
        { mood: "Mixed", title: "Full mind", text: "The user needs clarity without reading a long lecture.", resultLabel: "Recommended", result: "A grounding step, a focused playlist, and a simple next-hour plan." },
      ],
    };
  }

  return {
    eyebrow: "Yapay zeka destekli yaşam koçu",
    title: "Nasıl hissettiğini söyle.",
    titleAccent: "Ne yapacağını netleştir.",
    subtitle: "Selfie, kısa bir metin ya da ikisini birlikte ekle. Yaşam Koçu duygu sinyalini okur, çelişki varsa uyarır ve sonucu müzik, film, kitap ve günlük önerilere dönüştürür.",
    accountLabel: "Hesap",
    freeLabel: "Ücretsiz",
    recommendationLabel: "Öneri",
    recommendationValue: "4 alan",
    sideEyebrow: "Canlı akış",
    sideTitle: "Tek hamle, net sonuç",
    radarLabel: "Duygu sinyali",
    orbitLabels: ["Selfie", "Koç", "Metin"],
    steps: [
      { title: "Aç", description: "Stüdyoya gir." },
      { title: "Paylaş", description: "Selfie, metin ya da ikisi." },
      { title: "Al", description: "Ruh hali ve öneriler." },
    ],
    examplesEyebrow: "Örnek Sonuç",
    examples: [
      { mood: "Yorgun", title: "Düşük enerji", text: "Kullanıcı uzun bir günün ardından hafif ve net bir yön ister.", resultLabel: "Önerilen", result: "Sakin müzik, yormayan bir film, hafif bir kitap ve kısa toparlanma aktivitesi." },
      { mood: "Mutlu", title: "Güzel haber", text: "Kullanıcı iyi enerjisini korumak ve büyütmek ister.", resultLabel: "Önerilen", result: "Neşeli parçalar, sıcak bir film ve bu enerjiyi iyi kullanacak küçük adımlar." },
      { mood: "Karışık", title: "Kafa dolu", text: "Kullanıcı uzun bir metin okumadan hızlıca netleşmek ister.", resultLabel: "Önerilen", result: "Toparlanma adımı, odak playlist'i ve sonraki saat için sade bir plan." },
    ],
  };
}

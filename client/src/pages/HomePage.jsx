import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getEmotionOptions } from "../lib/emotions";
import { guestSessionAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { isLoggedIn, user } = useAuthStore();
  const remaining = guestSessionAPI.getGuestRemainingAnalyses();
  const emotionOptions = getEmotionOptions(i18n.language);
  const guestLimit = guestSessionAPI.getDefaultGuestLimit();
  const guestProgress = isLoggedIn ? 100 : Math.max(0, Math.min(100, (remaining / guestLimit) * 100));
  const experienceCopy = getHomeExperienceCopy(i18n.language, guestLimit);
  const secondaryCta = user?.isAdmin
    ? { to: "/metrics", label: t("actions.viewMetrics") }
    : isLoggedIn
      ? { to: "/profile", label: t("navigation.profile") }
      : { to: "/register", label: t("actions.createAccount") };

  return (
    <div className="min-h-screen">
      <section className="page-shell aurora-bg overflow-hidden">
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
            <p className="section-eyebrow">{t("home.heroEyebrow")}</p>
            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-[4.35rem]">
              {t("home.heroTitle")}
              <span className="gradient-text block pt-2">{t("home.heroGradient")}</span>
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">{experienceCopy.heroDescription}</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/analyze" className="btn-primary text-base">{t("actions.startAnalysis")}</Link>
              <Link to={secondaryCta.to} className="btn-secondary text-base">{secondaryCta.label}</Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatPill label={isLoggedIn ? t("home.accountMode") : t("home.guestQuota")} value={isLoggedIn ? t("common.unlimited") : remaining} />
              <StatPill label={t("home.freeTrial")} value={t("common.countAnalyses", { count: guestLimit })} />
              <StatPill label={t("home.emotionModel")} value={String(emotionOptions.length)} />
            </div>

            {!isLoggedIn && (
              <div className="mt-5 rounded-3xl border border-amber-200/20 bg-amber-200/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-amber-50">{t("home.guestOpenTitle", { limit: guestLimit })}</p>
                    <p className="mt-1 text-sm text-amber-50/75">{t("home.guestOpenDescription")}</p>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-50">{t("home.remaining", { count: remaining })}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full rounded-full bg-gradient-to-r from-amber-200 to-cyan-200" style={{ width: `${guestProgress}%` }} />
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={false} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }} className="premium-card relative overflow-hidden p-6 sm:p-8 xl:sticky xl:top-28">
            <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-cyan-300/10 blur-2xl" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-100/70">{t("home.liveEmotionEyebrow")}</p>
                <h2 className="mt-2 text-2xl font-black text-white">{experienceCopy.panelTitle}</h2>
              </div>
              <span className="orb h-14 w-14" aria-hidden="true"><span className="relative z-10 h-3 w-3 rounded-full bg-cyan-100" /></span>
            </div>

            <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
              {experienceCopy.inputModes.map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/25 px-4 py-3">
                  <div>
                    <p className="text-sm font-black text-white">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p>
                  </div>
                  <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                    {item.marker}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
              {emotionOptions.slice(0, 6).map((emotion, index) => (
                <motion.div
                  key={emotion.key}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 + index * 0.04 }}
                  className={`rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl ${index > 3 ? "hidden lg:block" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full shadow-lg" style={{ backgroundColor: emotion.accentColor, boxShadow: `0 0 22px ${emotion.accentColor}70` }} />
                    <span className="text-sm font-bold text-white">{emotion.label}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.span className="block h-full rounded-full" initial={{ width: "20%" }} animate={{ width: [`${48 + index * 4}%`, `${62 + index * 4}%`, `${54 + index * 4}%`] }} transition={{ duration: 3.8 + index * 0.15, repeat: Infinity, ease: "easeInOut" }} style={{ backgroundColor: emotion.accentColor }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-3">
          {experienceCopy.features.map((feature, index) => (
            <motion.div key={feature.title} initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: index * 0.08 }} className={`premium-card premium-card-hover bg-gradient-to-br ${feature.tone} p-7`}>
              <span className="text-xs font-black uppercase tracking-[0.3em] text-cyan-100/60">{feature.marker}</span>
              <h2 className="mt-5 text-xl font-black text-white">{feature.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-4 pb-20 sm:px-6 lg:px-8">
        <div className="premium-card mx-auto max-w-6xl p-6 sm:p-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-eyebrow">{t("home.flowEyebrow")}</p>
              <h2 className="mt-4 text-3xl font-black text-white">{experienceCopy.flowTitle}</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">{experienceCopy.flowDescription}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {experienceCopy.journeySteps.map((item, index) => (
              <motion.div key={item.step} initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ delay: index * 0.06 }} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-200/10 text-lg font-black text-cyan-100">{item.step}</div>
                <h3 className="mt-5 font-black text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.06] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-black text-white">{experienceCopy.studioReadyTitle}</p>
              <p className="mt-1 text-sm text-slate-400">{experienceCopy.studioReadyDescription}</p>
            </div>
            <Link to="/analyze" className="btn-primary text-base">{t("actions.goToStudio")}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 shadow-lg shadow-slate-950/15 backdrop-blur-xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function getHomeExperienceCopy(language, guestLimit) {
  if (String(language || "tr").startsWith("en")) {
    return {
      heroDescription: "Your AI-powered life coach works with a selfie, a text entry, or both together. The system detects emotion first, then prepares music, movie, book, and practical advice recommendations around that result.",
      panelTitle: "Input and emotion map",
      inputModes: [
        { label: "Selfie only", description: "Read the facial signal directly and classify the dominant emotion.", marker: "IMG" },
        { label: "Text only", description: "Send the written expression to Gemini and classify the emotional tone.", marker: "TXT" },
        { label: "Selfie + text", description: "Detect the face first, then send that signal with the text for the final emotion.", marker: "MIX" },
      ],
      features: [
        { marker: "01", title: "Flexible input flow", description: "The user can continue with only text, only selfie, or both together without being blocked by a rigid form.", tone: "from-cyan-300/18 to-indigo-300/10" },
        { marker: "02", title: "Emotion-first result", description: "The result experience centers the detected emotion and turns it into recommendation bundles instead of technical noise.", tone: "from-amber-300/18 to-rose-300/10" },
        { marker: "03", title: "Recommendation stack", description: "Spotify, movie, book, and Gemini-based life advice work together around the final emotion classification.", tone: "from-teal-300/18 to-emerald-300/10" },
      ],
      flowTitle: "Four steps to a clean AI coaching flow",
      flowDescription: `The first ${guestLimit} analyses can be tried as a guest. After that, an account keeps history and profile together while the core analysis flow stays simple.`,
      journeySteps: [
        { step: "1", title: "Choose your input", desc: "Start with a selfie, a short text, or combine both in one analysis." },
        { step: "2", title: "Detect emotion", desc: "The system classifies one emotion from the project emotion set and stores its internal reliability signal in the background." },
        { step: "3", title: "Build the final tone", desc: "If text exists, Gemini evaluates the text or the text plus selfie signal together." },
        { step: "4", title: "Open recommendations", desc: "Books, movies, music, and three focused life-coaching suggestions are prepared." },
      ],
      studioReadyTitle: "Ready to test the coaching studio?",
      studioReadyDescription: "The studio now supports image-only, text-only, and combined analysis in one guided screen.",
    };
  }

  return {
    heroDescription: "Yapay zeka destekli yaşam koçun selfie, metin ya da ikisini birlikte kabul eder. Sistem önce duyguyu belirler; ardından buna uygun müzik, film, kitap ve uygulanabilir kısa tavsiyeler hazırlar.",
    panelTitle: "Girdi ve duygu haritası",
    inputModes: [
      { label: "Sadece selfie", description: "Yüz sinyalini doğrudan okuyup baskın duyguyu sınıflandırır.", marker: "IMG" },
      { label: "Sadece metin", description: "Yazdığın ifadeyi Gemini'ye gönderip duygusal tonu belirler.", marker: "TXT" },
      { label: "Selfie + metin", description: "Önce görsel sinyali bulur, sonra bunu metinle birleştirip son duyguyu çıkarır.", marker: "MIX" },
    ],
    features: [
      { marker: "01", title: "Esnek giriş akışı", description: "Kullanıcı sadece metinle, sadece selfie ile ya da ikisini birlikte kullanarak akışı tamamlayabilir.", tone: "from-cyan-300/18 to-indigo-300/10" },
      { marker: "02", title: "Duygu odaklı sonuç", description: "Sonuç ekranı teknik karmaşa yerine tespit edilen duyguyu merkeze alır ve öneri paketleriyle ilerler.", tone: "from-amber-300/18 to-rose-300/10" },
      { marker: "03", title: "Öneri zinciri", description: "Spotify, film, kitap ve Gemini tabanlı yaşam tavsiyeleri son duygu sonucunun etrafında birlikte çalışır.", tone: "from-teal-300/18 to-emerald-300/10" },
    ],
    flowTitle: "Temiz bir AI koç akışı için dört adım",
    flowDescription: `İlk ${guestLimit} analiz misafir olarak denenebilir. Sonrasında hesap açıldığında geçmiş ve profil korunur; ama ana analiz akışı sade kalır.`,
    journeySteps: [
      { step: "1", title: "Girdini seç", desc: "Selfie, kısa bir metin ya da ikisini birlikte kullanarak analizi başlat." },
      { step: "2", title: "Duyguyu belirle", desc: "Sistem, projedeki duygu kümesinden tek bir sonucu çıkarır; iç güven sinyalini ise arka planda saklar." },
      { step: "3", title: "Son tonu kur", desc: "Metin varsa Gemini metni veya görsel+metin birleşimini değerlendirir." },
      { step: "4", title: "Önerileri aç", desc: "Duygu sonucuna göre kitap, film, müzik ve kısa yaşam koçu tavsiyeleri hazırlanır." },
    ],
    studioReadyTitle: "Koçluk stüdyosunu denemeye hazır mısın?",
    studioReadyDescription: "Stüdyo artık tek ekranda sadece görsel, sadece metin ve birleşik analizi destekliyor.",
  };
}

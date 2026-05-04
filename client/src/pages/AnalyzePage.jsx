import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { emotionAPI, guestSessionAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

const EXAMPLE_TEXTS = [
  "Bugün aynı anda biraz yorgun ama toparlanmaya istekli hissediyorum. Daha sakin bir ritme ihtiyacım var.",
  "Son günlerde zihnim çok dolu ve sürekli yapılacakları düşünüyorum. Biraz nefes almak istiyorum.",
  "Beklediğim güzel bir haber geldi ve heyecanla karışık bir mutluluk yaşıyorum. Bu enerjiyi doğru kullanmak istiyorum.",
];

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Görsel okunamadı."));
        return;
      }

      const [, base64Payload = ""] = result.split(",", 2);
      resolve(base64Payload);
    };
    reader.onerror = () => reject(new Error("Görsel okunamadı."));
    reader.readAsDataURL(file);
  });
}

export default function AnalyzePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [guestRemaining, setGuestRemaining] = useState(guestSessionAPI.getGuestRemainingAnalyses());
  const [examplePulse, setExamplePulse] = useState(0);

  const copy = useMemo(() => getAnalyzeCopy(i18n.language), [i18n.language]);
  const guestLimit = guestSessionAPI.getDefaultGuestLimit();
  const hasText = text.trim().length > 0;
  const hasImage = Boolean(imageFile);
  const guestLocked = !isLoggedIn && guestRemaining <= 0;
  const analysisMode = getAnalysisMode(hasText, hasImage);
  const modeMeta = copy.modes.find((item) => item.key === analysisMode) || null;
  const baseReady = (hasText || hasImage) && (!hasImage || consentGiven) && !guestLocked;
  const canSubmit = baseReady && !isAnalyzing;
  const quotaProgress = isLoggedIn ? 100 : clampPercent((guestRemaining / guestLimit) * 100);
  const contextStrength = useMemo(() => getContextStrength(text.trim().length, t), [text, t]);
  const exampleTexts = useMemo(() => {
    const values = t("analyze.examples", { returnObjects: true });
    return Array.isArray(values) ? values : EXAMPLE_TEXTS;
  }, [t, i18n.language]);
  const analysisLoadingSteps = modeMeta?.steps || copy.defaultSteps;
  const readinessItems = useMemo(
    () => [
      {
        label: copy.checklist.textLabel,
        done: hasText,
        hint: hasText ? contextStrength.label : copy.checklist.textHint,
      },
      {
        label: copy.checklist.imageLabel,
        done: hasImage,
        hint: hasImage ? copy.checklist.imageReady : copy.checklist.imageHint,
      },
      {
        label: copy.checklist.consentLabel,
        done: !hasImage || consentGiven,
        hint: hasImage ? (consentGiven ? copy.checklist.consentReady : copy.checklist.consentHint) : copy.checklist.consentOptional,
      },
      {
        label: isLoggedIn ? copy.checklist.accountLabel : copy.checklist.guestLabel,
        done: isLoggedIn || !guestLocked,
        hint: isLoggedIn ? copy.checklist.accountHint : guestLocked ? copy.checklist.lockedHint : copy.checklist.remainingHint(guestRemaining),
      },
    ],
    [consentGiven, contextStrength.label, copy, guestLocked, guestRemaining, hasImage, hasText, isLoggedIn],
  );

  useEffect(() => {
    return () => {
      stopCameraStream(videoRef);
    };
  }, []);

  function resetImage() {
    setImageFile(null);
    setImagePreview(null);
    setConsentGiven(false);
    stopCameraStream(videoRef);
    setShowCamera(false);
  }

  function validateAndSetFile(file) {
    if (!file) {
      return;
    }

    const fileType = String(file.type || "").toLowerCase().trim();
    if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
      setError(t("analyze.errors.unsupportedFormat"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t("analyze.errors.fileTooLarge"));
      return;
    }

    setError("");
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target?.result || null);
    reader.readAsDataURL(file);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t("analyze.errors.cameraUnsupported"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 960, height: 720 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setShowCamera(true);
      setError("");
    } catch {
      setError(t("analyze.errors.cameraAccess"));
    }
  }

  function stopCamera() {
    stopCameraStream(videoRef);
    setShowCamera(false);
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) {
        setError(t("analyze.errors.cameraCapture"));
        return;
      }

      const file = new File([blob], "webcam-photo.jpg", { type: "image/jpeg" });
      validateAndSetFile(file);
      stopCamera();
    }, "image/jpeg");
  }

  function fillExampleText() {
    const nextIndex = Math.floor(Math.random() * exampleTexts.length);
    setText(exampleTexts[nextIndex]);
    setExamplePulse((value) => value + 1);
  }

  function openLogin() {
    navigate("/login", { state: { from: "/analyze" } });
  }

  async function handleAnalyze() {
    if (guestLocked) {
      toast.error(t("analyze.errors.guestQuota"));
      openLogin();
      return;
    }

    if (!hasText && !hasImage) {
      setError(copy.readiness.missingInput);
      return;
    }

    if (hasImage && !consentGiven) {
      setError(copy.readiness.missingConsent);
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const imageBase64 = hasImage ? await fileToBase64(imageFile) : "";
      const result = await emotionAPI.analyze({
        imageBase64,
        text: hasText ? text.trim() : "",
        mimeType: hasImage ? imageFile.type || "image/jpeg" : undefined,
      });

      if (typeof result.guestRemainingAnalyses === "number") {
        setGuestRemaining(result.guestRemainingAnalyses);
      }

      navigate(`/result/${result.historyId}`, {
        state: { analysisResult: result },
      });
    } catch (requestError) {
      if (requestError.code === "GUEST_QUOTA_EXCEEDED") {
        setGuestRemaining(0);
        toast.error(t("analyze.errors.quotaRedirect"));
        openLogin();
        return;
      }

      setError(requestError.message || t("analyze.errors.analysisFailed"));
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="page-shell aurora-bg">
      <div className="relative z-10 mx-auto max-w-7xl space-y-5 sm:space-y-6">
        <HeroPanel copy={copy} modeMeta={modeMeta} />

        <GuestQuotaPanel
          isLoggedIn={isLoggedIn}
          guestRemaining={guestRemaining}
          guestLimit={guestLimit}
          quotaProgress={quotaProgress}
          guestLocked={guestLocked}
          onLogin={openLogin}
          t={t}
        />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.92fr)] xl:gap-6">
          <div className="space-y-5 sm:space-y-6">
            <ComposerPanel
              text={text}
              onChange={setText}
              onExample={fillExampleText}
              contextStrength={contextStrength}
              examplePulse={examplePulse}
              copy={copy}
              t={t}
            />

            <ModeCards copy={copy} analysisMode={analysisMode} />
          </div>

          <div className="space-y-5 sm:space-y-6">
            <SelfiePanel
              imagePreview={imagePreview}
              imageFile={imageFile}
              showCamera={showCamera}
              isDragging={isDragging}
              fileInputRef={fileInputRef}
              videoRef={videoRef}
              canvasRef={canvasRef}
              setIsDragging={setIsDragging}
              validateAndSetFile={validateAndSetFile}
              resetImage={resetImage}
              startCamera={startCamera}
              stopCamera={stopCamera}
              capturePhoto={capturePhoto}
              copy={copy}
              t={t}
            />

            {hasImage && <ConsentCard consentGiven={consentGiven} setConsentGiven={setConsentGiven} copy={copy} />}
            <ChecklistPanel items={readinessItems} title={copy.checklist.title} />
          </div>
        </div>

        <AnimatePresence>
          {error && <ErrorPanel error={error} guestLocked={guestLocked} onLogin={openLogin} t={t} />}
        </AnimatePresence>

        <ActionBar
          canSubmit={canSubmit}
          isAnalyzing={isAnalyzing}
          guestLocked={guestLocked}
          readinessMessage={getReadinessMessage({ hasText, hasImage, consentGiven, guestLocked, copy })}
          onAnalyze={guestLocked ? openLogin : handleAnalyze}
          t={t}
        />
      </div>

      <AnimatePresence>{isAnalyzing && <LoadingOverlay title={copy.overlayTitle} description={copy.overlayDescription} steps={analysisLoadingSteps} />}</AnimatePresence>
    </div>
  );
}

function HeroPanel({ copy, modeMeta }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="premium-card relative overflow-hidden p-6 sm:p-8 lg:p-10"
    >
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/15 blur-3xl" />
      <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <p className="section-eyebrow">{copy.heroEyebrow}</p>
          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            {copy.heroTitle}
            <span className="gradient-text block">{copy.heroGradient}</span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">{copy.heroDescription}</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/70">{copy.readinessSignal}</p>
              <p className="mt-2 text-2xl font-black text-white">{copy.flowReady}</p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">{modeMeta?.summary || copy.emptySummary}</p>
            </div>
            <span className="orb h-14 w-14" aria-hidden="true">
              <span className="relative z-10 h-3 w-3 rounded-full bg-cyan-100" />
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {copy.heroSignals.map((signal, index) => (
              <div key={signal} className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-white">{signal}</span>
                  <span className="text-xs text-slate-500">0{index + 1}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.span
                    className="block h-full rounded-full bg-gradient-to-r from-cyan-200 to-teal-300"
                    initial={{ width: "28%" }}
                    animate={{ width: ["38%", "86%", "54%"] }}
                    transition={{ duration: 3 + index * 0.25, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function GuestQuotaPanel({ isLoggedIn, guestRemaining, guestLimit, quotaProgress, guestLocked, onLogin, t }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className={`premium-card p-5 ${guestLocked ? "border-amber-200/30 bg-amber-300/10" : ""}`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black text-white">{isLoggedIn ? t("analyze.accountModeOpen") : guestLocked ? t("analyze.guestLocked") : t("analyze.guestMode")}</p>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
            {isLoggedIn
              ? t("analyze.accountModeDescription")
              : guestLocked
                ? t("analyze.guestLockedDescription")
                : t("analyze.guestModeDescription", { limit: guestLimit })}
          </p>
        </div>

        <div className="min-w-full rounded-3xl border border-white/10 bg-white/[0.06] p-4 lg:min-w-80">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{isLoggedIn ? t("common.status") : t("common.remainingQuota")}</p>
              <p className="mt-1 text-4xl font-black text-white">{isLoggedIn ? "Sınırsız" : guestRemaining}</p>
            </div>
            {!isLoggedIn && (
              <button type="button" onClick={onLogin} className={guestLocked ? "btn-primary !px-4 !py-2" : "btn-secondary !px-4 !py-2"}>
                {t("actions.login")}
              </button>
            )}
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.span
              className="block h-full rounded-full bg-gradient-to-r from-amber-200 via-cyan-200 to-teal-300"
              initial={{ width: 0 }}
              animate={{ width: `${quotaProgress}%` }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            />
          </div>
          {!isLoggedIn && <p className="mt-3 text-xs text-slate-500">{t("analyze.quotaUsable", { remaining: guestRemaining, limit: guestLimit })}</p>}
        </div>
      </div>
    </motion.section>
  );
}

function ComposerPanel({ text, onChange, onExample, contextStrength, examplePulse, copy, t }) {
  const progress = clampPercent((text.length / 1000) * 100);

  return (
    <motion.section
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12 }}
      className="premium-card premium-card-hover p-6"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-eyebrow !px-3 !py-1.5">{copy.composerEyebrow}</p>
          <h2 className="mt-4 text-2xl font-black text-white">{copy.composerTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{copy.composerDescription}</p>
        </div>
        <span
          className="rounded-full border px-3 py-1 text-xs font-bold"
          style={{ borderColor: `${contextStrength.color}55`, color: contextStrength.color }}
        >
          {contextStrength.label}
        </span>
      </div>

      <motion.textarea
        key={examplePulse}
        value={text}
        onChange={(event) => onChange(event.target.value)}
        aria-label={t("analyze.textareaAria")}
        aria-describedby="emotion-context-strength"
        placeholder={t("analyze.textareaPlaceholder")}
        maxLength={1000}
        className="input-field min-h-[14rem] resize-none !rounded-[1.6rem] !p-5 text-base leading-8 sm:min-h-[18rem]"
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onExample} className="btn-secondary self-start !px-4 !py-2">
          {t("analyze.inspire")}
        </button>
        <div className="min-w-52">
          <div id="emotion-context-strength" className="flex items-center justify-between text-xs text-slate-500">
            <span>{t("analyze.contextStrength")}</span>
            <span>{text.length}/1000</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: contextStrength.color }} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function ModeCards({ copy, analysisMode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
      className="premium-card premium-card-hover p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="section-eyebrow !px-3 !py-1.5">{copy.modeEyebrow}</p>
          <h2 className="mt-4 text-2xl font-black text-white">{copy.modeTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{copy.modeDescription}</p>
        </div>
        <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
          {analysisMode === "empty" ? copy.modeWaiting : copy.modeLive}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {copy.modes.map((mode) => {
          const active = mode.key === analysisMode;
          return (
            <div
              key={mode.key}
              className={`rounded-[1.6rem] border p-4 transition ${
                active ? "border-cyan-200/30 bg-cyan-200/10 shadow-xl shadow-cyan-950/10" : "border-white/10 bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black text-white">{mode.label}</span>
                <span className="rounded-full border border-white/10 bg-slate-950/35 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                  {mode.marker}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{mode.description}</p>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

function SelfiePanel({
  imagePreview,
  imageFile,
  showCamera,
  isDragging,
  fileInputRef,
  videoRef,
  canvasRef,
  setIsDragging,
  validateAndSetFile,
  resetImage,
  startCamera,
  stopCamera,
  capturePhoto,
  copy,
  t,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.18 }}
      className="premium-card p-6"
    >
      <div className="mb-5">
        <p className="section-eyebrow !px-3 !py-1.5">{copy.selfieEyebrow}</p>
        <h2 className="mt-4 text-2xl font-black text-white">{copy.selfieTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{copy.selfieDescription}</p>
      </div>

      {imagePreview ? (
        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-200/25">
          <img src={imagePreview} alt={copy.selfieReady} className="h-72 w-full object-cover" />
          <ScanOverlay />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent p-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="rounded-full border border-emerald-200/25 bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-100">
                {copy.selfieReady}
              </span>
              <p className="mt-2 max-w-xs truncate text-sm font-bold text-white">{imageFile?.name || t("analyze.cameraImage")}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary !px-4 !py-2">
                {t("analyze.change")}
              </button>
              <button type="button" onClick={resetImage} className="btn-ghost bg-red-400/10 text-red-100 hover:bg-red-400/20" aria-label={t("analyze.removeSelfieAria")}>
                {t("analyze.remove")}
              </button>
            </div>
          </div>
        </div>
      ) : showCamera ? (
        <div>
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-200/25 bg-slate-950">
            <video ref={videoRef} autoPlay playsInline muted className="h-72 w-full object-cover" />
            <ScanOverlay />
            <CornerFrame />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" onClick={capturePhoto} className="btn-primary">
              {t("analyze.takePhoto")}
            </button>
            <button type="button" onClick={stopCamera} className="btn-secondary">
              {t("analyze.closeCamera")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            validateAndSetFile(event.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`focus-ring relative flex min-h-72 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed px-6 text-center transition-all ${
            isDragging ? "border-cyan-200 bg-cyan-200/10 shadow-2xl shadow-cyan-950/25" : "border-white/15 bg-white/[0.05] hover:border-cyan-200/45"
          }`}
          aria-label={t("analyze.uploadAria")}
        >
          <ScanOverlay subtle />
          <span className="orb mb-5 h-16 w-16" aria-hidden="true">
            <span className="relative z-10 h-3 w-3 rounded-full bg-cyan-100" />
          </span>
          <p className="text-lg font-black text-white">{copy.dropTitle}</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">{copy.dropDescription}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["JPG", "PNG", "WebP", "HEIC", "HEIF"].map((type) => (
              <span key={type} className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-bold text-slate-300">
                {type}
              </span>
            ))}
          </div>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        onChange={(event) => {
          validateAndSetFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        className="hidden"
      />

      {!imagePreview && !showCamera && (
        <button type="button" onClick={startCamera} className="btn-secondary mt-3 w-full">
          {t("analyze.openCamera")}
        </button>
      )}
    </motion.section>
  );
}

function ConsentCard({ consentGiven, setConsentGiven, copy }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 rounded-[1.6rem] border p-5 transition-all ${
        consentGiven ? "border-cyan-200/35 bg-cyan-200/10 shadow-xl shadow-cyan-950/10" : "border-white/10 bg-white/[0.05] hover:border-white/20"
      }`}
    >
      <input
        id="analysis-consent"
        type="checkbox"
        checked={consentGiven}
        onChange={(event) => setConsentGiven(event.target.checked)}
        aria-describedby="analysis-consent-description"
        className="mt-1 h-5 w-5 accent-cyan-300"
      />
      <span>
        <span className="block text-sm font-black text-white">{copy.consentTitle}</span>
        <span id="analysis-consent-description" className="mt-1 block text-xs leading-6 text-slate-400">
          {copy.consentDescription}
        </span>
      </span>
    </label>
  );
}

function ChecklistPanel({ items, title }) {
  return (
    <section className="premium-card p-5">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                item.done ? "bg-emerald-300 text-slate-950" : "bg-amber-300/15 text-amber-100"
              }`}
            >
              {item.done ? "✓" : "!"}
            </span>
            <span>
              <span className="block text-sm font-bold text-white">{item.label}</span>
              <span className="block text-xs leading-5 text-slate-500">{item.hint}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ErrorPanel({ error, guestLocked, onLogin, t }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-[1.5rem] border border-red-300/20 bg-red-400/10 p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-red-50">{guestLocked ? t("analyze.errorLoginRequired") : t("analyze.errorSmallMissing")}</p>
          <p className="mt-1 text-sm leading-6 text-red-100/85">{error}</p>
        </div>
        {guestLocked && (
          <button type="button" onClick={onLogin} className="btn-primary self-start !px-4 !py-2 sm:self-auto">
            {t("actions.login")}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ActionBar({ canSubmit, isAnalyzing, guestLocked, readinessMessage, onAnalyze, t }) {
  return (
    <section className="premium-card sticky bottom-28 z-20 p-4 lg:static lg:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black text-white">
            {canSubmit ? t("analyze.actionReady") : guestLocked ? t("analyze.actionLoginRequired") : t("analyze.actionFinalChecks")}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{readinessMessage}</p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing || (!canSubmit && !guestLocked)}
          aria-busy={isAnalyzing}
          className="btn-primary w-full !py-4 text-base lg:w-auto lg:min-w-72"
        >
          {isAnalyzing ? t("analyze.analyzing") : guestLocked ? t("analyze.continueWithLogin") : t("actions.startAnalysis")}
        </button>
      </div>
    </section>
  );
}

function LoadingOverlay({ title, description, steps }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/72 px-4 backdrop-blur-xl"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -10 }}
        className="premium-card w-full max-w-lg overflow-hidden p-7 text-center"
      >
        <motion.span
          className="orb mx-auto h-20 w-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          aria-hidden="true"
        >
          <span className="relative z-10 h-4 w-4 rounded-full bg-cyan-100" />
        </motion.span>
        <h2 className="mt-6 text-3xl font-black text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        <div className="mt-6 space-y-3 text-left">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-white">{step}</span>
                <span className="text-xs text-cyan-100/70">0{index + 1}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.span
                  className="block h-full rounded-full bg-gradient-to-r from-cyan-200 to-teal-300"
                  animate={{ x: ["-100%", "120%"] }}
                  transition={{ duration: 1.7 + index * 0.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: "55%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ScanOverlay({ subtle = false }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.10),transparent_55%)]" />
      <motion.span
        className={`absolute left-0 right-0 h-0.5 bg-cyan-200 ${subtle ? "opacity-35" : "opacity-75"} shadow-[0_0_24px_rgba(125,211,252,0.85)]`}
        animate={{ y: ["0rem", "18rem", "0rem"] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function CornerFrame() {
  return (
    <div className="pointer-events-none absolute inset-5">
      <span className="absolute left-0 top-0 h-10 w-10 rounded-tl-2xl border-l-2 border-t-2 border-cyan-100/75" />
      <span className="absolute right-0 top-0 h-10 w-10 rounded-tr-2xl border-r-2 border-t-2 border-cyan-100/75" />
      <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-2 border-l-2 border-cyan-100/75" />
      <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-2 border-r-2 border-cyan-100/75" />
    </div>
  );
}

function getAnalyzeCopy(language) {
  if (isEnglishLanguage(language)) {
    return {
      heroEyebrow: "Analysis Studio",
      heroTitle: "Read today’s emotional signal",
      heroGradient: "with a cleaner AI flow.",
      heroDescription: "A user can continue with only a selfie, only a text entry, or both together. The system first detects emotion, then opens recommendation bundles around that result.",
      readinessSignal: "AI readiness signal",
      flowReady: "Flexible analysis flow",
      emptySummary: "The same studio supports selfie-only, text-only, and combined analysis without forcing a rigid form.",
      heroSignals: ["Selfie signal", "Text context", "Recommendation flow"],
      composerEyebrow: "Emotion journal",
      composerTitle: "Add text if you want richer context",
      composerDescription: "Text is optional, but it helps Gemini explain the emotional tone more clearly.",
      modeEyebrow: "Input modes",
      modeTitle: "Choose a flexible flow",
      modeDescription: "When both inputs exist, the face is read first and then passed to the text model for the final emotion.",
      modeWaiting: "waiting",
      modeLive: "live",
      selfieEyebrow: "Selfie signal",
      selfieTitle: "Add a selfie if you want visual detection",
      selfieDescription: "The selfie is optional. If you upload one, the facial signal is analyzed first and then used in the final flow.",
      selfieReady: "Selfie ready",
      dropTitle: "Drag, drop, or click",
      dropDescription: "Add a selfie to classify the dominant emotion from facial expression before the recommendation stage.",
      consentTitle: "Privacy consent",
      consentDescription: "I allow my image to be used only for emotion analysis and not stored as a permanent gallery asset.",
      checklist: {
        title: "Analysis readiness",
        textLabel: "Text context",
        textHint: "Optional, but helpful for Gemini.",
        imageLabel: "Selfie signal",
        imageHint: "Optional, but required for face-based detection.",
        imageReady: "Visual signal is ready.",
        consentLabel: "Privacy consent",
        consentHint: "Required only if a selfie is used.",
        consentReady: "Consent recorded.",
        consentOptional: "This stays optional until you add a selfie.",
        accountLabel: "Account mode active",
        guestLabel: "Guest quota available",
        accountHint: "This analysis can be saved to history.",
        lockedHint: "Sign in to continue.",
        remainingHint: (count) => `${count} attempts left.`,
      },
      readiness: {
        missingInput: "Start with a selfie, a text entry, or both together.",
        missingConsent: "Please confirm privacy consent before using a selfie.",
        readyText: "Text is ready. Gemini can classify the emotional tone now.",
        readyImage: "Selfie is ready. The image model can classify the dominant emotion now.",
        readyMultimodal: "Text and selfie are ready. The face will be detected first and then merged with the text.",
        locked: "Guest quota is finished. Sign in to continue.",
      },
      modes: [
        {
          key: "image",
          marker: "IMG",
          label: "Selfie only",
          description: "The image model classifies one emotion directly from the facial signal.",
          summary: "This run will classify the emotion directly from the selfie and then open recommendations.",
          steps: ["Facial signal is being read", "Dominant emotion is being classified", "Recommendations are being prepared"],
        },
        {
          key: "text",
          marker: "TXT",
          label: "Text only",
          description: "Gemini reads the written context and returns the emotional tone.",
          summary: "This run sends only the written context to Gemini to detect the emotional tone.",
          steps: ["Written context is being parsed", "Gemini is classifying the emotional tone", "Recommendations are being prepared"],
        },
        {
          key: "multimodal",
          marker: "MIX",
          label: "Selfie + text",
          description: "The face is read first, then the face signal and text are combined for the final emotion.",
          summary: "This run detects the facial signal first and then combines it with the text for the final emotion.",
          steps: ["Face signal is being detected", "Text and image context are being combined", "Recommendations are being prepared"],
        },
      ],
      defaultSteps: ["Input is being validated", "Models are preparing the analysis", "Personal recommendations are being prepared"],
      overlayTitle: "Preparing your analysis",
      overlayDescription: "The coaching flow is evaluating the selected input path and building recommendations.",
    };
  }

  return {
    heroEyebrow: "Analiz Stüdyosu",
    heroTitle: "Bugünün duygu sinyalini",
    heroGradient: "daha temiz bir AI akışıyla oku.",
    heroDescription: "Kullanıcı sadece selfie, sadece metin ya da ikisini birlikte gönderebilir. Sistem önce duyguyu belirler, sonra bu sonuca göre öneri paketlerini açar.",
    readinessSignal: "AI hazırlık sinyali",
    flowReady: "Esnek analiz akışı",
    emptySummary: "Aynı stüdyo içinde sadece selfie, sadece metin ve birleşik analiz akışı desteklenir; katı bir form zorunlu değildir.",
    heroSignals: ["Selfie sinyali", "Metin bağlamı", "Öneri akışı"],
    composerEyebrow: "Duygu günlüğü",
    composerTitle: "İstersen metinle bağlam ekle",
    composerDescription: "Metin zorunlu değil; ama Gemini'nin duygusal tonu daha net yorumlamasına yardımcı olur.",
    modeEyebrow: "Girdi modları",
    modeTitle: "Esnek bir akış seç",
    modeDescription: "Her iki girdi birlikte varsa önce yüz sinyali okunur, sonra son duygu için metin modeliyle birleştirilir.",
    modeWaiting: "bekliyor",
    modeLive: "hazır",
    selfieEyebrow: "Selfie sinyali",
    selfieTitle: "İstersen görsel tespit için selfie ekle",
    selfieDescription: "Selfie zorunlu değil. Eklersen yüz sinyali önce analiz edilir, sonra son akışta kullanılır.",
    selfieReady: "Selfie hazır",
    dropTitle: "Sürükle, bırak veya tıkla",
    dropDescription: "Öneri aşamasından önce yüz ifadesinden baskın duyguyu sınıflandırmak için selfie ekle.",
    consentTitle: "Mahremiyet onayı",
    consentDescription: "Görselimin yalnızca duygu analizi için kullanılmasına ve kalıcı galeri mantığında saklanmamasına onay veriyorum.",
    checklist: {
      title: "Analiz hazırlığı",
      textLabel: "Metin bağlamı",
      textHint: "Zorunlu değil; ama Gemini için faydalı.",
      imageLabel: "Selfie sinyali",
      imageHint: "Zorunlu değil; ama yüz tabanlı tespit için gerekli.",
      imageReady: "Görsel sinyal hazır.",
      consentLabel: "Mahremiyet onayı",
      consentHint: "Sadece selfie kullanılırsa gerekir.",
      consentReady: "Onay kaydedildi.",
      consentOptional: "Selfie eklenene kadar bu adım opsiyonel kalır.",
      accountLabel: "Hesap modu aktif",
      guestLabel: "Misafir hakkı uygun",
      accountHint: "Bu analiz geçmişe kaydedilebilir.",
      lockedHint: "Devam etmek için giriş yap.",
      remainingHint: (count) => `${count} hak kaldı.`,
    },
    readiness: {
      missingInput: "Selfie, metin ya da ikisini birlikte ekleyerek analizi başlat.",
      missingConsent: "Selfie kullanmadan önce mahremiyet onayını işaretle.",
      readyText: "Metin hazır. Gemini duygusal tonu şimdi sınıflandırabilir.",
      readyImage: "Selfie hazır. Görsel model baskın duyguyu şimdi sınıflandırabilir.",
      readyMultimodal: "Metin ve selfie hazır. Önce yüz okunacak, sonra metinle birleştirilecek.",
      locked: "Misafir hakkın doldu. Devam etmek için giriş yapman gerekiyor.",
    },
    modes: [
      {
        key: "image",
        marker: "IMG",
        label: "Sadece selfie",
        description: "Görsel modeli yüz sinyalinden doğrudan tek bir duygu sınıflandırır.",
        summary: "Bu akış selfie üzerinden duyguyu doğrudan bulur ve oradan önerilere geçer.",
        steps: ["Yüz sinyali okunuyor", "Baskın duygu sınıflandırılıyor", "Öneriler hazırlanıyor"],
      },
      {
        key: "text",
        marker: "TXT",
        label: "Sadece metin",
        description: "Gemini yazılı bağlamı okuyup duygusal tonu geri döndürür.",
        summary: "Bu akış yalnızca yazılı bağlamı Gemini'ye göndererek duygusal tonu belirler.",
        steps: ["Yazılı bağlam okunuyor", "Gemini duygusal tonu sınıflandırıyor", "Öneriler hazırlanıyor"],
      },
      {
        key: "multimodal",
        marker: "MIX",
        label: "Selfie + metin",
        description: "Önce yüz okunur, sonra yüz sinyali ile metin birleştirilerek son duygu bulunur.",
        summary: "Bu akış önce yüz sinyalini tespit eder, sonra son duygu için metinle birleştirir.",
        steps: ["Yüz sinyali tespit ediliyor", "Metin ve görsel bağlam birleştiriliyor", "Öneriler hazırlanıyor"],
      },
    ],
    defaultSteps: ["Girdiler doğrulanıyor", "Modeller analiz hazırlıyor", "Kişisel öneriler hazırlanıyor"],
    overlayTitle: "Analizin hazırlanıyor",
    overlayDescription: "Koçluk akışı seçtiğin girdi yolunu değerlendiriyor ve öneri alanını kuruyor.",
  };
}

function getAnalysisMode(hasText, hasImage) {
  if (hasText && hasImage) {
    return "multimodal";
  }

  if (hasImage) {
    return "image";
  }

  if (hasText) {
    return "text";
  }

  return "empty";
}

function getReadinessMessage({ hasText, hasImage, consentGiven, guestLocked, copy }) {
  if (guestLocked) {
    return copy.readiness.locked;
  }

  if (!hasText && !hasImage) {
    return copy.readiness.missingInput;
  }

  if (hasImage && !consentGiven) {
    return copy.readiness.missingConsent;
  }

  if (hasText && hasImage) {
    return copy.readiness.readyMultimodal;
  }

  if (hasImage) {
    return copy.readiness.readyImage;
  }

  return copy.readiness.readyText;
}

function stopCameraStream(videoRef) {
  if (videoRef.current?.srcObject) {
    videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    videoRef.current.srcObject = null;
  }
}

function getContextStrength(length, t) {
  if (length >= 220) {
    return { label: t("analyze.contextStrong"), color: "#22c55e" };
  }

  if (length >= 80) {
    return { label: t("analyze.contextEnough"), color: "#38bdf8" };
  }

  if (length > 0) {
    return { label: t("analyze.contextShort"), color: "#f59e0b" };
  }

  return { label: t("analyze.contextWaiting"), color: "#94a3b8" };
}

function clampPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, numeric));
}

function isEnglishLanguage(language) {
  return String(language || "tr").startsWith("en");
}

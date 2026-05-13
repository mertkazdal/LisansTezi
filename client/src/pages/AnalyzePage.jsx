import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { OnboardingSurvey, getStoredRecommendationSurvey } from "../features/onboarding";
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

const ANALYSIS_LOADING_STEPS = [
  "Fotoğrafın inceleniyor...",
  "Duygu durumun analiz ediliyor...",
  "Sana özel öneriler hazırlanıyor...",
  "Neredeyse bitti...",
];

const FRIENDLY_ANALYZE_MESSAGES_TR = {
  unsupportedImageType: "Bu dosya formatı desteklenmiyor. Lütfen JPG, PNG veya WebP formatında bir fotoğraf yükle.",
  imageTooLarge: "Fotoğraf boyutu çok büyük. Maksimum 10 MB yükleyebilirsin.",
  guestQuota: "3 analiz hakkını kullandın. Devam etmek için ücretsiz hesap oluşturabilirsin.",
  conflict:
    "Görsel ve metin analizin birbiriyle çelişiyor. Fotoğrafın ve yazdıkların farklı duygular yansıtıyor olabilir. Analiz en olası sonucu sana sunmaya çalışıyor.",
  conflictCooldown: "Analizin tutarsız sinyaller içeriyor. 1 dakika sonra tekrar deneyebilirsin.",
};

const ANALYZE_ERROR_MESSAGE_BY_CODE = {
  UNSUPPORTED_IMAGE_TYPE: FRIENDLY_ANALYZE_MESSAGES_TR.unsupportedImageType,
  UNSUPPORTED_IMAGE_MIME_TYPE: FRIENDLY_ANALYZE_MESSAGES_TR.unsupportedImageType,
  INVALID_IMAGE: "FotoÄŸraf okunamadÄ±. LÃ¼tfen farklÄ± bir gÃ¶rsel dene.",
  IMAGE_TOO_LARGE: FRIENDLY_ANALYZE_MESSAGES_TR.imageTooLarge,
  NO_FACE_DETECTED: "FotoÄŸrafta yÃ¼z bulunamadÄ±. LÃ¼tfen yÃ¼zÃ¼n net gÃ¶rÃ¼ndÃ¼ÄŸÃ¼ bir selfie yÃ¼kle.",
  MULTIPLE_FACES_DETECTED: "FotoÄŸrafta birden fazla yÃ¼z var. LÃ¼tfen yalnÄ±zca senin yÃ¼zÃ¼nÃ¼n gÃ¶rÃ¼ndÃ¼ÄŸÃ¼ bir fotoÄŸraf yÃ¼kle.",
  FACE_TOO_SMALL: "YÃ¼zÃ¼n kadrajda Ã§ok kÃ¼Ã§Ã¼k gÃ¶rÃ¼nÃ¼yor. Biraz yaklaÅŸarak tekrar dene.",
  FACE_MODEL_UNAVAILABLE: "GÃ¶rsel analiz ÅŸu an kullanÄ±lamÄ±yor. Metin ile devam edebilirsin.",
  IMAGE_UNPROCESSABLE: "GÃ¶rsel iÅŸlenemedi. Metin ekleyerek analizi tamamlayabilirsin.",
  AI_INVALID_RESPONSE: "Analiz sÄ±rasÄ±nda bir sorun oluÅŸtu. LÃ¼tfen tekrar dene.",
  SURVEY_REQUIRED: "Analize baÅŸlamadan Ã¶nce kÄ±sa bir anket doldurman gerekiyor. Bu anket sana Ã¶zel sonuÃ§lar Ã¼retmemizi saÄŸlÄ±yor.",
  survey_required: "Analize baÅŸlamadan Ã¶nce kÄ±sa bir anket doldurman gerekiyor. Bu anket sana Ã¶zel sonuÃ§lar Ã¼retmemizi saÄŸlÄ±yor.",
  GUEST_QUOTA_EXCEEDED: FRIENDLY_ANALYZE_MESSAGES_TR.guestQuota,
  ANALYSIS_RETRY_COOLDOWN: FRIENDLY_ANALYZE_MESSAGES_TR.conflictCooldown,
  ANALYSIS_COOLDOWN_ACTIVE: FRIENDLY_ANALYZE_MESSAGES_TR.conflictCooldown,
};

const PARTIAL_ANALYSIS_ALERT_MESSAGE_TR =
  "Analizin tamamlandÄ±! Ancak bazÄ± Ã¶neriler ÅŸu an getirilemedi. Duygu durumun ve koÃ§ tavsiyesi aÅŸaÄŸÄ±da hazÄ±r.";

const IMAGE_ALERT_CODES = new Set([
  "UNSUPPORTED_IMAGE_TYPE",
  "UNSUPPORTED_IMAGE_MIME_TYPE",
  "INVALID_IMAGE",
  "IMAGE_TOO_LARGE",
  "NO_FACE_DETECTED",
  "MULTIPLE_FACES_DETECTED",
  "FACE_TOO_SMALL",
  "FACE_MODEL_UNAVAILABLE",
  "IMAGE_UNPROCESSABLE",
]);

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

function getToastToneClasses(tone = "error") {
  if (tone === "warning") {
    return {
      shell: "border-amber-200/40 bg-[linear-gradient(135deg,rgba(251,191,36,0.94),rgba(245,158,11,0.92))] text-slate-950 shadow-[0_24px_80px_rgba(245,158,11,0.34)]",
      mark: "bg-slate-950 text-amber-200",
      button: "bg-slate-950/10 text-slate-900 hover:bg-slate-950/20",
      message: "text-slate-950/90",
      hint: "bg-slate-950/8 text-slate-950/80",
    };
  }

  if (tone === "success") {
    return {
      shell: "border-emerald-200/40 bg-[linear-gradient(135deg,rgba(110,231,183,0.94),rgba(34,197,94,0.88))] text-slate-950 shadow-[0_24px_80px_rgba(34,197,94,0.28)]",
      mark: "bg-slate-950 text-emerald-200",
      button: "bg-slate-950/10 text-slate-900 hover:bg-slate-950/20",
      message: "text-slate-950/90",
      hint: "bg-slate-950/8 text-slate-950/80",
    };
  }

  return {
    shell: "border-red-200/40 bg-[linear-gradient(135deg,rgba(248,113,113,0.94),rgba(220,38,38,0.9))] text-white shadow-[0_24px_80px_rgba(220,38,38,0.28)]",
    mark: "bg-white text-red-700",
    button: "bg-white/12 text-white hover:bg-white/20",
    message: "text-white/92",
    hint: "bg-white/12 text-white/86",
  };
}

function showAnalysisAlertToast({ title, message, hint, tone = "error", id = "analysis-user-alert", badge = "!" }) {
  const classes = getToastToneClasses(tone);

  toast.custom(
    (toastInstance) => (
      <div
        className={`pointer-events-auto w-[min(92vw,28rem)] rounded-[1.6rem] border p-4 transition-all ${classes.shell} ${
          toastInstance.visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black ${classes.mark}`}>
            {badge}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black uppercase tracking-[0.18em]">{title}</p>
              <button
                type="button"
                onClick={() => toast.dismiss(toastInstance.id)}
                className={`rounded-full px-2 py-1 text-xs font-bold transition ${classes.button}`}
              >
                Kapat
              </button>
            </div>
            <p className={`mt-2 text-sm font-semibold leading-6 ${classes.message}`}>{message}</p>
            {hint && <p className={`mt-3 rounded-2xl px-3 py-2 text-xs leading-5 ${classes.hint}`}>{hint}</p>}
          </div>
        </div>
      </div>
    ),
    {
      id,
      duration: tone === "success" ? 6500 : 8000,
      position: "top-center",
    },
  );
}

function showContradictionToast({ title, message, hint }) {
  toast.custom(
    (toastInstance) => (
      <div
        className={`pointer-events-auto w-[min(92vw,28rem)] rounded-[1.6rem] border border-amber-200/40 bg-[linear-gradient(135deg,rgba(251,191,36,0.94),rgba(245,158,11,0.92))] p-4 text-slate-950 shadow-[0_24px_80px_rgba(245,158,11,0.34)] transition-all ${
          toastInstance.visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-amber-200">
            !
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black uppercase tracking-[0.18em]">{title}</p>
              <button
                type="button"
                onClick={() => toast.dismiss(toastInstance.id)}
                className="rounded-full bg-slate-950/10 px-2 py-1 text-xs font-bold text-slate-900 transition hover:bg-slate-950/20"
              >
                Kapat
              </button>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-950/90">{message}</p>
            <p className="mt-3 rounded-2xl bg-slate-950/8 px-3 py-2 text-xs leading-5 text-slate-950/80">{hint}</p>
          </div>
        </div>
      </div>
    ),
    {
      id: "analysis-contradiction-alert",
      duration: 7000,
      position: "top-center",
    },
  );
}

function buildContradictionAlertPayload(copy) {
  return {
    title: copy.contradictionAlertTitle,
    message: FRIENDLY_ANALYZE_MESSAGES_TR.conflict,
    hint: copy.contradictionAlertHint,
    tone: "warning",
    id: "analysis-contradiction-alert",
    badge: "!",
  };
}

function buildAnalyzeAlertPayload({ code, message, title, hint, tone, copy }) {
  const normalizedCode = String(code || "").trim();
  const resolvedMessage = ANALYZE_ERROR_MESSAGE_BY_CODE[normalizedCode] || message || copy.genericAlertMessage;
  const isImageError = IMAGE_ALERT_CODES.has(normalizedCode);
  const isQuotaError = normalizedCode === "GUEST_QUOTA_EXCEEDED";
  const isSurveyError = normalizedCode === "SURVEY_REQUIRED" || normalizedCode === "survey_required";
  const isCooldownError = normalizedCode === "ANALYSIS_RETRY_COOLDOWN" || normalizedCode === "ANALYSIS_COOLDOWN_ACTIVE";

  return {
    title:
      title ||
      (isQuotaError
        ? copy.quotaAlertTitle
        : isSurveyError
          ? copy.surveyAlertTitle
          : isCooldownError
            ? copy.cooldownTitle
            : isImageError
              ? copy.imageAlertTitle
              : copy.errorAlertTitle),
    message: resolvedMessage,
    hint:
      hint ||
      (isQuotaError
        ? copy.quotaAlertHint
        : isSurveyError
          ? copy.surveyAlertHint
          : isCooldownError
            ? copy.cooldownAlertHint
            : isImageError
              ? copy.imageAlertHint
              : copy.errorAlertHint),
    tone: tone || (isCooldownError || isSurveyError ? "warning" : "error"),
    id: "analysis-user-alert",
    badge: isCooldownError || isSurveyError ? "!" : "x",
  };
}

function buildPartialAlertPayload(copy) {
  return {
    title: copy.partialAlertTitle,
    message: PARTIAL_ANALYSIS_ALERT_MESSAGE_TR,
    hint: copy.partialAlertHint,
    tone: "warning",
    id: "analysis-user-alert",
    badge: "!",
  };
}

function hasConflictSignal(result) {
  return Boolean(result?.contradictionDetected || result?.conflictDetected || result?.conflict_detected || result?.contradiction_detected);
}

export default function AnalyzePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const resumeAnalyzeAfterSurveyRef = useRef(false);
  const promptedSurveyOnEntryRef = useRef(false);

  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [guestRemaining, setGuestRemaining] = useState(guestSessionAPI.getGuestRemainingAnalyses());
  const [cooldownRemaining, setCooldownRemaining] = useState(guestSessionAPI.getAnalysisCooldownRemainingSeconds());
  const [contradictionAlert, setContradictionAlert] = useState(null);
  const [analysisAlert, setAnalysisAlert] = useState(null);
  const [examplePulse, setExamplePulse] = useState(0);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [showOnboardingSurvey, setShowOnboardingSurvey] = useState(false);

  const copy = useMemo(() => getAnalyzeCopy(i18n.language), [i18n.language]);
  const guestLimit = guestSessionAPI.getDefaultGuestLimit();
  const hasText = text.trim().length > 0;
  const hasImage = Boolean(imageFile);
  const guestLocked = !isLoggedIn && guestRemaining <= 0;
  const cooldownLocked = cooldownRemaining > 0;
  const analysisMode = getAnalysisMode(hasText, hasImage);
  const modeMeta = copy.modes.find((item) => item.key === analysisMode) || null;
  const cooldownLabel = useMemo(() => formatCooldownLabel(cooldownRemaining), [cooldownRemaining]);
  const baseReady = (hasText || hasImage) && (!hasImage || consentGiven) && !guestLocked && !cooldownLocked;
  const canSubmit = baseReady && !isAnalyzing;
  const quotaProgress = isLoggedIn ? 100 : clampPercent((guestRemaining / guestLimit) * 100);
  const contextStrength = useMemo(() => getContextStrength(text.trim().length, t), [text, t]);
  const exampleTexts = useMemo(() => {
    const values = t("analyze.examples", { returnObjects: true });
    return Array.isArray(values) ? values : EXAMPLE_TEXTS;
  }, [t, i18n.language]);
  const analysisLoadingSteps = ANALYSIS_LOADING_STEPS;
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
      ...(cooldownLocked
        ? [
            {
              label: copy.checklist.cooldownLabel,
              done: false,
              hint: copy.checklist.cooldownHint(cooldownLabel),
            },
          ]
        : []),
    ],
    [consentGiven, contextStrength.label, copy, cooldownLabel, cooldownLocked, guestLocked, guestRemaining, hasImage, hasText, isLoggedIn],
  );

  useEffect(() => {
    return () => {
      stopCameraStream(videoRef, cameraStreamRef);
    };
  }, []);

  useEffect(() => {
    if (promptedSurveyOnEntryRef.current || isLoggedIn) {
      return;
    }

    promptedSurveyOnEntryRef.current = true;
    if (!getStoredRecommendationSurvey()) {
      setShowOnboardingSurvey(true);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const remaining = guestSessionAPI.getAnalysisCooldownRemainingSeconds();
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        guestSessionAPI.clearAnalysisCooldown();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownRemaining]);

  useEffect(() => {
    if (!isAnalyzing) {
      setLoadingStepIndex(0);
      return undefined;
    }

    setLoadingStepIndex(0);
    const timer = window.setInterval(() => {
      setLoadingStepIndex((current) => (current + 1) % ANALYSIS_LOADING_STEPS.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [isAnalyzing]);

  useEffect(() => {
    if (!contradictionAlert && !analysisAlert) {
      return;
    }

    toast.dismiss("analysis-contradiction-alert");
    toast.dismiss("analysis-user-alert");
    setContradictionAlert(null);
    setAnalysisAlert(null);
  }, [text, imageFile, consentGiven]);

  useEffect(() => {
    if (!isAnalyzing && !isStudioOpen) {
      return undefined;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const previousHtmlOverflow = documentElement.style.overflow;
    const scrollY = window.scrollY;

    documentElement.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isAnalyzing, isStudioOpen]);

  function resetImage() {
    setImageFile(null);
    setImagePreview(null);
    setConsentGiven(false);
    setAnalysisAlert(null);
    stopCameraStream(videoRef, cameraStreamRef);
    setShowCamera(false);
  }

  function validateAndSetFile(file) {
    if (!file) {
      return;
    }

    const fileType = String(file.type || "").toLowerCase().trim();
    if (!ALLOWED_IMAGE_TYPES.includes(fileType)) {
      raiseAnalysisAlert(buildAnalyzeAlertPayload({
        code: "UNSUPPORTED_IMAGE_TYPE",
        message: FRIENDLY_ANALYZE_MESSAGES_TR.unsupportedImageType,
        copy,
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      raiseAnalysisAlert(buildAnalyzeAlertPayload({
        code: "IMAGE_TOO_LARGE",
        message: FRIENDLY_ANALYZE_MESSAGES_TR.imageTooLarge,
        copy,
      }));
      return;
    }

    setError("");
    setAnalysisAlert(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target?.result || null);
    reader.readAsDataURL(file);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      raiseAnalysisAlert(buildAnalyzeAlertPayload({
        code: "INVALID_IMAGE",
        message: t("analyze.errors.cameraUnsupported"),
        title: copy.imageAlertTitle,
        copy,
      }));
      return;
    }

    try {
      stopCameraStream(videoRef, cameraStreamRef);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 960, height: 720 },
      });
      cameraStreamRef.current = stream;
      setShowCamera(true);
      setError("");
      setAnalysisAlert(null);
    } catch {
      raiseAnalysisAlert(buildAnalyzeAlertPayload({
        code: "INVALID_IMAGE",
        message: t("analyze.errors.cameraAccess"),
        title: copy.imageAlertTitle,
        copy,
      }));
    }
  }

  function stopCamera() {
    stopCameraStream(videoRef, cameraStreamRef);
    setShowCamera(false);
  }

  useEffect(() => {
    if (!showCamera || !videoRef.current || !cameraStreamRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    videoElement.srcObject = cameraStreamRef.current;

    const playPromise = videoElement.play?.();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }
  }, [showCamera]);

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
        raiseAnalysisAlert(buildAnalyzeAlertPayload({
          code: "INVALID_IMAGE",
          message: t("analyze.errors.cameraCapture"),
          title: copy.imageAlertTitle,
          copy,
        }));
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

  function openStudio() {
    setIsStudioOpen(true);
  }

  function closeStudio() {
    if (isAnalyzing) {
      return;
    }

    stopCamera();
    setIsStudioOpen(false);
  }

  function clearAnalyzeAlerts() {
    toast.dismiss("analysis-user-alert");
    toast.dismiss("analysis-contradiction-alert");
    setAnalysisAlert(null);
    setContradictionAlert(null);
  }

  function raiseAnalysisAlert(payload, { syncError = true } = {}) {
    setAnalysisAlert(payload);
    setContradictionAlert(null);
    if (syncError) {
      setError(payload.message);
    }
    showAnalysisAlertToast(payload);
  }

  async function handleAnalyze() {
    if (cooldownLocked) {
      clearAnalyzeAlerts();
      raiseAnalysisAlert(buildAnalyzeAlertPayload({
        code: "ANALYSIS_COOLDOWN_ACTIVE",
        message: FRIENDLY_ANALYZE_MESSAGES_TR.conflictCooldown,
        hint: copy.readiness.cooldown(cooldownLabel),
        copy,
      }));
      return;
    }

    if (guestLocked) {
      raiseAnalysisAlert(buildAnalyzeAlertPayload({
        code: "GUEST_QUOTA_EXCEEDED",
        message: FRIENDLY_ANALYZE_MESSAGES_TR.guestQuota,
        copy,
      }));
      openLogin();
      return;
    }

    if (!hasText && !hasImage) {
      raiseAnalysisAlert(buildAnalyzeAlertPayload({
        code: "MISSING_INPUT",
        message: copy.readiness.missingInput,
        title: copy.errorAlertTitle,
        hint: copy.errorAlertHint,
        copy,
      }));
      return;
    }

    if (hasImage && !consentGiven) {
      raiseAnalysisAlert(buildAnalyzeAlertPayload({
        code: "MISSING_CONSENT",
        message: copy.readiness.missingConsent,
        title: copy.errorAlertTitle,
        hint: copy.errorAlertHint,
        copy,
      }));
      return;
    }

    const guestRecommendationSurvey = isLoggedIn ? null : getStoredRecommendationSurvey();
    if (!isLoggedIn && !guestRecommendationSurvey) {
      resumeAnalyzeAfterSurveyRef.current = true;
      setShowOnboardingSurvey(true);
      raiseAnalysisAlert(buildAnalyzeAlertPayload({
        code: "survey_required",
        message: ANALYZE_ERROR_MESSAGE_BY_CODE.survey_required,
        copy,
      }));
      return;
    }

    setIsAnalyzing(true);
    setError("");
    clearAnalyzeAlerts();

    try {
      const imageBase64 = hasImage ? await fileToBase64(imageFile) : "";
      const result = await emotionAPI.analyze({
        imageBase64,
        text: hasText ? text.trim() : "",
        mimeType: hasImage ? imageFile.type || "image/jpeg" : undefined,
        recommendationSurvey: guestRecommendationSurvey || undefined,
      });

      if (typeof result.guestRemainingAnalyses === "number") {
        setGuestRemaining(result.guestRemainingAnalyses);
      }

      if (hasConflictSignal(result)) {
        const alertPayload = buildContradictionAlertPayload(copy);
        setContradictionAlert(alertPayload);
        showContradictionToast(alertPayload);
      }

      if (result.status === "partial") {
        const partialAlertPayload = buildPartialAlertPayload(copy);
        setAnalysisAlert(partialAlertPayload);
        showAnalysisAlertToast(partialAlertPayload);
      }

      guestSessionAPI.clearAnalysisCooldown();
      setCooldownRemaining(0);

      navigate(`/result/${result.historyId}`, {
        state: { analysisResult: result },
      });
    } catch (requestError) {
      if (requestError.code === "GUEST_QUOTA_EXCEEDED") {
        setGuestRemaining(0);
        raiseAnalysisAlert(buildAnalyzeAlertPayload({
          code: requestError.code,
          message: requestError.message || FRIENDLY_ANALYZE_MESSAGES_TR.guestQuota,
          copy,
        }));
        openLogin();
        return;
      }

      if (requestError.code === "ANALYSIS_CONTRADICTION_WARNING") {
        const alertPayload = buildContradictionAlertPayload(copy);
        setError("");
        setAnalysisAlert(null);
        setContradictionAlert(alertPayload);
        showContradictionToast(alertPayload);
        return;
      }

      if (requestError.code === "ANALYSIS_RETRY_COOLDOWN" || requestError.code === "ANALYSIS_COOLDOWN_ACTIVE") {
        const retryAfter = Math.max(1, Number(requestError.retryAfterSeconds) || 60);
        guestSessionAPI.setAnalysisCooldown(retryAfter);
        setCooldownRemaining(retryAfter);
        clearAnalyzeAlerts();
        raiseAnalysisAlert(buildAnalyzeAlertPayload({
          code: requestError.code,
          message: FRIENDLY_ANALYZE_MESSAGES_TR.conflictCooldown,
          copy,
        }));
        return;
      }

      raiseAnalysisAlert(buildAnalyzeAlertPayload({
        code: requestError.code,
        message: requestError.message || t("analyze.errors.analysisFailed"),
        copy,
      }));
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="page-shell aurora-bg app-page-tone">
      <div className="relative z-10 mx-auto max-w-7xl space-y-5 sm:space-y-6">
        <HeroPanel
          copy={copy}
          modeMeta={modeMeta}
          onOpenStudio={openStudio}
          hasText={hasText}
          hasImage={hasImage}
          analysisMode={analysisMode}
        />
      </div>

      <AnimatePresence>
        {isStudioOpen && (
          <StudioModal
            copy={copy}
            analysisMode={analysisMode}
            canSubmit={canSubmit}
            closeStudio={closeStudio}
            consentGiven={consentGiven}
            contextStrength={contextStrength}
            contradictionAlert={contradictionAlert}
            analysisAlert={analysisAlert}
            cooldownLabel={cooldownLabel}
            cooldownLocked={cooldownLocked}
            error={error}
            examplePulse={examplePulse}
            fileInputRef={fileInputRef}
            guestLocked={guestLocked}
            handleAnalyze={handleAnalyze}
            hasImage={hasImage}
            hasText={hasText}
            imageFile={imageFile}
            imagePreview={imagePreview}
            isAnalyzing={isAnalyzing}
            isDragging={isDragging}
            onExample={fillExampleText}
            openLogin={openLogin}
            readinessItems={readinessItems}
            resetImage={resetImage}
            setConsentGiven={setConsentGiven}
            setIsDragging={setIsDragging}
            setText={setText}
            showCamera={showCamera}
            startCamera={startCamera}
            stopCamera={stopCamera}
            capturePhoto={capturePhoto}
            t={t}
            text={text}
            validateAndSetFile={validateAndSetFile}
            videoRef={videoRef}
            canvasRef={canvasRef}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{isAnalyzing && <LoadingOverlay title={copy.overlayTitle} description={copy.overlayDescription} steps={analysisLoadingSteps} activeStepIndex={loadingStepIndex} />}</AnimatePresence>
      {showOnboardingSurvey && (
        <OnboardingSurvey
          onClose={() => {
            resumeAnalyzeAfterSurveyRef.current = false;
            setShowOnboardingSurvey(false);
          }}
          onSurveyComplete={(userProfile) => {
            window.dispatchEvent(new CustomEvent("life-coach:onboarding-complete", { detail: userProfile }));
            setShowOnboardingSurvey(false);
            if (resumeAnalyzeAfterSurveyRef.current) {
              resumeAnalyzeAfterSurveyRef.current = false;
              window.setTimeout(() => {
                void handleAnalyze();
              }, 0);
            }
          }}
        />
      )}
    </div>
  );
}

function HeroPanel({ copy, modeMeta, onOpenStudio, hasText, hasImage, analysisMode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="calm-card studio-hero relative overflow-hidden p-6 sm:p-8"
    >
      <motion.div
        aria-hidden="true"
        className="studio-hero__glow"
        animate={{ x: [0, 24, -12, 0], y: [0, -14, 10, 0], scale: [1, 1.08, 0.98, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_0.82fr] lg:items-center">
        <div>
          <p className="section-eyebrow">{copy.heroEyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl">
            {copy.heroTitle}
            <span className="gradient-text block">{copy.heroGradient}</span>
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{copy.heroDescription}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={onOpenStudio} className="btn-primary text-base sm:min-w-56">
              {copy.openStudioCta}
            </button>
            <span className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-bold text-slate-400">
              {hasText || hasImage ? modeMeta?.summary || copy.emptySummary : copy.openStudioHint}
            </span>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={onOpenStudio}
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="studio-pop-card focus-ring rounded-[1.6rem] border border-white/10 bg-white/[0.055] p-5 text-left"
          aria-label={copy.openStudioCta}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/70">{copy.readinessSignal}</p>
              <p className="mt-2 text-2xl font-black text-white">{copy.flowReady}</p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400">{modeMeta?.summary || copy.emptySummary}</p>
            </div>
            <span className="brand-orb shrink-0" aria-hidden="true">AI</span>
          </div>

          <div className="studio-mini-window mt-5">
            <span className="studio-mini-window__bar" />
            <span className="studio-mini-window__line is-wide" />
            <span className="studio-mini-window__line" />
            <motion.span
              className="studio-mini-window__scan"
              animate={{ y: ["0%", "310%", "0%"] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="mt-4 grid gap-2">
            {copy.userSteps.map((step, index) => (
              <div key={step.title} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/18 px-4 py-3">
                <div className="min-w-0">
                  <span className="text-sm font-black text-white">{step.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{step.description}</span>
                </div>
                <motion.span
                  className="shrink-0 text-lg font-black text-cyan-100"
                  animate={{ x: [0, 7, 0], opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 1.8, delay: index * 0.22, repeat: Infinity, ease: "easeInOut" }}
                  aria-hidden="true"
                >
                  →
                </motion.span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            <span>{copy.modalLikeLabel}</span>
            <span>{analysisMode === "empty" ? copy.modeWaiting : copy.modeLive}</span>
          </div>
        </motion.button>
      </div>
    </motion.section>
  );
}

function StudioLaunchPanel({ copy, modeMeta, hasText, hasImage, canSubmit, readinessMessage, onOpenStudio, t }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.45, ease: "easeOut" }}
      className="studio-launch grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-stretch"
    >
      <div className="calm-card p-5 sm:p-6">
        <p className="section-eyebrow">{copy.launchEyebrow}</p>
        <h2 className="mt-4 text-3xl font-black text-white">{copy.launchTitle}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">{copy.launchDescription}</p>

        <div className="mt-6 space-y-3">
          {copy.userSteps.map((step, index) => (
            <motion.button
              key={step.title}
              type="button"
              onClick={onOpenStudio}
              aria-label={`${copy.openStudioCta}: ${index + 1}`}
              className="focus-ring group w-full rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4 text-left transition hover:border-cyan-200/24"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start gap-3">
                <motion.span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-200/12 text-sm font-black text-cyan-100"
                  animate={{ y: [0, -4, 0], scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.7, delay: index * 0.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {index + 1}
                </motion.span>
                <div>
                  <p className="text-sm font-black text-white">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{step.description}</p>
                </div>
              </div>
              <motion.span
                className="mt-3 block h-1 rounded-full bg-gradient-to-r from-cyan-300 to-teal-300"
                initial={{ width: "18%" }}
                animate={{ width: `${42 + index * 18}%` }}
                transition={{ duration: 0.65, ease: "easeOut" }}
              />
            </motion.button>
          ))}
        </div>
      </div>

      <div className="calm-card relative overflow-hidden p-5 sm:p-6">
        <motion.div
          aria-hidden="true"
          className="absolute right-0 top-0 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl"
          animate={{ scale: [1, 1.16, 1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative flex flex-col gap-5 lg:h-full lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/70">{copy.launchPreviewEyebrow}</p>
            <h3 className="mt-3 text-2xl font-black text-white">{modeMeta?.label || copy.launchPreviewTitle}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{readinessMessage}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {copy.launchCards.map((card, index) => (
              <motion.div
                key={card.title}
                className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-4"
                animate={{ y: [0, index % 2 === 0 ? -6 : 6, 0] }}
                transition={{ duration: 4 + index * 0.35, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="brand-orb !h-9 !w-9 !rounded-xl" aria-hidden="true">{card.marker}</span>
                <p className="mt-4 font-black text-white">{card.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{card.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-[1.35rem] border border-white/10 bg-slate-950/18 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-white">
                {canSubmit ? t("analyze.actionReady") : hasText || hasImage ? copy.launchContinueTitle : copy.launchEmptyTitle}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{copy.launchEmptyDescription}</p>
            </div>
            <button type="button" onClick={onOpenStudio} className="btn-primary !min-h-0 !px-5 !py-3">
              {copy.openStudioCta}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function StudioModal({
  copy,
  analysisMode,
  canSubmit,
  closeStudio,
  consentGiven,
  contextStrength,
  contradictionAlert,
  analysisAlert,
  cooldownLabel,
  cooldownLocked,
  error,
  examplePulse,
  fileInputRef,
  guestLocked,
  handleAnalyze,
  hasImage,
  hasText,
  imageFile,
  imagePreview,
  isAnalyzing,
  isDragging,
  openLogin,
  onExample,
  readinessItems,
  resetImage,
  setConsentGiven,
  setIsDragging,
  setText,
  showCamera,
  startCamera,
  stopCamera,
  capturePhoto,
  t,
  text,
  validateAndSetFile,
  videoRef,
  canvasRef,
}) {
  const readinessMessage = getReadinessMessage({ hasText, hasImage, consentGiven, guestLocked, cooldownLocked, cooldownLabel, copy });
  const visibleAnalysisAlert = contradictionAlert || analysisAlert;

  return (
    <motion.div
      className="studio-modal fixed inset-0 z-[70] flex items-center justify-center px-2 py-2 sm:px-4 sm:py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="presentation"
    >
      <motion.button
        type="button"
        className="absolute inset-0 bg-slate-950/72 backdrop-blur-xl"
        onClick={closeStudio}
        aria-label={copy.closeStudioLabel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label={copy.studioModalTitle}
        className="studio-dialog relative z-10 flex h-[calc(100svh-1rem)] w-full max-w-[96rem] flex-col overflow-hidden rounded-[1.2rem] border border-white/12 bg-slate-950/88 shadow-[0_30px_100px_rgba(2,6,23,0.46)] backdrop-blur-2xl sm:h-[calc(100svh-2rem)] lg:rounded-[1.35rem]"
        initial={{ opacity: 0, y: 34, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 26, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <div className="studio-dialog__header grid shrink-0 gap-3 border-b border-white/10 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="section-eyebrow !px-3 !py-1.5">{copy.studioModalEyebrow}</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">{copy.studioModalTitle}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{copy.studioModalDescription}</p>
          </div>
          <button type="button" onClick={closeStudio} className="btn-secondary w-full !min-h-0 !px-4 !py-2 sm:w-auto">
            {copy.closeStudioLabel}
          </button>
        </div>

        <div className="studio-dialog__body min-h-0 flex-1 overflow-hidden p-3 sm:p-4 lg:p-5">
          <div className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-y-auto pr-1 xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.84fr)_minmax(18rem,0.68fr)] xl:overflow-hidden xl:pr-0">
            <div className="min-h-0 space-y-4 xl:overflow-y-auto xl:pr-1">
              <ComposerPanel
                text={text}
                onChange={setText}
                onExample={onExample}
                contextStrength={contextStrength}
                examplePulse={examplePulse}
                copy={copy}
                t={t}
              />

              <ModeCards copy={copy} analysisMode={analysisMode} />
            </div>

            <div className="min-h-0 space-y-4 xl:overflow-y-auto xl:pr-1">
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
            </div>

            <div className="min-h-0 space-y-4 xl:overflow-y-auto xl:pr-1">
              <ChecklistPanel items={readinessItems} title={copy.checklist.title} />

              <AnimatePresence>
                {visibleAnalysisAlert && (
                  <ContradictionAlertPanel
                    title={visibleAnalysisAlert.title}
                    message={visibleAnalysisAlert.message}
                    hint={visibleAnalysisAlert.hint}
                    tone={visibleAnalysisAlert.tone}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && !visibleAnalysisAlert && (
                  <ErrorPanel
                    error={error}
                    guestLocked={guestLocked}
                    cooldownLocked={cooldownLocked}
                    cooldownLabel={cooldownLabel}
                    errorTitle={cooldownLocked ? copy.cooldownTitle : guestLocked ? t("analyze.errorLoginRequired") : t("analyze.errorSmallMissing")}
                    onLogin={openLogin}
                    t={t}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 p-3 sm:p-4">
          <ActionBar
            canSubmit={canSubmit}
            isAnalyzing={isAnalyzing}
            guestLocked={guestLocked}
            cooldownLocked={cooldownLocked}
            cooldownLabel={cooldownLabel}
            readinessMessage={readinessMessage}
            onAnalyze={guestLocked ? openLogin : handleAnalyze}
            copy={copy}
            t={t}
            variant="modal"
          />
        </div>
      </motion.section>
    </motion.div>
  );
}

function GuestQuotaPanel({ isLoggedIn, guestRemaining, guestLimit, quotaProgress, guestLocked, onLogin, t }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className={`surface-panel-strong p-5 ${guestLocked ? "border-amber-200/30 bg-amber-300/10" : ""}`}
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
      className="premium-card premium-card-hover p-4 sm:p-5"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-eyebrow !px-3 !py-1.5">{copy.composerEyebrow}</p>
          <h2 className="mt-3 text-xl font-black text-white">{copy.composerTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{copy.composerDescription}</p>
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
        className="input-field min-h-[10rem] resize-none !rounded-[1.35rem] !p-4 text-base leading-7 sm:min-h-[12rem] 2xl:min-h-[14rem]"
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      className="premium-card premium-card-hover p-4 sm:p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow !px-3 !py-1.5">{copy.modeEyebrow}</p>
          <h2 className="mt-3 text-xl font-black text-white">{copy.modeTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{copy.modeDescription}</p>
        </div>
        <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-100">
          {analysisMode === "empty" ? copy.modeWaiting : copy.modeLive}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {copy.modes.map((mode) => {
          const active = mode.key === analysisMode;
          return (
            <div
              key={mode.key}
              className={`rounded-[1.25rem] border p-3 transition ${
                active ? "border-cyan-200/30 bg-cyan-200/10 shadow-xl shadow-cyan-950/10" : "border-white/10 bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black text-white">{mode.label}</span>
                <span className="rounded-full border border-white/10 bg-slate-950/35 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                  {mode.marker}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{mode.description}</p>
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
      className="premium-card p-4 sm:p-5"
    >
      <div className="mb-4">
        <p className="section-eyebrow !px-3 !py-1.5">{copy.selfieEyebrow}</p>
        <h2 className="mt-3 text-xl font-black text-white">{copy.selfieTitle}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">{copy.selfieDescription}</p>
      </div>

      {imagePreview ? (
        <div className="relative overflow-hidden rounded-[1.45rem] border border-cyan-200/25">
          <img src={imagePreview} alt={copy.selfieReady} className="h-60 w-full object-cover 2xl:h-72" />
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
            <video ref={videoRef} autoPlay playsInline muted className="h-60 w-full object-cover 2xl:h-72" />
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
          className={`focus-ring relative flex min-h-60 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.45rem] border-2 border-dashed px-5 text-center transition-all 2xl:min-h-72 ${
            isDragging ? "border-cyan-200 bg-cyan-200/10 shadow-2xl shadow-cyan-950/25" : "border-white/15 bg-white/[0.05] hover:border-cyan-200/45"
          }`}
          aria-label={t("analyze.uploadAria")}
        >
          <ScanOverlay subtle />
          <span className="orb mb-4 h-14 w-14" aria-hidden="true">
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
      className={`flex cursor-pointer items-start gap-4 rounded-[1.25rem] border p-4 transition-all ${
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
    <section className="surface-panel rounded-[1.25rem] p-4">
      <h2 className="text-lg font-black text-white">{title}</h2>
      <div className="mt-3 space-y-2.5">
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
              <span className="line-clamp-2 text-xs leading-5 text-slate-500">{item.hint}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ErrorPanel({ error, guestLocked, cooldownLocked, cooldownLabel, errorTitle, onLogin, t }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-[1.5rem] p-5 ${
        cooldownLocked
          ? "border border-amber-200/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(15,23,42,0.92))] shadow-[0_20px_70px_rgba(245,158,11,0.12)]"
          : "border border-red-300/20 bg-red-400/10"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-black ${
              cooldownLocked
                ? "border border-amber-100/35 bg-amber-200/14 text-amber-100"
                : "border border-red-100/20 bg-red-300/10 text-red-50"
            }`}
          >
            {cooldownLocked ? "!" : "x"}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className={cooldownLocked ? "text-sm font-black uppercase tracking-[0.18em] text-amber-100" : "text-sm font-black text-red-50"}>
                {errorTitle}
              </p>
              {cooldownLocked && (
                <span className="rounded-full bg-amber-200 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-950">
                  {cooldownLabel}
                </span>
              )}
            </div>
            <p className={`mt-1 text-sm leading-6 ${cooldownLocked ? "text-amber-50/92" : "text-red-100/85"}`}>{error}</p>
          </div>
        </div>
        {guestLocked && !cooldownLocked && (
          <button type="button" onClick={onLogin} className="btn-primary self-start !px-4 !py-2 sm:self-auto">
            {t("actions.login")}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ContradictionAlertPanel({ title, message, hint, tone = "warning" }) {
  const isError = tone === "error";
  const isSuccess = tone === "success";
  const shellClass = isSuccess
    ? "border-emerald-200/35 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(15,23,42,0.96))] shadow-[0_24px_80px_rgba(16,185,129,0.14)]"
    : isError
      ? "border-red-200/35 bg-[linear-gradient(135deg,rgba(248,113,113,0.18),rgba(15,23,42,0.96))] shadow-[0_24px_80px_rgba(248,113,113,0.14)]"
      : "border-amber-200/35 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(15,23,42,0.96))] shadow-[0_24px_80px_rgba(251,191,36,0.14)]";
  const markerClass = isSuccess
    ? "border-emerald-100/40 bg-emerald-200/16 text-emerald-50"
    : isError
      ? "border-red-100/30 bg-red-300/14 text-red-50"
      : "border-amber-100/40 bg-amber-200/16 text-amber-50";
  const titleClass = isSuccess ? "text-emerald-100" : isError ? "text-red-100" : "text-amber-100";
  const bodyClass = isSuccess ? "text-emerald-50/95" : isError ? "text-red-50/92" : "text-amber-50/95";
  const badgeClass = isSuccess ? "bg-emerald-200 text-slate-950" : isError ? "bg-red-200 text-slate-950" : "bg-amber-200 text-slate-950";
  const badgeLabel = isSuccess ? "Bilgi" : isError ? "Uyari" : "Dikkat";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-[1.7rem] border p-5 ${shellClass}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg font-black ${markerClass}`}>
            {isError ? "x" : "!"}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-sm font-black uppercase tracking-[0.18em] ${titleClass}`}>{title}</p>
              <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${badgeClass}`}>
                {badgeLabel}
              </span>
            </div>
            <p className={`mt-2 text-sm leading-6 ${bodyClass}`}>{message}</p>
            {hint && (
              <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs leading-6 text-slate-200">
                {hint}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ActionBar({ canSubmit, isAnalyzing, guestLocked, cooldownLocked, cooldownLabel, readinessMessage, onAnalyze, copy, t, variant = "page" }) {
  const isModal = variant === "modal";

  return (
    <section className={isModal ? "p-0" : "premium-card sticky bottom-[6.65rem] z-20 p-4 sm:bottom-6 lg:static lg:p-5"}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-white">
            {canSubmit
              ? t("analyze.actionReady")
              : cooldownLocked
                ? copy.cooldownTitle
                : guestLocked
                  ? t("analyze.actionLoginRequired")
                  : t("analyze.actionFinalChecks")}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{readinessMessage}</p>
        </div>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing || (!canSubmit && !guestLocked)}
          aria-busy={isAnalyzing}
          className={`btn-primary w-full text-base lg:w-auto lg:min-w-72 ${isModal ? "!py-3" : "!py-4"}`}
        >
          {isAnalyzing
            ? t("analyze.analyzing")
            : cooldownLocked
              ? copy.cooldownCta(cooldownLabel)
              : guestLocked
                ? t("analyze.continueWithLogin")
                : t("actions.startAnalysis")}
        </button>
      </div>
    </section>
  );
}

function LoadingOverlay({ title, description, steps, activeStepIndex = 0 }) {
  const currentStep = steps[activeStepIndex % steps.length] || description;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden overscroll-none bg-slate-950/72 px-4 py-4 backdrop-blur-xl"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -10 }}
        className="premium-card max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-hidden p-6 text-center sm:p-7"
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
        <p className="mt-2 text-sm leading-6 text-slate-400">{currentStep}</p>
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
      heroTitle: "Tell us how today feels.",
      heroGradient: "We will turn it into a clear result.",
      heroDescription: "Open the studio, add a short note or a selfie, and get mood-based suggestions without extra explanation.",
      readinessSignal: "What happens next",
      flowReady: "A guided analysis moment",
      emptySummary: "Start with one simple action: open the studio and add what feels easiest.",
      heroSignals: ["Open the studio", "Add your input", "Get your result"],
      openStudioCta: "Open analysis studio",
      openStudioHint: "No form pressure. The studio opens only when you choose it.",
      modalLikeLabel: "Pop-up studio",
      launchEyebrow: "Your path",
      launchTitle: "First see what you will do",
      launchDescription: "The page shows the user journey first. When the user is ready, the studio opens and the analysis starts from there.",
      launchPreviewEyebrow: "Preview",
      launchPreviewTitle: "Ready when you are",
      launchContinueTitle: "Inputs are ready",
      launchEmptyTitle: "Start when ready",
      launchEmptyDescription: "Open the studio, add a note or selfie, then start the analysis.",
      userSteps: [
        { title: "Open the studio", description: "A focused panel appears on the screen." },
        { title: "Write or add a selfie", description: "One input is enough; both can be used too." },
        { title: "Start analysis", description: "The result and recommendations are prepared together." },
      ],
      launchCards: [
        { marker: "1", title: "Open", description: "The studio appears." },
        { marker: "2", title: "Add", description: "Share what you want." },
        { marker: "3", title: "Receive", description: "See useful suggestions." },
      ],
      studioModalEyebrow: "Focused studio",
      studioModalTitle: "Add your input here",
      studioModalDescription: "Add only what you want: a short note, a selfie, or both.",
      closeStudioLabel: "Close",
      composerEyebrow: "Emotion journal",
      composerTitle: "Write what you feel",
      composerDescription: "A short sentence is enough. You do not need to explain everything.",
      modeEyebrow: "Choice",
      modeTitle: "Choose a flexible flow",
      modeDescription: "Use text, selfie, or both. Choose whichever feels natural.",
      modeWaiting: "waiting",
      modeLive: "live",
      selfieEyebrow: "Selfie signal",
      selfieTitle: "Add a selfie if you want",
      selfieDescription: "A selfie is optional. Use it only if it helps you express the moment.",
      selfieReady: "Selfie ready",
      dropTitle: "Drag, drop, or click",
      dropDescription: "Add a selfie or keep going with text only.",
      consentTitle: "Privacy consent",
      consentDescription: "I allow my image to be used only for emotion analysis and not stored as a permanent gallery asset.",
      checklist: {
        title: "Analysis readiness",
        textLabel: "Text context",
        textHint: "Optional, but helpful.",
        imageLabel: "Selfie signal",
        imageHint: "Optional.",
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
        cooldownLabel: "Retry window",
        cooldownHint: (label) => `This flow is paused for ${label}.`,
      },
      readiness: {
        missingInput: "Start with a selfie, a text entry, or both together.",
        missingConsent: "Please confirm privacy consent before using a selfie.",
        readyText: "Text is ready. You can start the analysis.",
        readyImage: "Selfie is ready. You can start the analysis.",
        readyMultimodal: "Text and selfie are ready. You can start the analysis.",
        locked: "Guest quota is finished. Sign in to continue.",
        cooldown: (label) => `The selfie and text stayed contradictory. Please wait ${label} before trying again.`,
      },
      modes: [
        {
          key: "image",
          marker: "IMG",
          label: "Selfie only",
          description: "Use a selfie when your expression says enough.",
          summary: "This run starts from your selfie and then opens recommendations.",
          steps: ["Your selfie is being checked", "Your mood is being summarized", "Recommendations are being prepared"],
        },
        {
          key: "text",
          marker: "TXT",
          label: "Text only",
          description: "Use text when you want to describe the moment.",
          summary: "This run starts from your written note.",
          steps: ["Your note is being read", "Your mood is being summarized", "Recommendations are being prepared"],
        },
        {
          key: "multimodal",
          marker: "MIX",
          label: "Selfie + text",
          description: "Use both when you want the fullest result.",
          summary: "This run uses your selfie and note together.",
          steps: ["Your inputs are being checked", "Your mood is being summarized", "Recommendations are being prepared"],
        },
      ],
      defaultSteps: ["Your input is being checked", "Your mood is being summarized", "Recommendations are being prepared"],
      overlayTitle: "Preparing your analysis",
      overlayDescription: "We are turning your input into a clear result and useful suggestions.",
      contradictionAlertTitle: "Contradictory emotion detected",
      contradictionAlertMessage: "Your selfie and text point to opposite emotions. Are you sure this matches how you feel?",
      contradictionAlertHint: "If you retry, the system will verify the result with another analysis key.",
      imageAlertTitle: "Photo needs attention",
      imageAlertHint: "Update the selfie and start the analysis again when it is ready.",
      surveyAlertTitle: "Short survey required",
      surveyAlertHint: "Complete the survey once, then the analysis will continue with your preferences.",
      quotaAlertTitle: "Guest limit reached",
      quotaAlertHint: "Create a free account to continue and keep your analysis history.",
      errorAlertTitle: "Analysis could not continue",
      errorAlertHint: "Check the message above and try again.",
      partialAlertTitle: "Analysis completed partially",
      partialAlertHint: "Your mood result is ready; some recommendation providers can be retried later.",
      cooldownAlertHint: "Wait one minute before starting a new check.",
      genericAlertMessage: "Something went wrong during analysis. Please try again.",
      cooldownTitle: "One-minute cooldown active",
      cooldownCta: (label) => `Wait ${label}`,
    };
  }

  return {
    heroEyebrow: "Analiz Stüdyosu",
    heroTitle: "Bugün nasıl hissettiğini anlat.",
    heroGradient: "Biz sonucu sadeleştirelim.",
    heroDescription: "Stüdyoyu aç, kısa bir not yaz veya selfie ekle. Teknik rapor okumadan ruh halini ve sana uygun önerileri gör.",
    readinessSignal: "Sırada ne var?",
    flowReady: "Yönlendirmeli analiz anı",
    emptySummary: "Tek yapman gereken stüdyoyu açıp sana kolay gelen girdiyi eklemek.",
    heroSignals: ["Stüdyoyu aç", "Girdini ekle", "Sonucu gör"],
    openStudioCta: "Analiz stüdyosunu aç",
    openStudioHint: "Form baskısı yok. Stüdyo sadece sen isteyince açılır.",
    modalLikeLabel: "Pop-up stüdyo",
    launchEyebrow: "Yolun",
    launchTitle: "Önce ne yapacağını gör",
    launchDescription: "Sayfa önce kullanıcı yolunu gösterir. Hazır olduğunda stüdyo açılır ve analiz oradan başlar.",
    launchPreviewEyebrow: "Ön izleme",
    launchPreviewTitle: "Hazır olduğunda başla",
    launchContinueTitle: "Girdiler hazır",
    launchEmptyTitle: "Hazır olunca başla",
    launchEmptyDescription: "Stüdyoyu aç, notunu veya selfieni ekle, sonra analizi başlat.",
    userSteps: [
      { title: "Stüdyoyu aç", description: "Ekranda odaklı bir analiz paneli belirir." },
      { title: "Yaz veya selfie ekle", description: "Tek girdi yeterli; istersen ikisini birlikte kullan." },
      { title: "Analizi başlat", description: "Ruh hali sonucu ve öneriler birlikte hazırlanır." },
    ],
    launchCards: [
      { marker: "1", title: "Aç", description: "Stüdyo ekrana gelir." },
      { marker: "2", title: "Ekle", description: "İstediğini paylaş." },
      { marker: "3", title: "Al", description: "Önerilerini gör." },
    ],
    studioModalEyebrow: "Odak stüdyosu",
    studioModalTitle: "Girdini burada ekle",
    studioModalDescription: "İstersen kısa bir not, istersen selfie, istersen ikisini birlikte kullan.",
    closeStudioLabel: "Kapat",
    composerEyebrow: "Duygu günlüğü",
    composerTitle: "Ne hissettiğini yaz",
    composerDescription: "Bir cümle bile yeter. Her şeyi uzun uzun anlatmana gerek yok.",
    modeEyebrow: "Seçim",
    modeTitle: "Esnek bir akış seç",
    modeDescription: "Metin, selfie ya da ikisi. Sana hangisi kolay geliyorsa onu seç.",
    modeWaiting: "bekliyor",
    modeLive: "hazır",
    selfieEyebrow: "Selfie sinyali",
    selfieTitle: "İstersen selfie ekle",
    selfieDescription: "Selfie zorunlu değil. O anı daha iyi anlatıyorsa kullan.",
    selfieReady: "Selfie hazır",
    dropTitle: "Sürükle, bırak veya tıkla",
    dropDescription: "Selfie ekleyebilir ya da sadece metinle devam edebilirsin.",
    consentTitle: "Mahremiyet onayı",
    consentDescription: "Görselimin yalnızca duygu analizi için kullanılmasına ve kalıcı galeri mantığında saklanmamasına onay veriyorum.",
    checklist: {
      title: "Analiz hazırlığı",
      textLabel: "Metin bağlamı",
      textHint: "Zorunlu değil; ama faydalı.",
      imageLabel: "Selfie sinyali",
      imageHint: "Zorunlu değil.",
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
      cooldownLabel: "Bekleme penceresi",
      cooldownHint: (label) => `Bu akış ${label} boyunca beklemede.`,
    },
    readiness: {
      missingInput: "Selfie, metin ya da ikisini birlikte ekleyerek analizi başlat.",
      missingConsent: "Selfie kullanmadan önce mahremiyet onayını işaretle.",
      readyText: "Metin hazır. Analizi başlatabilirsin.",
      readyImage: "Selfie hazır. Analizi başlatabilirsin.",
      readyMultimodal: "Metin ve selfie hazır. Analizi başlatabilirsin.",
      locked: "Misafir hakkın doldu. Devam etmek için giriş yapman gerekiyor.",
      cooldown: (label) => `Selfie ve metin çelişkisi yüzünden akış kilitlendi. Lütfen ${label} bekleyip tekrar dene.`,
    },
    modes: [
      {
        key: "image",
        marker: "IMG",
        label: "Sadece selfie",
        description: "Yüz ifaden yeterliyse selfie ile ilerle.",
        summary: "Bu akış selfie ile başlar ve önerilere gider.",
        steps: ["Selfien kontrol ediliyor", "Ruh halin özetleniyor", "Öneriler hazırlanıyor"],
      },
      {
        key: "text",
        marker: "TXT",
        label: "Sadece metin",
        description: "Kendini yazarak anlatmak istiyorsan metinle ilerle.",
        summary: "Bu akış yazdığın notla başlar.",
        steps: ["Notun okunuyor", "Ruh halin özetleniyor", "Öneriler hazırlanıyor"],
      },
      {
        key: "multimodal",
        marker: "MIX",
        label: "Selfie + metin",
        description: "Daha dolu bir sonuç için metin ve selfieyi birlikte kullan.",
        summary: "Bu akış notunu ve selfieni birlikte kullanır.",
        steps: ["Girdilerin kontrol ediliyor", "Ruh halin özetleniyor", "Öneriler hazırlanıyor"],
      },
    ],
    defaultSteps: ["Girdin kontrol ediliyor", "Ruh halin özetleniyor", "Öneriler hazırlanıyor"],
    overlayTitle: "Analizin hazırlanıyor",
    overlayDescription: "Girdini sade bir sonuca ve işe yarar önerilere çeviriyoruz.",
    contradictionAlertTitle: "Zit duygu tespiti",
    contradictionAlertMessage: "Selfie ve metin birbirine zıt görünüyor. Duygu durumundan emin misin?",
    contradictionAlertHint: "Tekrar denersen sistemi farkli bir analiz anahtariyla yeniden kontrol edecegiz.",
    cooldownTitle: "1 dakikalık bekleme aktif",
    imageAlertTitle: "FotoÄŸraf kontrol edilmeli",
    imageAlertHint: "Selfieni gÃ¼ncelleyip hazÄ±r olduÄŸunda analizi yeniden baÅŸlatabilirsin.",
    surveyAlertTitle: "KÄ±sa anket gerekli",
    surveyAlertHint: "Anketi bir kez doldurduÄŸunda analiz tercihlerinle devam edecek.",
    quotaAlertTitle: "Misafir hakkÄ± doldu",
    quotaAlertHint: "Devam etmek ve geÃ§miÅŸini saklamak iÃ§in Ã¼cretsiz hesap oluÅŸturabilirsin.",
    errorAlertTitle: "Analiz devam edemedi",
    errorAlertHint: "YukarÄ±daki mesajÄ± kontrol edip tekrar deneyebilirsin.",
    partialAlertTitle: "Analiz kÄ±smi tamamlandÄ±",
    partialAlertHint: "Duygu sonucun hazÄ±r; bazÄ± Ã¶neriler daha sonra tekrar getirilebilir.",
    cooldownAlertHint: "Yeni kontrol iÃ§in 1 dakika beklemen gerekiyor.",
    genericAlertMessage: "Analiz sÄ±rasÄ±nda bir sorun oluÅŸtu. LÃ¼tfen tekrar dene.",
    cooldownCta: (label) => `${label} bekle`,
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

function getReadinessMessage({ hasText, hasImage, consentGiven, guestLocked, cooldownLocked, cooldownLabel, copy }) {
  if (cooldownLocked) {
    return copy.readiness.cooldown(cooldownLabel);
  }

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

function formatCooldownLabel(totalSeconds) {
  const normalized = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(normalized / 60);
  const seconds = normalized % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function stopCameraStream(videoRef, streamRef = null) {
  const activeStream = streamRef?.current || videoRef.current?.srcObject || null;

  if (activeStream?.getTracks) {
    activeStream.getTracks().forEach((track) => track.stop());
  }

  if (videoRef.current?.srcObject) {
    videoRef.current.srcObject = null;
  }

  if (streamRef) {
    streamRef.current = null;
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

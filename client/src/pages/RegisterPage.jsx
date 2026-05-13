import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { OnboardingSurvey, getStoredOnboardingProfile, getStoredRecommendationSurvey } from "../features/onboarding";
import { authAPI, guestSessionAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const from = location.state?.from || "/analyze";
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [surveyPayload, setSurveyPayload] = useState(() => getStoredRecommendationSurvey());
  const [surveyProfile, setSurveyProfile] = useState(() => getStoredOnboardingProfile());
  const [showSurvey, setShowSurvey] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverCode, setServerCode] = useState("");

  const accountBenefits = t("auth.registerBenefits", { returnObjects: true });
  const guestRemaining = guestSessionAPI.getGuestRemainingAnalyses();
  const guestLimit = guestSessionAPI.getDefaultGuestLimit();
  const guestUsed = Math.max(0, guestLimit - guestRemaining);
  const passwordStrength = useMemo(() => getPasswordStrength(form.password, t), [form.password, t]);
  const passwordsMatch = form.passwordConfirm.length > 0 && form.password === form.passwordConfirm;
  const hasCompletedSurvey = hasSurveyPayload(surveyPayload);

  function validate() {
    const nextErrors = {};
    const normalizedUsername = form.username.trim();
    const normalizedEmail = form.email.trim();
    if (!normalizedUsername || normalizedUsername.length < 3 || normalizedUsername.length > 50 || !/^[A-Za-z0-9._-]+$/.test(normalizedUsername)) {
      nextErrors.username = t("auth.validation.username");
    }
    if (!normalizedEmail || normalizedEmail.length > 100 || !isEmailFormatValid(normalizedEmail)) {
      nextErrors.email = t("auth.validation.email");
    }
    if (!form.password || form.password.length < 6 || form.password.length > 72) {
      nextErrors.password = t("auth.validation.password");
    }
    if (form.password !== form.passwordConfirm) nextErrors.passwordConfirm = t("auth.validation.passwordConfirm");
    if (!hasCompletedSurvey) nextErrors.survey = t("auth.validation.surveyRequired", { defaultValue: "Anketi doldurmadan kayıt tamamlanamaz." });
    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }
    setIsLoading(true);
    setErrors({});
    setServerCode("");
    try {
      const data = await authAPI.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        recommendationSurvey: surveyPayload,
      });
      login(data.user, data.token);
      toast.success(t("auth.registerSuccess"));
      navigate(from, { replace: true });
    } catch (err) {
      const nextErrors = {};
      const code = err?.code || "";
      setServerCode(code);

      if (code === "EMAIL_IN_USE" || code === "INVALID_EMAIL") {
        nextErrors.email = err.message || t("auth.validation.email");
      } else if (code === "USERNAME_IN_USE" || code === "INVALID_USERNAME") {
        nextErrors.username = err.message || t("auth.validation.username");
      } else if (code === "INVALID_PASSWORD") {
        nextErrors.password = err.message || t("auth.validation.password");
      } else if (code === "INVALID_RECOMMENDATION_GOAL") {
        nextErrors.survey = err.message || t("auth.validation.recommendationGoal");
      } else if (code === "INVALID_ENERGY_PREFERENCE") {
        nextErrors.survey = err.message || t("auth.validation.energyPreference");
      } else if (code === "INVALID_MUSIC_GENRES") {
        nextErrors.survey = err.message || t("auth.validation.musicGenres");
      } else if (code === "INVALID_MOVIE_GENRES") {
        nextErrors.survey = err.message || t("auth.validation.movieGenres");
      } else if (code === "INVALID_BOOK_GENRES" || code === "SURVEY_REQUIRED") {
        nextErrors.survey = err.message || t("auth.validation.surveyRequired", { defaultValue: "Anketi doldurmadan kayıt tamamlanamaz." });
      } else {
        nextErrors.general = err.message || t("auth.registerFailed");
      }

      if (code === "EMAIL_IN_USE") {
        nextErrors.general = t("auth.registerEmailInUseHint");
      }

      setErrors(nextErrors);
    } finally {
      setIsLoading(false);
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key] || errors.general || serverCode) {
      setErrors((current) => ({ ...current, [key]: "", general: "" }));
      setServerCode("");
    }
  }

  function handleSurveyComplete(userProfile, recommendationSurvey) {
    const completedSurvey = recommendationSurvey || getStoredRecommendationSurvey();
    setSurveyPayload(completedSurvey);
    setSurveyProfile(userProfile || getStoredOnboardingProfile());
    setShowSurvey(false);
    window.dispatchEvent(new CustomEvent("life-coach:onboarding-complete", { detail: userProfile }));
    if (errors.survey || errors.general || serverCode) {
      setErrors((current) => ({ ...current, survey: "", general: "" }));
      setServerCode("");
    }
    toast.success(t("auth.survey.completed", { defaultValue: "Anket tamamlandı." }));
  }

  return (
    <div className="auth-page page-shell aurora-bg flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className="surface-panel-strong grid w-full max-w-6xl overflow-hidden lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="soft-grid-bg relative hidden overflow-hidden border-r border-white/10 p-8 lg:block">
          <div className="absolute -top-28 right-0 h-80 w-80 rounded-full bg-teal-300/12 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-indigo-300/12 blur-3xl" />
          <div className="relative">
            <p className="section-eyebrow">{t("auth.registerEyebrow")}</p>
            <h2 className="mt-7 text-5xl font-black leading-tight text-white">{t("auth.registerTitle")}</h2>
            <p className="mt-5 text-base leading-8 text-slate-300">{t("auth.registerDescription")}</p>
            <div className="mt-8 grid gap-3">
              {accountBenefits.map((benefit, index) => (
                <div key={benefit} className="surface-panel rounded-[1.45rem] p-4">
                  <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-300/15 text-xs font-black text-emerald-100">✓</span><span className="text-sm font-bold leading-6 text-white">{benefit}</span></div>
                  {index === 0 && guestUsed > 0 && <p className="mt-2 pl-12 text-xs text-slate-400">{t("auth.registerGuestReady", { count: guestUsed })}</p>}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-3xl border border-amber-200/20 bg-amber-200/10 p-5 shadow-[0_16px_42px_rgba(245,158,11,0.08)]"><p className="text-sm font-black text-amber-50">{t("auth.registerTrialTitle", { limit: guestLimit })}</p><p className="mt-2 text-sm leading-6 text-amber-50/75">{t("auth.registerTrialDescription")}</p></div>
          </div>
        </aside>

        <div className="p-6 sm:p-9 lg:p-10">
          <div className="mb-8 text-center"><span className="orb mx-auto h-16 w-16" aria-hidden="true"><span className="relative z-10 h-3 w-3 rounded-full bg-cyan-100" /></span><h1 className="mt-5 text-3xl font-black text-white">{t("auth.registerHeading")}</h1><p className="mt-2 text-sm leading-6 text-slate-400">{t("auth.registerSubheading")}</p></div>
          {errors.general && <AuthError title={t("auth.registerErrorTitle")} message={errors.general} />}
          {serverCode === "EMAIL_IN_USE" && (
            <div className="mb-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-cyan-50">
              <p className="font-black">{t("auth.accountExistsTitle")}</p>
              <p className="mt-1 leading-6 text-cyan-100/85">{t("auth.accountExistsDescription")}</p>
              <Link to="/login" state={{ from }} className="mt-3 inline-flex rounded-2xl bg-cyan-200/15 px-4 py-2 text-sm font-black text-cyan-100 hover:bg-cyan-200/20">
                {t("actions.login")}
              </Link>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field id="register-username" label={t("forms.username")} value={form.username} onChange={(value) => updateField("username", value)} placeholder="kullaniciadi" error={errors.username} autoComplete="username" />
            <Field id="register-email" label={t("forms.email")} type="email" value={form.email} onChange={(value) => updateField("email", value)} placeholder={t("forms.emailPlaceholder")} error={errors.email} autoComplete="email" />
            <Field id="register-password" label={t("forms.password")} type="password" value={form.password} onChange={(value) => updateField("password", value)} placeholder={t("forms.passwordMin")} error={errors.password} autoComplete="new-password" />
            <PasswordStrength strength={passwordStrength} label={t("auth.passwordStrength")} />
            <Field id="register-password-confirm" label={t("forms.passwordConfirm")} type="password" value={form.passwordConfirm} onChange={(value) => updateField("passwordConfirm", value)} placeholder={t("forms.passwordDots")} error={errors.passwordConfirm} autoComplete="new-password" hint={passwordsMatch ? t("auth.passwordMatch") : ""} />
            <SurveyGate
              completed={hasCompletedSurvey}
              error={errors.survey}
              onOpen={() => setShowSurvey(true)}
            />
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-xs leading-6 text-slate-400">{t("auth.registerPrivacy")}</div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full !py-4 text-base">{isLoading ? <ButtonLoading label={t("auth.registerLoading")} /> : t("actions.register")}</button>
          </form>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center text-sm text-slate-400">{t("auth.haveAccount")} <Link to="/login" state={{ from }} className="font-black text-cyan-100 hover:underline">{t("actions.login")}</Link></div>
        </div>
      </motion.div>
      {showSurvey && (
        <OnboardingSurvey
          initialProfile={hasCompletedSurvey ? surveyProfile : null}
          restartFromProfile={hasCompletedSurvey}
          onClose={() => setShowSurvey(false)}
          onSurveyComplete={handleSurveyComplete}
        />
      )}
    </div>
  );
}

function Field({ id, label, type = "text", value, onChange, placeholder, error, hint, autoComplete }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-bold text-slate-300">{label}</label><input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? id + "-error" : hint ? id + "-hint" : undefined} className={"input-field " + (error ? "!border-red-300/50 !ring-red-300/10" : "")} />{error && <p id={id + "-error"} className="mt-1 text-xs text-red-200">{error}</p>}{!error && hint && <p id={id + "-hint"} className="mt-1 text-xs text-emerald-200">{hint}</p>}</div>;
}
function SurveyGate({ completed, error, onOpen }) {
  return (
    <section className="register-survey-gate rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-white">Sizi biraz tanıyalım</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {completed
              ? "Anket tamamlandı; deneme sırasında verdiğin cevaplar bu hesap için kullanılacak."
              : "Önerileri kişiselleştirmek için kısa anketi doldur."}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className={completed ? "btn-secondary !min-h-0 !px-4 !py-2" : "btn-primary !min-h-0 !px-4 !py-2"}
        >
          {completed ? "Anketi düzenle" : "Anketi doldur"}
        </button>
      </div>
      {completed && <p className="mt-3 text-xs font-bold text-emerald-200">✓ Anket hazır; istersen cevaplarını güncelleyebilirsin.</p>}
      {error && <p className="mt-3 text-xs text-red-200">{error}</p>}
    </section>
  );
}
function SurveyPanel({ title, description, badge, questions }) {
  return (
    <section className="relative overflow-hidden rounded-[1.6rem] border border-cyan-200/16 bg-[linear-gradient(145deg,rgba(34,211,238,0.09),rgba(255,255,255,0.045))] p-4 shadow-[0_20px_56px_rgba(14,165,233,0.08)] sm:p-5">
      <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-cyan-200/10 blur-3xl" />
      <div className="relative mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/80">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100">
          {badge}
        </span>
      </div>
      <div className="relative grid gap-4 md:grid-cols-2">
        {questions.map((question) => (
          <SurveySingleSelect key={question.id} {...question} />
        ))}
      </div>
    </section>
  );
}
function SurveySingleSelect({ id, label, options, value, onChange, error }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-slate-300">{label}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-labelledby={id}>
        {options.map((option) => {
          const active = value === option.key;
          return (
            <button
              key={option.key}
              id={option.key === options[0].key ? id : undefined}
              type="button"
              onClick={() => onChange(option.key)}
              aria-pressed={active}
              className={`min-h-24 rounded-2xl border px-3 py-3 text-left text-sm transition ${
                active ? "text-white shadow-lg" : "text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
              }`}
              style={{
                borderColor: active ? "rgba(34,211,238,0.55)" : "rgba(255,255,255,0.10)",
                backgroundColor: active ? "rgba(34,211,238,0.16)" : "rgba(255,255,255,0.03)",
              }}
            >
              <span className="block font-black">{option.label}</span>
              {option.description && (
                <span className="mt-1 block text-xs font-semibold leading-5 opacity-75">{option.description}</span>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-red-200">{error}</p>}
    </div>
  );
}
function SurveyMultiSelect({ id, label, helper, options, values, error, onToggle }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p id={id} className="text-sm font-bold text-slate-200">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-black text-slate-400">
          {values.length}/3
        </span>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={id}>
        {options.map((option) => {
          const active = values.includes(option.key);
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onToggle(option.key)}
              aria-pressed={active}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                active ? "text-white" : "text-slate-300 hover:bg-white/[0.06]"
              }`}
              style={{
                borderColor: active ? "rgba(45,212,191,0.55)" : "rgba(255,255,255,0.12)",
                backgroundColor: active ? "rgba(45,212,191,0.18)" : "rgba(255,255,255,0.03)",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-3 text-xs text-red-200">{error}</p>}
    </div>
  );
}
function PasswordStrength({ strength, label }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3"><div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-400">{label}</span><span style={{ color: strength.color }} className="font-black">{strength.label}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full" style={{ width: strength.progress + "%", backgroundColor: strength.color }} /></div></div>; }
function AuthError({ title, message }) { return <div className="auth-error mb-4 rounded-2xl border p-4" role="alert"><p className="text-sm font-black">{title}</p><p className="mt-1 text-sm leading-6">{message}</p></div>; }
function ButtonLoading({ label }) { return <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-950 motion-safe:animate-pulse" />{label}</span>; }
function getPasswordStrength(password, t) { if (!password) return { label: t("auth.strength.waiting"), color: "#94a3b8", progress: 8 }; let score = 0; if (password.length >= 6) score += 1; if (password.length >= 10) score += 1; if (/[A-ZÇĞİÖŞÜ]/.test(password) && /[a-zçğıöşü]/.test(password)) score += 1; if (/\d/.test(password)) score += 1; if (/[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(password)) score += 1; if (score >= 4) return { label: t("auth.strength.strong"), color: "#22c55e", progress: 100 }; if (score >= 2) return { label: t("auth.strength.enough"), color: "#38bdf8", progress: 66 }; return { label: t("auth.strength.short"), color: "#f59e0b", progress: 32 }; }
function isEmailFormatValid(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function hasSurveyPayload(survey) {
  return Boolean(
    survey?.recommendationGoal &&
      survey?.energyPreference &&
      Array.isArray(survey.musicGenres) &&
      survey.musicGenres.length > 0 &&
      Array.isArray(survey.movieGenres) &&
      survey.movieGenres.length > 0 &&
      Array.isArray(survey.bookGenres) &&
      survey.bookGenres.length > 0,
  );
}

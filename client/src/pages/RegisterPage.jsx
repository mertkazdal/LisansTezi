import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { authAPI, guestSessionAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const from = location.state?.from || "/analyze";
  const [form, setForm] = useState({ username: "", email: "", password: "", passwordConfirm: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const accountBenefits = t("auth.registerBenefits", { returnObjects: true });
  const guestRemaining = guestSessionAPI.getGuestRemainingAnalyses();
  const guestLimit = guestSessionAPI.getDefaultGuestLimit();
  const guestUsed = Math.max(0, guestLimit - guestRemaining);
  const passwordStrength = useMemo(() => getPasswordStrength(form.password, t), [form.password, t]);
  const passwordsMatch = form.passwordConfirm.length > 0 && form.password === form.passwordConfirm;

  function validate() {
    const nextErrors = {};
    if (!form.username.trim() || form.username.trim().length < 3) nextErrors.username = t("auth.validation.username");
    if (!form.email.trim() || !form.email.includes("@")) nextErrors.email = t("auth.validation.email");
    if (!form.password || form.password.length < 6) nextErrors.password = t("auth.validation.password");
    if (form.password !== form.passwordConfirm) nextErrors.passwordConfirm = t("auth.validation.passwordConfirm");
    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }
    setIsLoading(true);
    setErrors({});
    try {
      const data = await authAPI.register({ username: form.username.trim(), email: form.email.trim(), password: form.password });
      login(data.user, data.token);
      if (data.migratedGuestAnalysesCount > 0) toast.success(t("auth.migrated", { count: data.migratedGuestAnalysesCount }));
      else if (data.guestDataMerged) toast.success(t("auth.merged"));
      toast.success(t("auth.registerSuccess"));
      navigate(from, { replace: true });
    } catch (err) {
      setErrors({ general: err.message || t("auth.registerFailed") });
    } finally {
      setIsLoading(false);
    }
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key] || errors.general) setErrors((current) => ({ ...current, [key]: "", general: "" }));
  }

  return (
    <div className="page-shell aurora-bg flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className="premium-card grid w-full max-w-6xl overflow-hidden lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="soft-grid-bg relative hidden overflow-hidden border-r border-white/10 p-8 lg:block">
          <div className="absolute -top-28 right-0 h-80 w-80 rounded-full bg-teal-300/12 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-indigo-300/12 blur-3xl" />
          <div className="relative">
            <p className="section-eyebrow">{t("auth.registerEyebrow")}</p>
            <h2 className="mt-7 text-5xl font-black leading-tight text-white">{t("auth.registerTitle")}</h2>
            <p className="mt-5 text-base leading-8 text-slate-300">{t("auth.registerDescription")}</p>
            <div className="mt-8 grid gap-3">
              {accountBenefits.map((benefit, index) => (
                <div key={benefit} className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
                  <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-300/15 text-xs font-black text-emerald-100">✓</span><span className="text-sm font-bold leading-6 text-white">{benefit}</span></div>
                  {index === 0 && guestUsed > 0 && <p className="mt-2 pl-12 text-xs text-slate-400">{t("auth.registerGuestReady", { count: guestUsed })}</p>}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-3xl border border-amber-200/20 bg-amber-200/10 p-5"><p className="text-sm font-black text-amber-50">{t("auth.registerTrialTitle", { limit: guestLimit })}</p><p className="mt-2 text-sm leading-6 text-amber-50/75">{t("auth.registerTrialDescription")}</p></div>
          </div>
        </aside>

        <div className="p-6 sm:p-9 lg:p-10">
          <div className="mb-8 text-center"><span className="orb mx-auto h-16 w-16" aria-hidden="true"><span className="relative z-10 h-3 w-3 rounded-full bg-cyan-100" /></span><h1 className="mt-5 text-3xl font-black text-white">{t("auth.registerHeading")}</h1><p className="mt-2 text-sm leading-6 text-slate-400">{t("auth.registerSubheading")}</p></div>
          {errors.general && <AuthError title={t("auth.registerErrorTitle")} message={errors.general} />}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field id="register-username" label={t("forms.username")} value={form.username} onChange={(value) => updateField("username", value)} placeholder="kullaniciadi" error={errors.username} autoComplete="username" />
            <Field id="register-email" label={t("forms.email")} type="email" value={form.email} onChange={(value) => updateField("email", value)} placeholder={t("forms.emailPlaceholder")} error={errors.email} autoComplete="email" />
            <Field id="register-password" label={t("forms.password")} type="password" value={form.password} onChange={(value) => updateField("password", value)} placeholder={t("forms.passwordMin")} error={errors.password} autoComplete="new-password" />
            <PasswordStrength strength={passwordStrength} label={t("auth.passwordStrength")} />
            <Field id="register-password-confirm" label={t("forms.passwordConfirm")} type="password" value={form.passwordConfirm} onChange={(value) => updateField("passwordConfirm", value)} placeholder={t("forms.passwordDots")} error={errors.passwordConfirm} autoComplete="new-password" hint={passwordsMatch ? t("auth.passwordMatch") : ""} />
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-xs leading-6 text-slate-400">{t("auth.registerPrivacy")}</div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full !py-4 text-base">{isLoading ? <ButtonLoading label={t("auth.registerLoading")} /> : t("actions.register")}</button>
          </form>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center text-sm text-slate-400">{t("auth.haveAccount")} <Link to="/login" state={{ from }} className="font-black text-cyan-100 hover:underline">{t("actions.login")}</Link></div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ id, label, type = "text", value, onChange, placeholder, error, hint, autoComplete }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-bold text-slate-300">{label}</label><input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? id + "-error" : hint ? id + "-hint" : undefined} className={"input-field " + (error ? "!border-red-300/50 !ring-red-300/10" : "")} />{error && <p id={id + "-error"} className="mt-1 text-xs text-red-200">{error}</p>}{!error && hint && <p id={id + "-hint"} className="mt-1 text-xs text-emerald-200">{hint}</p>}</div>;
}
function PasswordStrength({ strength, label }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3"><div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-400">{label}</span><span style={{ color: strength.color }} className="font-black">{strength.label}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full" style={{ width: strength.progress + "%", backgroundColor: strength.color }} /></div></div>; }
function AuthError({ title, message }) { return <div className="mb-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-4" role="alert"><p className="text-sm font-black text-red-50">{title}</p><p className="mt-1 text-sm leading-6 text-red-100/85">{message}</p></div>; }
function ButtonLoading({ label }) { return <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-950 motion-safe:animate-pulse" />{label}</span>; }
function getPasswordStrength(password, t) { if (!password) return { label: t("auth.strength.waiting"), color: "#94a3b8", progress: 8 }; let score = 0; if (password.length >= 6) score += 1; if (password.length >= 10) score += 1; if (/[A-ZÇĞİÖŞÜ]/.test(password) && /[a-zçğıöşü]/.test(password)) score += 1; if (/d/.test(password)) score += 1; if (/[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(password)) score += 1; if (score >= 4) return { label: t("auth.strength.strong"), color: "#22c55e", progress: 100 }; if (score >= 2) return { label: t("auth.strength.enough"), color: "#38bdf8", progress: 66 }; return { label: t("auth.strength.short"), color: "#f59e0b", progress: 32 }; }

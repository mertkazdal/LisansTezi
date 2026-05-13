import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { authAPI, guestSessionAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const from = location.state?.from || "/analyze";
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const trustItems = t("auth.trustItems", { returnObjects: true });
  const guestRemaining = guestSessionAPI.getGuestRemainingAnalyses();
  const guestLimit = guestSessionAPI.getDefaultGuestLimit();
  const hasGuestContext = guestRemaining < guestLimit;
  const guestUsed = Math.max(0, guestLimit - guestRemaining);
  const returnLabel = useMemo(() => getReturnLabel(from, t), [from, t]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      setError(t("auth.loginMissingFields"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await authAPI.login({ email: form.email.trim(), password: form.password });
      login(data.user, data.token);

      toast.success(t("auth.loginSuccess"));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || t("auth.loginFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page page-shell aurora-bg flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} className="surface-panel-strong grid w-full max-w-6xl overflow-hidden lg:grid-cols-[0.95fr_1.05fr]">
        <AuthTrustPanel eyebrow={t("auth.loginEyebrow")} title={t("auth.loginTitle")} description={t("auth.loginDescription")} returnLabel={returnLabel} guestUsed={guestUsed} hasGuestContext={hasGuestContext} trustItems={trustItems} t={t} />

        <div className="p-6 sm:p-9 lg:p-10">
          <div className="mb-8 text-center">
            <span className="orb mx-auto h-16 w-16" aria-hidden="true"><span className="relative z-10 h-3 w-3 rounded-full bg-cyan-100" /></span>
            <h1 className="mt-5 text-3xl font-black text-white">{t("auth.loginHeading")}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">{t("auth.loginSubheading")}</p>
          </div>

          {error && <AuthError title={t("auth.loginErrorTitle")} message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field id="login-email" label={t("forms.email")} type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} placeholder={t("forms.emailPlaceholder")} autoComplete="email" />
            <Field id="login-password" label={t("forms.password")} type="password" value={form.password} onChange={(value) => setForm((current) => ({ ...current, password: value }))} placeholder={t("forms.passwordDots")} autoComplete="current-password" />
            <GuestMergeHint guestUsed={guestUsed} hasGuestContext={hasGuestContext} t={t} />
            <button type="submit" disabled={isLoading} className="btn-primary w-full !py-4 text-base">{isLoading ? <ButtonLoading label={t("auth.loginLoading")} /> : t("auth.loginHeading")}</button>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center text-sm text-slate-400">
            {t("auth.noAccount")} <Link to="/register" state={{ from }} className="font-black text-cyan-100 hover:underline">{t("actions.createAccount")}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AuthTrustPanel({ eyebrow, title, description, returnLabel, guestUsed, hasGuestContext, trustItems, t }) {
  return (
    <aside className="soft-grid-bg relative hidden overflow-hidden border-r border-white/10 p-8 lg:block">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-cyan-300/12 blur-3xl" />
      <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="relative">
        <p className="section-eyebrow">{eyebrow}</p>
        <h2 className="mt-7 text-5xl font-black leading-tight text-white">{title}</h2>
        <p className="mt-5 text-base leading-8 text-slate-300">{description}</p>
        <div className="mt-8 space-y-3">
          {trustItems.map((item, index) => (
            <motion.div key={item.title} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + index * 0.06 }} className="surface-panel rounded-[1.45rem] p-4">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-200/10 text-xs font-black text-cyan-100">0{index + 1}</span><div><p className="font-black text-white">{item.title}</p><p className="text-sm leading-6 text-slate-400">{item.description}</p></div></div>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 rounded-3xl border border-cyan-200/20 bg-cyan-200/10 p-5 shadow-[0_16px_42px_rgba(45,212,191,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">{t("auth.returnTarget")}</p>
          <p className="mt-2 text-xl font-black text-white">{returnLabel}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{hasGuestContext ? t("auth.guestReady", { count: guestUsed }) : t("auth.secureStudioReturn")}</p>
        </div>
      </div>
    </aside>
  );
}

function Field({ id, label, type, value, onChange, placeholder, autoComplete }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-bold text-slate-300">{label}</label><input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} className="input-field" /></div>;
}

function GuestMergeHint({ guestUsed, hasGuestContext, t }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-slate-400"><span className="font-bold text-cyan-100">{t("auth.guestMergeTitle")}</span> {hasGuestContext ? t("auth.guestMergeUsed", { count: guestUsed }) : t("auth.guestMergeEmpty")}</div>;
}

function AuthError({ title, message }) {
  return <div className="auth-error mb-4 rounded-2xl border p-4" role="alert"><p className="text-sm font-black">{title}</p><p className="mt-1 text-sm leading-6">{message}</p></div>;
}

function ButtonLoading({ label }) {
  return <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-950 motion-safe:animate-pulse" />{label}</span>;
}

function getReturnLabel(path, t) {
  if (path?.startsWith("/history")) return t("auth.returnHistory");
  if (path?.startsWith("/profile")) return t("auth.returnProfile");
  if (path?.startsWith("/result")) return t("auth.returnResult");
  return t("auth.returnAnalyze");
}

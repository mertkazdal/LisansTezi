import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getDefaultGuestLimit, getGuestRemainingAnalyses } from "../../lib/guestSession";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../system/ThemeProvider";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuthStore();
  const { theme, isDark, toggleTheme } = useTheme();
  const remaining = getGuestRemainingAnalyses();
  const guestLimit = getDefaultGuestLimit();
  const progress = Math.max(0, Math.min(100, (remaining / guestLimit) * 100));
  const themeCopy = getThemeCopy(i18n.language, theme);
  const desktopLinks = [
    { path: "/", labelKey: "navigation.home", marker: "01" },
    { path: "/analyze", labelKey: "navigation.analyze", marker: "02" },
    { path: "/history", labelKey: "navigation.history", marker: "03", auth: true },
    { path: "/profile", labelKey: "navigation.profile", marker: "04", auth: true },
    { path: "/metrics", labelKey: "navigation.metrics", marker: "05", admin: true },
  ];

  const bottomLinks = [
    { path: "/", label: t("navigation.homeShort"), marker: "A" },
    { path: "/analyze", label: t("navigation.analyze"), marker: "AI" },
    user?.isAdmin
      ? { path: "/metrics", label: t("navigation.metricsShort"), marker: "M" }
      : isLoggedIn
        ? { path: "/history", label: t("navigation.history"), marker: "G" }
        : { path: "/login", label: t("navigation.login"), marker: "L" },
    isLoggedIn
      ? { path: "/profile", label: t("navigation.profile"), marker: "P" }
      : { path: "/register", label: t("navigation.register"), marker: "K" },
  ];

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <>
      <nav
        aria-label={t("navigation.primary")}
        className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/55 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl"
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-3 rounded-2xl focus-ring" aria-label={t("navigation.homeAria")}>
            <motion.span
              className="orb h-12 w-12 shrink-0"
              animate={{ rotate: [0, 8, -5, 0], scale: [1, 1.04, 1] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            >
              <span className="relative z-10 h-3 w-3 rounded-full bg-cyan-100" />
            </motion.span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-tight text-white sm:text-lg">{t("common.shortProductName")}</span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-100/70 sm:block">
                {t("common.tagline")}
              </span>
            </span>
          </Link>

          <div className="hidden items-center rounded-2xl border border-white/10 bg-white/[0.055] p-1 shadow-lg shadow-slate-950/20 md:flex">
            {desktopLinks.map(({ path, labelKey, marker, auth, admin }) => {
              if (auth && !isLoggedIn) {
                return null;
              }

              if (admin && !user?.isAdmin) {
                return null;
              }

              const isActive = isRouteActive(location.pathname, path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`focus-ring relative rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    isActive ? "text-white" : "text-slate-400 hover:text-white"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-indicator"
                      className="absolute inset-0 rounded-xl border border-cyan-200/30 bg-cyan-200/10 shadow-lg shadow-cyan-500/10"
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/60">{marker}</span>
                    {t(labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {!isLoggedIn && <GuestQuotaPill label={t("common.guestQuota")} remaining={remaining} progress={progress} />}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle focus-ring"
              aria-label={themeCopy.action}
              title={themeCopy.action}
            >
              <span className={`theme-toggle__icon ${isDark ? "is-dark" : "is-light"}`} aria-hidden="true">
                <span className="theme-toggle__core" />
              </span>
              <span className="hidden sm:inline">{themeCopy.short}</span>
            </button>

            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="btn-ghost hidden max-w-[11rem] truncate md:inline-flex"
                  aria-label={t("common.openProfile")}
                >
                  {user?.username || t("navigation.profile")}
                </button>
                <button type="button" onClick={handleLogout} className="btn-secondary hidden !px-4 !py-2 md:inline-flex">
                  {t("navigation.logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden md:inline-flex">
                  {t("navigation.login")}
                </Link>
                <Link to="/register" className="btn-primary hidden !px-4 !py-2 md:inline-flex">
                  {t("navigation.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <nav
        aria-label={t("navigation.mobile")}
        className="fixed left-3 right-3 z-50 md:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <div className="grid grid-cols-4 gap-1 rounded-[1.75rem] border border-white/12 bg-slate-950/82 p-1.5 shadow-2xl shadow-slate-950/50 backdrop-blur-2xl">
          {bottomLinks.map(({ path, label, marker }) => {
            const isActive = isRouteActive(location.pathname, path);
            return (
              <Link
                key={path}
                to={path}
                className={`focus-ring relative flex min-h-14 flex-col items-center justify-center rounded-2xl text-[11px] font-bold transition ${
                  isActive ? "text-white" : "text-slate-400"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-navbar-indicator"
                    className="absolute inset-0 rounded-2xl bg-cyan-200/12 shadow-inner shadow-cyan-100/10"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="relative z-10 text-[10px] uppercase tracking-[0.18em] text-cyan-100/70">{marker}</span>
                <span className="relative z-10 mt-0.5">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function GuestQuotaPill({ label, remaining, progress }) {
  return (
    <div className="hidden min-w-36 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs text-amber-50 shadow-lg shadow-amber-950/10 lg:block">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold">{label}</span>
        <span className="font-black">{remaining}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-amber-200 to-cyan-200 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function isRouteActive(pathname, path) {
  if (path === "/") {
    return pathname === "/";
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

function getThemeCopy(language, theme) {
  const isEnglish = String(language || "tr").startsWith("en");

  if (theme === "dark") {
    return {
      short: isEnglish ? "Light" : "Acik",
      action: isEnglish ? "Switch to light mode" : "Acik temaya gec",
    };
  }

  return {
    short: isEnglish ? "Dark" : "Koyu",
    action: isEnglish ? "Switch to dark mode" : "Koyu temaya gec",
  };
}

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getDefaultGuestLimit, getGuestRemainingAnalyses } from "../../lib/guestSession";
import { useAuthStore } from "../../store/authStore";

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuthStore();
  const navbarRef = useRef(null);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const remaining = getGuestRemainingAnalyses();
  const guestLimit = getDefaultGuestLimit();
  const progress = Math.max(0, Math.min(100, (remaining / guestLimit) * 100));

  const desktopLinks = [
    { path: "/", labelKey: "navigation.home" },
    { path: "/analyze", labelKey: "navigation.analyze" },
    { path: "/history", labelKey: "navigation.history", auth: true },
    { path: "/profile", labelKey: "navigation.profile", auth: true },
    { path: "/metrics", labelKey: "navigation.metrics", admin: true },
  ];

  const bottomLinks = [
    { path: "/", label: t("navigation.homeShort"), marker: "Ana" },
    { path: "/analyze", label: t("navigation.analyze"), marker: "AI" },
    user?.isAdmin
      ? { path: "/metrics", label: t("navigation.metricsShort"), marker: "Met" }
      : isLoggedIn
        ? { path: "/history", label: t("navigation.history"), marker: "Geç" }
        : { path: "/login", label: t("navigation.login"), marker: "Gir" },
    isLoggedIn
      ? { path: "/profile", label: t("navigation.profile"), marker: "Pro" }
      : { path: "/register", label: t("navigation.register"), marker: "Kay" },
  ];

  useEffect(() => {
    setIsNavbarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isNavbarOpen) return undefined;

    function handleDocumentPointerDown(event) {
      if (!navbarRef.current?.contains(event.target)) {
        setIsNavbarOpen(false);
      }
    }

    function handleDocumentKeyDown(event) {
      if (event.key === "Escape") {
        setIsNavbarOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [isNavbarOpen]);

  function closeNavbar() {
    setIsNavbarOpen(false);
  }

  function handleNavbarBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      closeNavbar();
    }
  }

  function handleLogout() {
    closeNavbar();
    logout();
    navigate("/");
  }

  return (
    <>
      <nav
        ref={navbarRef}
        aria-label={t("navigation.primary")}
        className={`navbar-shell sticky top-0 z-50 ${isNavbarOpen ? "is-open" : ""}`}
        onPointerEnter={() => setIsNavbarOpen(true)}
        onPointerLeave={closeNavbar}
        onFocus={() => setIsNavbarOpen(true)}
        onBlur={handleNavbarBlur}
      >
        <div className="mx-auto flex min-h-[4.35rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex min-w-0 items-center gap-3 rounded-2xl focus-ring" aria-label={t("navigation.homeAria")} onClick={closeNavbar}>
            <span className="brand-orb shrink-0" aria-hidden="true">YK</span>
            <span className="min-w-0 leading-tight">
              <span className="navbar-brand-title block truncate text-base font-black tracking-tight sm:text-lg">{t("common.shortProductName")}</span>
              <span className="navbar-brand-tagline hidden text-[10px] font-bold uppercase tracking-[0.22em] lg:block">
                {t("common.tagline")}
              </span>
            </span>
          </Link>

          <div className="navbar-links hidden items-center gap-1 rounded-full border p-1 lg:flex">
            {desktopLinks.map(({ path, labelKey, auth, admin }) => {
              if (auth && !isLoggedIn) return null;
              if (admin && !user?.isAdmin) return null;

              const isActive = isRouteActive(location.pathname, path);
              return (
                <Link
                  key={path}
                  to={path}
                  className={`navbar-link focus-ring relative rounded-full px-4 py-2 text-sm font-bold transition ${
                    isActive ? "is-active" : ""
                  }`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={closeNavbar}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-indicator"
                      className="navbar-link-indicator absolute inset-0 rounded-full border"
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{t(labelKey)}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {!isLoggedIn && (
              <>
                <GuestQuotaPill label={t("common.guestQuota")} remaining={remaining} progress={progress} />
                <CompactGuestPill label={t("common.guestQuota")} remaining={remaining} />
              </>
            )}

            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    closeNavbar();
                    navigate("/profile");
                  }}
                  className="btn-ghost hidden max-w-[10rem] truncate lg:inline-flex"
                  aria-label={t("common.openProfile")}
                >
                  {user?.username || t("navigation.profile")}
                </button>
                <button type="button" onClick={handleLogout} className="btn-secondary hidden !min-h-0 !px-4 !py-2 lg:inline-flex">
                  {t("navigation.logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden lg:inline-flex" onClick={closeNavbar}>
                  {t("navigation.login")}
                </Link>
                <Link to="/register" className="btn-primary hidden !min-h-0 !px-4 !py-2 lg:inline-flex" onClick={closeNavbar}>
                  {t("navigation.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <nav
        aria-label={t("navigation.mobile")}
        className="mobile-navbar-shell fixed inset-x-0 z-50 px-3 md:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.7rem)" }}
      >
        <div className="mobile-navbar-panel mx-auto grid max-w-md grid-cols-4 gap-1 rounded-[1.35rem] border p-1.5 backdrop-blur-2xl">
          {bottomLinks.map(({ path, label, marker }) => {
            const isActive = isRouteActive(location.pathname, path);
            return (
              <Link
                key={path}
                to={path}
                className={`mobile-navbar-link focus-ring relative flex min-h-14 flex-col items-center justify-center rounded-2xl text-[11px] font-bold transition ${
                  isActive ? "is-active" : ""
                }`}
                aria-current={isActive ? "page" : undefined}
                onClick={closeNavbar}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-navbar-indicator"
                    className="mobile-navbar-indicator absolute inset-0 rounded-2xl"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="mobile-navbar-marker relative z-10 text-[10px] uppercase tracking-[0.14em]">{marker}</span>
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
    <div
      className="hidden min-w-36 rounded-2xl border px-3 py-2 text-xs xl:block"
      style={{
        backgroundColor: "var(--color-quota-bg)",
        borderColor: "var(--color-quota-border)",
        color: "var(--color-quota-text)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold opacity-80">{label}</span>
        <span className="font-black" style={{ color: "var(--color-quota-accent)" }}>{remaining}</span>
      </div>
      <div className="quota-progress-track mt-2 h-1.5 overflow-hidden rounded-full">
        <span className="quota-progress-fill block h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function CompactGuestPill({ label, remaining }) {
  return (
    <div
      className="hidden items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black sm:inline-flex xl:hidden"
      style={{ backgroundColor: "var(--color-quota-bg)", borderColor: "var(--color-quota-border)", color: "var(--color-quota-text)" }}
      aria-label={`${label}: ${remaining}`}
    >
      <span>Hak</span>
      <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: "var(--color-quota-accent)", color: "var(--color-quota-accent-foreground)" }}>
        {remaining}
      </span>
    </div>
  );
}

function isRouteActive(pathname, path) {
  if (path === "/") {
    return pathname === "/";
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

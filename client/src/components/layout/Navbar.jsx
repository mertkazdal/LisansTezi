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
  const toggleRef = useRef(null);
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

  useEffect(() => {
    setIsNavbarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isNavbarOpen) return undefined;

    function handleDocumentPointerDown(event) {
      if (
        !navbarRef.current?.contains(event.target) &&
        !toggleRef.current?.contains(event.target)
      ) {
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

  function handleLogout() {
    closeNavbar();
    logout();
    navigate("/");
  }

  return (
    <>
      <nav
        id="primary-navbar"
        ref={navbarRef}
        aria-label={t("navigation.primary")}
        className="navbar-shell sticky top-0 z-50"
      >
        <div className="mx-auto flex min-h-[4.35rem] max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 md:flex-nowrap lg:px-8">
          <Link to="/" className="group flex min-w-0 items-center gap-3 rounded-2xl focus-ring" aria-label={t("navigation.homeAria")} onClick={closeNavbar}>
            <span className="brand-orb shrink-0" aria-hidden="true">YK</span>
            <span className="min-w-0 leading-tight">
              <span className="navbar-brand-title block truncate text-base font-black tracking-tight sm:text-lg">{t("common.shortProductName")}</span>
              <span className="navbar-brand-tagline hidden text-[10px] font-bold uppercase tracking-[0.22em] md:block">
                {t("common.tagline")}
              </span>
            </span>
          </Link>

          <div className="navbar-links hidden min-w-0 flex-1 items-center justify-center gap-1 rounded-full border p-1 md:flex">
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

          <div className="hidden items-center justify-end gap-2 md:flex">
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
                  className="btn-ghost max-w-[10rem] truncate"
                  aria-label={t("common.openProfile")}
                >
                  {user?.username || t("navigation.profile")}
                </button>
                <button type="button" onClick={handleLogout} className="btn-secondary !min-h-0 !px-4 !py-2">
                  {t("navigation.logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost" onClick={closeNavbar}>
                  {t("navigation.login")}
                </Link>
                <Link to="/register" className="btn-primary !min-h-0 !px-4 !py-2" onClick={closeNavbar}>
                  {t("navigation.register")}
                </Link>
              </>
            )}
          </div>

          <button
            ref={toggleRef}
            type="button"
            className="navbar-inline-close focus-ring ml-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-xl font-black md:hidden"
            aria-controls="mobile-navbar-menu"
            aria-expanded={isNavbarOpen}
            aria-label={isNavbarOpen ? t("navigation.closeMenu") : t("navigation.openMenu")}
            onClick={() => setIsNavbarOpen((value) => !value)}
          >
            <span aria-hidden="true">{isNavbarOpen ? "✕" : "☰"}</span>
          </button>

          {isNavbarOpen && (
            <div
              id="mobile-navbar-menu"
              className="mobile-navbar-panel navbar-links basis-full rounded-[1.35rem] border p-1.5 backdrop-blur-2xl md:hidden"
            >
              <div className="grid gap-1">
                {desktopLinks.map(({ path, labelKey, auth, admin }) => {
                  if (auth && !isLoggedIn) return null;
                  if (admin && !user?.isAdmin) return null;

                  const isActive = isRouteActive(location.pathname, path);
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`mobile-navbar-link focus-ring relative flex min-h-12 items-center justify-center rounded-2xl text-sm font-bold transition ${
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
                      <span className="relative z-10">{t(labelKey)}</span>
                    </Link>
                  );
                })}

                {isLoggedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        closeNavbar();
                        navigate("/profile");
                      }}
                      className="mobile-navbar-link focus-ring relative flex min-h-12 items-center justify-center rounded-2xl text-sm font-bold transition"
                      aria-label={t("common.openProfile")}
                    >
                      <span className="relative z-10">{user?.username || t("navigation.profile")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mobile-navbar-link focus-ring relative flex min-h-12 items-center justify-center rounded-2xl text-sm font-bold transition"
                    >
                      <span className="relative z-10">{t("navigation.logout")}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="mobile-navbar-link focus-ring relative flex min-h-12 items-center justify-center rounded-2xl text-sm font-bold transition" onClick={closeNavbar}>
                      <span className="relative z-10">{t("navigation.login")}</span>
                    </Link>
                    <Link to="/register" className="mobile-navbar-link focus-ring relative flex min-h-12 items-center justify-center rounded-2xl text-sm font-bold transition" onClick={closeNavbar}>
                      <span className="relative z-10">{t("navigation.register")}</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
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

import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import NetworkStatusBadge from "./components/system/NetworkStatusBadge";
import { useAuthStore } from "./store/authStore";

const HomePage = lazy(() => import("./pages/HomePage"));
const AnalyzePage = lazy(() => import("./pages/AnalyzePage"));
const ResultPage = lazy(() => import("./pages/ResultPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const MetricsPage = lazy(() => import("./pages/MetricsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((module) => ({ default: module.ProfilePage })),
);

function App() {
  const hydrateToken = useAuthStore((state) => state.hydrateToken);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const location = useLocation();
  const isHomePoster = location.pathname === "/";
  const isGuestFlow = !isLoggedIn;
  const isRegisteredPanelFlow = isLoggedIn && isRegisteredPanelPath(location.pathname);
  const usesRevealChrome = isGuestFlow || isRegisteredPanelFlow;

  useEffect(() => {
    hydrateToken();
  }, [hydrateToken]);

  return (
    <div
      className={`app-shell ${isHomePoster ? "is-home-poster" : ""} ${isGuestFlow ? "is-guest-flow" : ""} ${usesRevealChrome ? "is-reveal-chrome" : ""}`}
    >
      {usesRevealChrome && <div className="guest-navbar-hotspot" aria-hidden="true" />}
      <Navbar />
      <main className="app-content">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/result/:historyId" element={<ResultPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/metrics" element={<MetricsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <NetworkStatusBadge />
    </div>
  );
}

export default App;

function isRegisteredPanelPath(pathname) {
  return pathname === "/analyze" ||
    pathname === "/history" ||
    pathname === "/profile" ||
    pathname === "/metrics" ||
    pathname.startsWith("/result/");
}

function RouteFallback() {
  const { t } = useTranslation();

  return (
    <div className="page-shell aurora-bg flex items-center justify-center px-4">
      <div className="premium-card relative z-10 w-full max-w-md p-7 text-center" role="status" aria-live="polite" aria-busy="true">
        <div className="orb mx-auto h-16 w-16">
          <span className="relative z-10 h-4 w-4 rounded-full bg-cyan-100 shadow-lg shadow-cyan-200/70" />
        </div>
        <p className="section-eyebrow mx-auto mt-6 w-fit">{t("common.shortProductName")}</p>
        <h1 className="mt-4 text-2xl font-black text-white">{t("common.loadingTitle")}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {t("common.loadingDescription")}
        </p>
        <div className="mt-6 space-y-3">
          <div className="skeleton-card h-3 w-full" />
          <div className="skeleton-card mx-auto h-3 w-3/4" />
          <div className="skeleton-card mx-auto h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

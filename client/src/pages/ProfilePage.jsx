import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getEmotionMeta } from "../lib/emotions";
import { getSavedRecommendations, removeSavedRecommendation, SAVED_RECOMMENDATIONS_EVENT } from "../lib/savedRecommendations";
import { adminAPI, userAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

function getSavedRecommendationFilters(t) {
  return [
    { key: "all", label: t("profile.filters.all") },
    { key: "music", label: t("profile.filters.music") },
    { key: "movie", label: t("profile.filters.movie") },
    { key: "book", label: t("profile.filters.book") },
    { key: "advice", label: t("profile.filters.advice") },
  ];
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { user, isLoggedIn, logout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [adminOverview, setAdminOverview] = useState(null);
  const [error, setError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [savedRecommendations, setSavedRecommendations] = useState(() => getSavedRecommendations());
  const [savedFilter, setSavedFilter] = useState("all");

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/profile" } });
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");
      setAdminError("");

      try {
        const profileData = await userAPI.getProfile();
        if (cancelled) {
          return;
        }

        setProfile(profileData);

        if (profileData?.isAdmin) {
          try {
            const overview = await adminAPI.getOverview();
            if (!cancelled) {
              setAdminOverview(overview);
            }
          } catch (adminRequestError) {
            if (!cancelled) {
              setAdminError(adminRequestError.message || t("profile.adminLoadError"));
            }
          }
        } else {
          setAdminOverview(null);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || t("profile.loadError"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    function syncSavedRecommendations() {
      setSavedRecommendations(getSavedRecommendations());
    }

    window.addEventListener(SAVED_RECOMMENDATIONS_EVENT, syncSavedRecommendations);
    window.addEventListener("storage", syncSavedRecommendations);
    return () => {
      window.removeEventListener(SAVED_RECOMMENDATIONS_EVENT, syncSavedRecommendations);
      window.removeEventListener("storage", syncSavedRecommendations);
    };
  }, []);

  if (!isLoggedIn) {
    return null;
  }

  const mostFrequentEmotion = getEmotionMeta(profile?.mostFrequentEmotion, i18n.language);
  const roleLabel = profile?.isAdmin ? t("profile.userRoleAdmin") : t("profile.userRoleMember");
  const deleteConfirmationText = profile?.deleteConfirmationText || "DELETE";
  const displayName = profile?.username || user?.username || t("profile.fallbackName");
  const displayEmail = profile?.email || user?.email || t("profile.fallbackEmail");
  const filteredSavedRecommendations = savedFilter === "all"
    ? savedRecommendations
    : savedRecommendations.filter((item) => item.type === savedFilter);

  async function handleDeleteAccount() {
    const expectedText = String(deleteConfirmationText).toUpperCase();
    if (deleteText.trim().toUpperCase() !== expectedText) {
      toast.error(t("profile.deleteConfirmRequired", { text: deleteConfirmationText }));
      return;
    }

    setIsDeleting(true);
    try {
      const result = await userAPI.deleteAccount(deleteConfirmationText);
      toast.success(result.message || t("profile.deleteSuccess"));
      logout();
      navigate("/");
    } catch (requestError) {
      toast.error(requestError.message || t("profile.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleExportCsv() {
    setIsExporting(true);
    try {
      const { blob, fileName } = await adminAPI.downloadExportCsv();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(t("profile.csvSuccess"));
    } catch (requestError) {
      toast.error(requestError.message || t("profile.csvError"));
    } finally {
      setIsExporting(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  function handleRemoveSavedRecommendation(id) {
    setSavedRecommendations(removeSavedRecommendation(id));
    toast.success(t("profile.savedRemoved"));
  }

  return (
    <div className="page-shell aurora-bg">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto max-w-7xl space-y-6"
      >
        <ProfileHero
          displayName={displayName}
          displayEmail={displayEmail}
          roleLabel={roleLabel}
          profile={profile}
          mostFrequentEmotion={mostFrequentEmotion}
          t={t}
          language={i18n.language}
        />

        {loading ? (
          <ProfileSkeleton />
        ) : error ? (
          <ErrorPanel title={t("profile.loadError")} message={error} />
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <ProfileStatCard label={t("profile.totalAnalyses")} value={formatCount(profile?.totalAnalyses)} detail={t("profile.totalAnalysesDetail")} accentColor="#38bdf8" />
              <ProfileStatCard label={t("profile.frequentEmotion")} value={mostFrequentEmotion.label} detail={t("profile.frequentEmotionDetail")} accentColor={mostFrequentEmotion.accentColor} />
              <ProfileStatCard label={t("profile.role")} value={roleLabel} detail={t("profile.roleDetail")} accentColor="#a78bfa" />
              <ProfileStatCard label={t("profile.membershipDate")} value={formatDate(profile?.createdAt, i18n.language, t)} detail={t("profile.membershipDateDetail")} accentColor="#f59e0b" />
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <LanguagePanel i18n={i18n} t={t} />
              <DataManagementPanel t={t} />
            </section>

            <SavedRecommendationsPanel
              items={filteredSavedRecommendations}
              totalCount={savedRecommendations.length}
              activeFilter={savedFilter}
              setActiveFilter={setSavedFilter}
              onRemove={handleRemoveSavedRecommendation}
              onAnalyze={() => navigate("/analyze")}
              t={t}
            />

            {profile?.isAdmin && (
              <AdminPanel
                adminOverview={adminOverview}
                adminError={adminError}
                isExporting={isExporting}
                onExportCsv={handleExportCsv}
                t={t}
                language={i18n.language}
              />
            )}

            {profile?.canDeleteAccount && (
              <DangerZone
                showDeleteConfirm={showDeleteConfirm}
                setShowDeleteConfirm={setShowDeleteConfirm}
                deleteText={deleteText}
                setDeleteText={setDeleteText}
                deleteConfirmationText={deleteConfirmationText}
                isDeleting={isDeleting}
                onDelete={handleDeleteAccount}
                t={t}
              />
            )}

            <button type="button" onClick={handleLogout} className="btn-secondary w-full !py-4 text-base">
              {t("profile.logout")}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

function ProfileHero({ displayName, displayEmail, roleLabel, profile, mostFrequentEmotion, t, language }) {
  const initial = displayName.slice(0, 1).toUpperCase();
  return (
    <section className="premium-card relative overflow-hidden p-6 sm:p-8 lg:p-10">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: `${mostFrequentEmotion.accentColor}22` }} />
      <div className="absolute -bottom-28 left-8 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] border border-white/15 text-4xl font-black text-white shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${mostFrequentEmotion.accentColor}55, rgba(255,255,255,0.08))` }}
          >
            {initial}
          </div>
          <div>
            <p className="section-eyebrow">{t("profile.profilePanel")}</p>
            <h1 className="mt-5 text-4xl font-black text-white sm:text-5xl">{displayName}</h1>
            <p className="mt-2 text-sm text-slate-400">{displayEmail}</p>
            {profile?.createdAt && (
              <p className="mt-2 text-sm text-slate-500">{t("profile.memberSince", { date: new Date(profile.createdAt).toLocaleDateString(language === "en" ? "en-US" : "tr-TR") })}</p>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 lg:min-w-80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{t("profile.accountRole")}</p>
              <p className="mt-1 text-2xl font-black text-white">{roleLabel}</p>
            </div>
            <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-bold text-cyan-100">
              {t("profile.activeAccount")}
            </span>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/25 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{t("profile.frequentEmotion")}</p>
            <p className="mt-2 text-lg font-black text-white">{mostFrequentEmotion.label}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full w-4/5 rounded-full" style={{ backgroundColor: mostFrequentEmotion.accentColor }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileStatCard({ label, value, detail, accentColor }) {
  return (
    <div className="premium-card p-5">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p className="mt-2 break-words text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <span className="block h-full w-3/4 rounded-full" style={{ backgroundColor: accentColor }} />
      </div>
    </div>
  );
}

export function LanguagePanel({ i18n, t }) {
  const languages = [
    { key: "tr", label: t("profile.languageTurkish") },
    { key: "en", label: t("profile.languageEnglish") },
  ];

  return (
    <section className="premium-card p-6">
      <h2 className="text-xl font-black text-white">{t("profile.languageTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{t("profile.languageDescription")}</p>
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-1.5">
        {languages.map((language) => {
          const active = i18n.language === language.key;
          return (
            <button
              key={language.key}
              type="button"
              onClick={() => {
                i18n.changeLanguage(language.key);
                localStorage.setItem("language", language.key);
              }}
              aria-pressed={active}
              className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                active ? "bg-cyan-200/15 text-cyan-50 shadow-lg shadow-cyan-950/10" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {language.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DataManagementPanel({ t }) {
  return (
    <section className="premium-card p-6">
      <h2 className="text-xl font-black text-white">{t("profile.gdprTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {t("profile.gdprDescription")}
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {t("profile.dataChips", { returnObjects: true }).map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-center text-sm font-bold text-slate-200">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function SavedRecommendationsPanel({ items, totalCount, activeFilter, setActiveFilter, onRemove, onAnalyze, t }) {
  return (
    <section className="premium-card overflow-hidden p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-eyebrow !px-3 !py-1.5">{t("profile.savedEyebrow")}</p>
          <h2 className="mt-4 text-2xl font-black text-white">{t("profile.savedTitle")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {t("profile.savedRecommendationsDescription")}
          </p>
        </div>
        <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-sm font-black text-cyan-100">
          {t("profile.savedCount", { count: totalCount })}
        </span>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.05] p-1.5">
        {getSavedRecommendationFilters(t).map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              aria-pressed={active}
              className={`focus-ring rounded-2xl px-4 py-2.5 text-sm font-black transition ${
                active ? "bg-cyan-200/15 text-cyan-50 shadow-lg shadow-cyan-950/10" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {items.length ? (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <SavedRecommendationCard key={item.id} item={item} onRemove={() => onRemove(item.id)} t={t} />
          ))}
        </div>
      ) : (
        <div className="empty-illustration mt-5 px-6 py-8 text-center">
          <div>
            <span className="orb mx-auto h-14 w-14" aria-hidden="true">
              <span className="relative z-10 h-3 w-3 rounded-full bg-cyan-100" />
            </span>
            <p className="mt-5 text-lg font-black text-white">{t("profile.savedEmptyTitle")}</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {t("profile.savedEmptyDescription")}
            </p>
            <button type="button" onClick={onAnalyze} className="btn-primary mt-5">
              {t("history.newAnalysis")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function SavedRecommendationCard({ item, onRemove, t }) {
  const typeMeta = getSavedRecommendationTypeMeta(item.type, t);
  return (
    <motion.article
      whileHover={{ y: -3 }}
      className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4"
      style={{ boxShadow: `0 18px 55px ${typeMeta.color}12` }}
    >
      <div className="flex gap-4">
        <SavedRecommendationCover item={item} typeMeta={typeMeta} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: `${typeMeta.color}20`, color: typeMeta.color }}>
              {typeMeta.label}
            </span>
            <span className="text-xs text-slate-500">{formatSavedDate(item.savedAt, undefined, t)}</span>
          </div>
          <h3 className="mt-3 line-clamp-2 text-lg font-black text-white">{item.title}</h3>
          {item.subtitle && <p className="mt-1 truncate text-sm text-slate-400">{item.subtitle}</p>}
          {item.reason && <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{item.reason}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {item.externalUrl && (
          <a href={item.externalUrl} target="_blank" rel="noreferrer" className="btn-secondary flex-1 !px-4 !py-2">
            {t("profile.open")}
          </a>
        )}
        <button type="button" onClick={onRemove} className="btn-ghost flex-1 bg-red-400/10 text-red-100 hover:bg-red-400/20">
          {t("profile.remove")}
        </button>
      </div>
    </motion.article>
  );
}

function SavedRecommendationCover({ item, typeMeta }) {
  if (item.imageUrl) {
    return <img src={item.imageUrl} alt={item.title} className="h-24 w-20 shrink-0 rounded-2xl object-cover shadow-xl shadow-slate-950/30" />;
  }

  return (
    <div
      className="flex h-24 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-lg font-black"
      style={{ color: typeMeta.color, boxShadow: `inset 0 0 34px ${typeMeta.color}18` }}
    >
      {typeMeta.marker}
    </div>
  );
}

function AdminPanel({ adminOverview, adminError, isExporting, onExportCsv, t, language }) {
  const summary = adminOverview?.summary || {};
  return (
    <section className="premium-card p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="section-eyebrow !px-3 !py-1.5">{t("profile.adminEyebrow")}</p>
          <h2 className="mt-4 text-2xl font-black text-white">{t("profile.adminTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {t("profile.adminDescription")}
          </p>
        </div>
        <button type="button" onClick={onExportCsv} disabled={isExporting} className="btn-primary self-start lg:self-auto">
          {isExporting ? t("profile.csvPreparing") : t("profile.csvDownload")}
        </button>
      </div>

      {adminError ? (
        <ErrorPanel title={t("profile.adminLoadError")} message={adminError} />
      ) : (
        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ProfileStatCard label={t("profile.registeredUsers")} value={formatCount(summary.totalUsers)} detail={t("profile.registeredUsersDetail")} accentColor="#38bdf8" />
            <ProfileStatCard label={t("profile.totalAnalyses")} value={formatCount(summary.totalAnalyses)} detail={t("profile.totalAnalysesAdminDetail")} accentColor="#2dd4bf" />
            <ProfileStatCard label={t("profile.recommendationCoverage")} value={formatPercent(summary.recommendationCoverageRate)} detail={t("profile.recommendationCoverageDetail")} accentColor="#f59e0b" />
            <ProfileStatCard label={t("profile.faceDetection")} value={formatPercent(summary.faceDetectedRate)} detail={t("profile.faceDetectionDetail")} accentColor="#fb7185" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoList
              title={t("profile.topEmotions")}
              items={(adminOverview?.topEmotions || []).slice(0, 4).map((item) => ({
                label: getEmotionMeta(item.key, language).label,
                value: item.count,
              }))}
              emptyText={t("profile.noTopEmotions")}
            />
            <InfoList
              title={t("profile.modelDistribution")}
              items={(adminOverview?.modelDistribution || []).map((item) => ({
                label: item.key,
                value: item.count,
              }))}
              emptyText={t("profile.noModelData")}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function DangerZone({
  showDeleteConfirm,
  setShowDeleteConfirm,
  deleteText,
  setDeleteText,
  deleteConfirmationText,
  isDeleting,
  onDelete,
  t,
}) {
  const isDeleteReady = deleteText.trim().toUpperCase() === String(deleteConfirmationText).toUpperCase();

  return (
    <section className="rounded-[1.75rem] border border-red-300/20 bg-red-400/10 p-6 shadow-2xl shadow-red-950/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-black text-red-50">{t("profile.deleteTitle")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-red-100/80">
            {t("profile.deleteDescription")}
          </p>
        </div>
        {!showDeleteConfirm && (
          <button type="button" onClick={() => setShowDeleteConfirm(true)} className="btn-secondary border-red-200/30 text-red-50 hover:bg-red-300/10">
            {t("profile.deleteButton")}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-5 rounded-2xl border border-red-200/20 bg-slate-950/35 p-4"
          >
            <p id="delete-confirmation-help" className="text-sm text-red-50">
              {t("profile.deleteHelp", { text: deleteConfirmationText })}
            </p>
            <label htmlFor="delete-confirmation-text" className="mt-4 block text-xs font-black uppercase tracking-[0.2em] text-red-100/70">
              {t("profile.deleteLabel")}
            </label>
            <input
              id="delete-confirmation-text"
              type="text"
              value={deleteText}
              onChange={(event) => setDeleteText(event.target.value)}
              aria-describedby="delete-confirmation-help delete-confirmation-state"
              className="input-field mt-3 border-red-200/20 focus:border-red-200/45 focus:ring-red-300/10"
              placeholder={deleteConfirmationText}
            />
            <p id="delete-confirmation-state" className="mt-2 text-xs text-red-100/70">
              {isDeleteReady ? t("profile.deleteReady") : t("profile.deleteNotReady")}
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting || !isDeleteReady}
                aria-busy={isDeleting}
                className="focus-ring flex-1 rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isDeleting ? t("profile.deleting") : t("profile.confirmDelete")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteText("");
                }}
                className="btn-secondary"
              >
                {t("profile.cancel")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function InfoList({ title, items, emptyText }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <h3 className="text-sm font-black text-white">{title}</h3>
      {items?.length ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={`${title}-${item.label}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm">
              <span className="min-w-0 truncate text-slate-300">{item.label}</span>
              <span className="ml-auto font-black text-white">{formatCount(item.value)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="skeleton-card h-36" />
        ))}
      </div>
      <div className="skeleton-card h-44" />
      <div className="skeleton-card h-44" />
    </div>
  );
}

function ErrorPanel({ title, message }) {
  return (
    <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-4" role="alert">
      <p className="text-sm font-black text-red-50">{title}</p>
      <p className="mt-1 text-sm leading-6 text-red-100/85">{message}</p>
    </div>
  );
}

function formatCount(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(Math.round(numeric)) : "0";
}

function formatPercent(value) {
  const numeric = Number(value);
  return `%${Number.isFinite(numeric) ? Math.round(Math.max(0, Math.min(100, numeric))) : 0}`;
}

function formatDate(value, language, t) {
  return value ? new Date(value).toLocaleDateString(language === "en" ? "en-US" : "tr-TR") : t("profile.newAccount");
}

function formatSavedDate(value, language = "tr", t) {
  return value ? new Date(value).toLocaleDateString(language === "en" ? "en-US" : "tr-TR") : t?.("profile.today") || "Bugün";
}

function getSavedRecommendationTypeMeta(type, t) {
  const meta = {
    music: { label: t("profile.types.music"), marker: "M", color: "#38bdf8" },
    movie: { label: t("profile.types.movie"), marker: "F", color: "#f59e0b" },
    book: { label: t("profile.types.book"), marker: "K", color: "#a78bfa" },
    advice: { label: t("profile.types.advice"), marker: "T", color: "#2dd4bf" },
  };

  return meta[type] || { ...meta.advice, label: t("profile.types.unknown") };
}

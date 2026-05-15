import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getEmotionMeta } from "../lib/emotions";
import { useColorStyle } from "../components/system/ColorStyleProvider";
import { adminAPI, spotifyAPI, userAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

export function ProfilePage() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { user, isLoggedIn, logout, updateUser } = useAuthStore();
  const { colorTheme, setColorTheme, themes } = useColorStyle();
  const [profile, setProfile] = useState(null);
  const [adminOverview, setAdminOverview] = useState(null);
  const [error, setError] = useState("");
  const [adminError, setAdminError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [savingColorTheme, setSavingColorTheme] = useState("");
  const [spotifyStatus, setSpotifyStatus] = useState(null);
  const [spotifyError, setSpotifyError] = useState("");
  const [spotifyConnecting, setSpotifyConnecting] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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

        try {
          const spotifyData = await spotifyAPI.getStatus();
          if (!cancelled) {
            setSpotifyStatus(spotifyData);
            setSpotifyError("");
          }
        } catch (spotifyRequestError) {
          if (!cancelled) {
            setSpotifyStatus(null);
            setSpotifyError(spotifyRequestError.message || t("profile.spotifyLoadError"));
          }
        }

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
    const preferredColorTheme = profile?.preferredColorTheme;
    if (!preferredColorTheme) {
      return;
    }

    setColorTheme(preferredColorTheme);
    updateUser({ preferredColorTheme });
  }, [profile?.preferredColorTheme, setColorTheme, updateUser]);

  if (!isLoggedIn) {
    return null;
  }

  const mostFrequentEmotion = getEmotionMeta(profile?.mostFrequentEmotion, i18n.language);
  const roleLabel = profile?.isAdmin ? t("profile.userRoleAdmin") : t("profile.userRoleMember");
  const deleteConfirmationText = profile?.deleteConfirmationText || "DELETE";
  const displayName = profile?.username || user?.username || t("profile.fallbackName");
  const displayEmail = profile?.email || user?.email || t("profile.fallbackEmail");
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

  async function handleColorThemeChange(nextTheme) {
    if (!nextTheme || nextTheme === colorTheme || savingColorTheme) {
      return;
    }

    const previousTheme = colorTheme;
    setSavingColorTheme(nextTheme);
    setColorTheme(nextTheme);

    try {
      const result = await userAPI.updateColorTheme(nextTheme);
      const preferredColorTheme = result.preferredColorTheme || nextTheme;
      setProfile((current) => current ? { ...current, preferredColorTheme } : current);
      updateUser({ preferredColorTheme });
      toast.success(t("profile.themeSaved"));
    } catch (requestError) {
      setColorTheme(previousTheme);
      updateUser({ preferredColorTheme: previousTheme });
      toast.error(requestError.message || t("profile.themeSaveError"));
    } finally {
      setSavingColorTheme("");
    }
  }

  async function handleSpotifyConnect() {
    if (spotifyConnecting) {
      return;
    }

    setSpotifyConnecting(true);
    try {
      const result = await spotifyAPI.getConnectUrl();
      if (!result?.authorizeUrl) {
        throw new Error(t("profile.spotifyConnectError"));
      }

      window.location.assign(result.authorizeUrl);
    } catch (requestError) {
      toast.error(requestError.message || t("profile.spotifyConnectError"));
      setSpotifyConnecting(false);
    }
  }

  return (
    <div className="page-shell aurora-bg app-page-tone profile-page">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mx-auto max-w-6xl space-y-4"
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
            <ProfileOverviewPanel
              totalAnalyses={profile?.totalAnalyses}
              mostFrequentEmotion={mostFrequentEmotion}
              membershipDate={formatDate(profile?.createdAt, i18n.language, t)}
              t={t}
            />

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(18rem,0.78fr)_minmax(0,1.22fr)]">
              <ProfileActionPanel
                onOpenSettings={() => setShowSettingsModal(true)}
                onOpenHistory={() => navigate("/history")}
                onNewAnalysis={() => navigate("/analyze")}
                onLogout={handleLogout}
                t={t}
              />
              <ProfileStatusPanel
                activeThemeLabel={themes.find((theme) => theme.id === colorTheme)?.label || colorTheme}
                languageLabel={i18n.language === "en" ? t("profile.languageEnglish") : t("profile.languageTurkish")}
                spotifyStatus={spotifyStatus}
                spotifyError={spotifyError}
                mostFrequentEmotion={mostFrequentEmotion}
                onOpenSettings={() => setShowSettingsModal(true)}
                deleteAccountNode={profile?.canDeleteAccount ? (
                  <DangerZone
                    embedded
                    showDeleteConfirm={showDeleteConfirm}
                    setShowDeleteConfirm={setShowDeleteConfirm}
                    deleteText={deleteText}
                    setDeleteText={setDeleteText}
                    deleteConfirmationText={deleteConfirmationText}
                    isDeleting={isDeleting}
                    onDelete={handleDeleteAccount}
                    t={t}
                  />
                ) : null}
                t={t}
              />
            </section>

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

          </>
        )}
      </motion.div>

      <AnimatePresence>
        {showSettingsModal && (
          <ProfileSettingsModal
            i18n={i18n}
            t={t}
            activeTheme={colorTheme}
            savingTheme={savingColorTheme}
            themes={themes}
            spotifyStatus={spotifyStatus}
            spotifyError={spotifyError}
            spotifyConnecting={spotifyConnecting}
            onClose={() => setShowSettingsModal(false)}
            onThemeSelect={handleColorThemeChange}
            onSpotifyConnect={handleSpotifyConnect}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileHero({ displayName, displayEmail, roleLabel, profile, mostFrequentEmotion, t, language }) {
  const initial = displayName.slice(0, 1).toUpperCase();
  const avatarUrl = profile?.avatarUrl || profile?.avatar_url || "";
  const dateLocale = String(language || "tr").startsWith("en") ? "en-US" : "tr-TR";
  const createdAtLabel = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(dateLocale)
    : "";

  return (
    <section className="surface-panel-strong relative overflow-hidden p-5 sm:p-6">
      <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full blur-3xl" style={{ backgroundColor: `${mostFrequentEmotion.accentColor}18` }} />
      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-end">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 text-xl font-black text-white shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${mostFrequentEmotion.accentColor}55, rgba(255,255,255,0.08))` }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <p className="section-eyebrow">{t("profile.profilePanel")}</p>
            <h1 className="mt-3 break-words text-2xl font-black leading-tight text-white sm:text-4xl">{displayName}</h1>
            <p className="mt-2 break-all text-sm text-slate-400 sm:break-normal">{displayEmail}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-bold text-cyan-100">
                {roleLabel}
              </span>
              {createdAtLabel && (
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-bold text-slate-300">
                  {t("profile.memberSince", { date: createdAtLabel })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <ProfileHeroMetric label={t("profile.accountRole")} value={roleLabel} />
            <ProfileHeroMetric
              label={t("profile.frequentEmotion")}
              value={mostFrequentEmotion.label}
              accentColor={mostFrequentEmotion.accentColor}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileSettingsModal({
  i18n,
  t,
  activeTheme,
  savingTheme,
  themes,
  spotifyStatus,
  spotifyError,
  spotifyConnecting,
  onClose,
  onThemeSelect,
  onSpotifyConnect,
  onLogout,
}) {
  const languages = [
    { key: "tr", label: t("profile.languageTurkish") },
    { key: "en", label: t("profile.languageEnglish") },
  ];
  const connected = Boolean(spotifyStatus?.connected);
  const [activePanel, setActivePanel] = useState("account");
  const settingsPanels = [
    { key: "account", label: t("profile.settingsNavAccount"), marker: "1" },
    { key: "appearance", label: t("profile.settingsNavAppearance"), marker: "2" },
    { key: "connections", label: t("profile.settingsNavConnections"), marker: "3" },
    { key: "session", label: t("profile.settingsNavSession"), marker: "4" },
  ];

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-settings-title"
        className="premium-card max-h-[calc(100svh-2rem)] w-full max-w-4xl overflow-hidden p-0 shadow-2xl"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div className="border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="section-eyebrow !px-3 !py-1.5">{t("profile.settingsEyebrow")}</p>
              <h2 id="profile-settings-title" className="mt-3 text-2xl font-black text-white">
                {t("profile.settingsTitle")}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {t("profile.settingsDescription")}
              </p>
            </div>
            <button type="button" onClick={onClose} className="btn-secondary shrink-0 !px-3 !py-2 text-sm">
              {t("profile.settingsClose")}
            </button>
          </div>
        </div>

        <div className="grid max-h-[calc(100svh-11rem)] min-h-[28rem] overflow-hidden md:grid-cols-[14rem_minmax(0,1fr)]">
          <aside className="border-b border-white/10 bg-white/[0.03] p-3 md:border-b-0 md:border-r">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
              {settingsPanels.map((panel) => {
                const active = activePanel === panel.key;
                return (
                  <button
                    key={panel.key}
                    type="button"
                    onClick={() => setActivePanel(panel.key)}
                    aria-pressed={active}
                    className={`focus-ring flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-black transition ${
                      active ? "bg-cyan-200/10 text-cyan-50" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-[11px]">
                      {panel.marker}
                    </span>
                    <span className="min-w-0 truncate">{panel.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="overflow-y-auto p-4 sm:p-5">
            {activePanel === "account" && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <h3 className="text-sm font-black text-white">{t("profile.languageTitle")}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t("profile.languageDescription")}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/10 p-1.5">
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
                        className={`min-h-11 rounded-xl px-3 py-2 text-sm font-black transition ${
                          active ? "bg-cyan-200/15 text-cyan-50" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        {language.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {activePanel === "appearance" && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-white">{t("profile.themeTitle")}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{t("profile.themeDescription")}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-2.5 py-1 text-[11px] font-black text-cyan-100">
                    {savingTheme ? t("profile.themeSaving") : t("profile.themeSynced")}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label={t("profile.themeTitle")}>
                  {themes.map((theme) => {
                    const active = activeTheme === theme.id;
                    const saving = savingTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => onThemeSelect(theme.id)}
                        disabled={Boolean(savingTheme)}
                        aria-pressed={active}
                        className={`focus-ring flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                          active
                            ? "border-cyan-200/30 bg-cyan-200/10 text-white"
                            : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.08]"
                        }`}
                      >
                        <span aria-hidden="true" className="h-7 w-7 shrink-0 rounded-full border border-white/20" style={{ background: theme.primary }} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black">{theme.label}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {saving ? t("profile.themeSaving") : active ? t("profile.themeSelected") : t("profile.themeApply")}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {activePanel === "connections" && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-white">{t("profile.spotifyTitle")}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{t("profile.spotifyDescription")}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black ${
                      connected
                        ? "border-emerald-200/20 bg-emerald-200/10 text-emerald-100"
                        : "border-white/10 bg-white/[0.05] text-slate-300"
                    }`}
                  >
                    {connected ? t("profile.spotifyConnected") : t("profile.spotifyDisconnected")}
                  </span>
                </div>
                {spotifyError && (
                  <p className="mt-3 rounded-xl border border-amber-200/15 bg-amber-200/10 px-3 py-2 text-xs leading-5 text-amber-100">
                    {spotifyError}
                  </p>
                )}
                <button type="button" onClick={onSpotifyConnect} disabled={spotifyConnecting} className="btn-primary mt-4 w-full !py-2.5 text-sm">
                  {spotifyConnecting
                    ? t("profile.spotifyConnecting")
                    : connected
                      ? t("profile.spotifyReconnect")
                      : t("profile.spotifyConnect")}
                </button>
              </section>
            )}

            {activePanel === "session" && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <h3 className="text-sm font-black text-white">{t("profile.sessionTitle")}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{t("profile.sessionDescription")}</p>
                <button type="button" onClick={onLogout} className="btn-secondary mt-4 w-full !py-2.5 text-sm">
                  {t("profile.logout")}
                </button>
              </section>
            )}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

function ProfileHeroMetric({ label, value, accentColor }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2.5">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-base font-black text-white" style={{ color: accentColor }}>
        {value}
      </p>
    </div>
  );
}

function ProfileOverviewPanel({ totalAnalyses, mostFrequentEmotion, membershipDate, t }) {
  return (
    <section className="grid grid-cols-3 gap-2 md:gap-3">
      <ProfileFact label={t("profile.totalAnalyses")} value={formatCount(totalAnalyses)} detail={t("profile.totalAnalysesDetail")} />
      <ProfileFact
        label={t("profile.frequentEmotion")}
        value={mostFrequentEmotion.label}
        detail={t("profile.frequentEmotionDetail")}
        accentColor={mostFrequentEmotion.accentColor}
      />
      <ProfileFact label={t("profile.membershipDate")} value={membershipDate} detail={t("profile.membershipDateDetail")} />
    </section>
  );
}

function ProfileFact({ label, value, detail, accentColor }) {
  return (
    <div className="premium-card min-h-[5.4rem] p-3 md:p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 md:text-xs">{label}</p>
      <p className="mt-1.5 break-words text-xl font-black text-white md:text-2xl" style={{ color: accentColor }}>
        {value}
      </p>
      <p className="mt-1.5 hidden text-xs leading-5 text-slate-500 sm:block">{detail}</p>
    </div>
  );
}

function ProfileActionPanel({ onOpenSettings, onOpenHistory, onNewAnalysis, onLogout, t }) {
  const actions = [
    { label: t("profile.openSettings"), detail: t("profile.openSettingsDetail"), marker: "A", onClick: onOpenSettings, primary: true },
    { label: t("profile.openHistory"), detail: t("profile.openHistoryDetail"), marker: "G", onClick: onOpenHistory },
    { label: t("profile.startAnalysis"), detail: t("profile.startAnalysisDetail"), marker: "Y", onClick: onNewAnalysis },
  ];

  return (
    <section className="premium-card p-4 sm:p-5">
      <p className="section-eyebrow !px-3 !py-1.5">{t("profile.quickActionsEyebrow")}</p>
      <h2 className="mt-3 text-xl font-black text-white">{t("profile.quickActionsTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{t("profile.quickActionsDescription")}</p>

      <div className="mt-4 grid gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={`focus-ring flex min-h-[4.25rem] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
              action.primary
                ? "border-cyan-200/25 bg-cyan-200/10 text-cyan-50 hover:bg-cyan-200/15"
                : "border-white/10 bg-white/[0.05] text-slate-200 hover:border-white/20 hover:bg-white/[0.08]"
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-xs font-black">
              {action.marker}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black">{action.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-400">{action.detail}</span>
            </span>
          </button>
        ))}
      </div>

      <button type="button" onClick={onLogout} className="btn-secondary mt-4 w-full !py-2.5 text-sm">
        {t("profile.logout")}
      </button>
    </section>
  );
}

function ProfileStatusPanel({ activeThemeLabel, languageLabel, spotifyStatus, spotifyError, mostFrequentEmotion, onOpenSettings, deleteAccountNode, t }) {
  const connected = Boolean(spotifyStatus?.connected);
  const statusRows = [
    { label: t("profile.currentTheme"), value: activeThemeLabel },
    { label: t("profile.currentLanguage"), value: languageLabel },
    {
      label: t("profile.spotifyStatusLabel"),
      value: spotifyError
        ? t("profile.spotifyStatusNeedsCheck")
        : connected
          ? t("profile.spotifyConnected")
          : t("profile.spotifyDisconnected"),
    },
  ];

  return (
    <section className="premium-card flex h-full flex-col p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem] lg:items-start">
        <div className="min-w-0">
          <p className="section-eyebrow !px-3 !py-1.5">{t("profile.statusEyebrow")}</p>
          <h2 className="mt-3 text-xl font-black text-white">{t("profile.statusTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{t("profile.statusDescription")}</p>
        </div>
        <button type="button" onClick={onOpenSettings} className="btn-primary self-start !py-2.5 text-sm lg:justify-self-end">
          {t("profile.settingsButton")}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {statusRows.map((row) => (
          <div key={row.label} className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{row.label}</p>
            <p className="mt-2 break-words text-sm font-black text-white">{row.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-base font-black"
            style={{ backgroundColor: `${mostFrequentEmotion.accentColor}20`, color: mostFrequentEmotion.accentColor }}
          >
            {mostFrequentEmotion.label.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-white">{t("profile.profileSignalTitle")}</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {t("profile.profileSignalDescription", { emotion: mostFrequentEmotion.label })}
            </p>
          </div>
        </div>
      </div>

      {deleteAccountNode && (
        <div className="mt-auto pt-4">
          {deleteAccountNode}
        </div>
      )}
    </section>
  );
}

function ProfileStatCard({ label, value, detail, accentColor }) {
  return (
    <div className="premium-card p-4">
      <p className="text-sm font-bold text-slate-400">{label}</p>
      <p className="mt-1.5 break-words text-2xl font-black text-white">{value}</p>
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
    <section className="premium-card flex h-full flex-col p-4 sm:p-5">
      <h2 className="text-lg font-black text-white">{t("profile.languageTitle")}</h2>
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
              className={`min-h-12 rounded-xl px-3 py-3 text-sm font-black transition ${
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

function ColorPalettePanel({ activeTheme, savingTheme, themes, onSelect, t }) {
  return (
    <section className="premium-card h-full p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-white">{t("profile.themeTitle")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {t("profile.themeDescription")}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-xs font-black text-cyan-100">
          {savingTheme ? t("profile.themeSaving") : t("profile.themeSynced")}
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3" role="group" aria-label={t("profile.themeTitle")}>
        {themes.map((theme) => {
          const active = activeTheme === theme.id;
          const saving = savingTheme === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelect(theme.id)}
              disabled={Boolean(savingTheme)}
              aria-pressed={active}
              className={`focus-ring flex min-h-[4rem] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                active
                  ? "border-cyan-200/30 bg-cyan-200/10 text-white"
                  : "border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/20 hover:bg-white/[0.08]"
              }`}
            >
              <span
                aria-hidden="true"
                className="h-8 w-8 shrink-0 rounded-full border border-white/20"
                style={{ background: theme.primary }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{theme.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {saving ? t("profile.themeSaving") : active ? t("profile.themeSelected") : t("profile.themeApply")}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SessionPanel({ onLogout, t }) {
  return (
    <section className="premium-card flex h-full flex-col justify-between p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-black text-white">{t("profile.sessionTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{t("profile.sessionDescription")}</p>
      </div>
      <button type="button" onClick={onLogout} className="btn-secondary mt-4 w-full !py-2.5 text-sm">
        {t("profile.logout")}
      </button>
    </section>
  );
}

function SpotifyPanel({ status, error, connecting, onConnect, t, language = "tr" }) {
  const connected = Boolean(status?.connected);
  const topTracks = Array.isArray(status?.topTracks) ? status.topTracks.slice(0, 3) : [];
  const dateLocale = String(language || "tr").startsWith("en") ? "en-US" : "tr-TR";
  const lastSyncedAt = status?.lastSyncedAt
    ? new Date(status.lastSyncedAt).toLocaleDateString(dateLocale)
    : "";

  return (
    <section className="premium-card h-full p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="section-eyebrow !px-3 !py-1.5">{t("profile.spotifyEyebrow")}</p>
          <h2 className="mt-3 text-xl font-black text-white">{t("profile.spotifyTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {t("profile.spotifyDescription")}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 lg:min-w-48 lg:items-end">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${
              connected
                ? "border-emerald-200/20 bg-emerald-200/10 text-emerald-100"
                : "border-white/10 bg-white/[0.05] text-slate-300"
            }`}
          >
            {connected ? t("profile.spotifyConnected") : t("profile.spotifyDisconnected")}
          </span>
          <button type="button" onClick={onConnect} disabled={connecting} className="btn-primary w-full whitespace-nowrap !px-4 !py-2.5 text-sm sm:w-auto sm:min-w-44">
            {connecting
              ? t("profile.spotifyConnecting")
              : connected
                ? t("profile.spotifyReconnect")
                : t("profile.spotifyConnect")}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/10 px-3 py-2.5 text-sm leading-6 text-amber-100">
          {error}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3.5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{t("profile.spotifySignalTitle")}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {connected ? t("profile.spotifySignalReady") : t("profile.spotifySignalWaiting")}
            </p>
            {lastSyncedAt && (
              <p className="mt-3 text-xs font-bold text-slate-500">
                {t("profile.spotifyLastSync", { date: lastSyncedAt })}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{t("profile.spotifyTracksTitle")}</p>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-slate-400">
                {t("profile.spotifyTracksWindow")}
              </span>
            </div>
            {topTracks.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {topTracks.map((track, index) => (
                  <div key={`${track.title || "track"}-${index}`} className="rounded-xl border border-white/10 bg-black/10 px-3 py-2.5">
                    <p className="truncate text-sm font-black text-white">{track.title || t("profile.spotifyUnknownTrack")}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {Array.isArray(track.artists) && track.artists.length > 0
                        ? track.artists.join(", ")
                        : t("profile.spotifyUnknownArtist")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-400">
                {connected ? t("profile.spotifyTracksEmptyConnected") : t("profile.spotifyTracksEmptyDisconnected")}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
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
  embedded = false,
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
    <section className={`${embedded ? "rounded-2xl p-4" : "rounded-[1.5rem] p-5 sm:p-6"} border border-red-300/20 bg-red-400/10 shadow-2xl shadow-red-950/10`}>
      <div className={`${embedded ? "gap-3 xl:flex-row xl:items-end xl:justify-between" : "gap-4 lg:min-h-28 lg:flex-row lg:items-end lg:justify-between"} flex flex-col`}>
        <div className="min-w-0">
          <h2 className={`${embedded ? "text-base" : "text-2xl"} font-black text-red-50`}>{t("profile.deleteTitle")}</h2>
          <p className={`${embedded ? "mt-1 text-xs leading-5" : "mt-2 text-sm leading-6"} max-w-3xl text-red-100/80`}>
            {t("profile.deleteDescription")}
          </p>
        </div>
        {!showDeleteConfirm && (
          <button type="button" onClick={() => setShowDeleteConfirm(true)} className="btn-secondary self-start border-red-200/30 text-red-50 hover:bg-red-300/10 xl:self-end">
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="skeleton-card h-32" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(17rem,0.82fr)_minmax(0,1.18fr)]">
        <div className="skeleton-card h-60" />
        <div className="skeleton-card h-60" />
        <div className="skeleton-card h-72" />
        <div className="skeleton-card h-72" />
      </div>
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
  return value ? new Date(value).toLocaleDateString(String(language || "tr").startsWith("en") ? "en-US" : "tr-TR") : t("profile.newAccount");
}

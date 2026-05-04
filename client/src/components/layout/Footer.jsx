import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="relative z-10 mt-auto border-t border-white/10 bg-slate-950/35 py-8 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
        <div className="flex items-center gap-3">
          <span className="orb h-9 w-9 shrink-0" aria-hidden="true">
            <span className="relative z-10 h-2 w-2 rounded-full bg-cyan-100" />
          </span>
          <div>
            <p className="text-sm font-black text-white">{t("common.productName")}</p>
            <p className="text-xs text-slate-400">{t("footer.description")}</p>
          </div>
        </div>

        <div className="text-xs leading-relaxed text-slate-500">
          <p>{t("footer.university")}</p>
          <p>{t("footer.team")}</p>
        </div>

        <div className="text-xs text-slate-500">
          (c) {new Date().getFullYear()} {t("footer.projectLabel")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;

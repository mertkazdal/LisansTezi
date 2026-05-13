import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="relative z-10 mt-auto border-t border-white/10 bg-slate-950/22 py-6 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-slate-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-black text-white">{t("common.productName")}</p>
          <p className="mt-1 text-xs leading-5">{t("footer.description")}</p>
        </div>
        <div className="text-xs leading-5 lg:text-right">
          <p>{t("footer.university")}</p>
          <p>{t("footer.team")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

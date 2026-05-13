import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import LiveFeedWidget from "./LiveFeedWidget";
import ThemePicker from "./system/ThemePicker";

export default function HeroSection({ copy, primaryCta, secondaryCta, metrics, activeExample, setActiveExample }) {
  return (
    <section className="yc-hero-shell">
      <motion.div
        className="yc-hero-copy"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.08 } },
        }}
      >
        <motion.p className="yc-hero-badge" variants={fadeUp}>
          {copy.eyebrow}
        </motion.p>
        <motion.h1 variants={fadeUp}>
          <span>{copy.title}</span>
          <strong>{copy.titleAccent}</strong>
        </motion.h1>
        <motion.p className="yc-hero-copy__lead" variants={fadeUp}>
          {copy.subtitle}
        </motion.p>

        <motion.div className="yc-hero-actions" variants={fadeUp}>
          <Link to="/analyze" className="yc-btn yc-btn--primary">
            {primaryCta}
          </Link>
          <Link to={secondaryCta.to} className="yc-btn yc-btn--ghost">
            {secondaryCta.label}
          </Link>
        </motion.div>

        <motion.div className="yc-hero-tabs" variants={fadeUp}>
          {metrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </motion.div>

        <motion.div className="yc-hero-theme" variants={fadeUp}>
          <ThemePicker />
        </motion.div>
      </motion.div>

      <LiveFeedWidget copy={copy} activeExample={activeExample} setActiveExample={setActiveExample} />
    </section>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
};

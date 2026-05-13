import { motion } from "framer-motion";
import EmotionBubble from "./EmotionBubble";
import ResultCard from "./ResultCard";
import StepFlow from "./StepFlow";

export default function LiveFeedWidget({ copy, activeExample, setActiveExample }) {
  const example = copy.examples[activeExample] || copy.examples[0];

  return (
    <motion.aside
      className="yc-live-widget"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.12 }}
    >
      <div className="yc-live-widget__header">
        <div>
          <p>{copy.sideEyebrow}</p>
          <h2>{copy.sideTitle}</h2>
        </div>
        <span className="yc-live-widget__mark">AI</span>
      </div>

      <div className="yc-live-widget__stage">
        {copy.orbitLabels.map((label, index) => (
          <span
            key={label}
            className={`yc-floating-chip yc-floating-chip--${index + 1}`}
          >
            {label}
          </span>
        ))}
        <EmotionBubble emotion={example.mood} label={copy.radarLabel} />
      </div>

      <StepFlow steps={copy.steps} />

      <div className="yc-example-grid">
        <div className="yc-example-list" role="tablist" aria-label={copy.examplesEyebrow}>
          {copy.examples.map((item, index) => (
            <button
              key={item.title}
              type="button"
              className={activeExample === index ? "is-active" : ""}
              onClick={() => setActiveExample(index)}
              aria-pressed={activeExample === index}
            >
              <span>{item.mood}</span>
              {item.title}
            </button>
          ))}
        </div>
        <ResultCard eyebrow={copy.examplesEyebrow} example={example} />
      </div>
    </motion.aside>
  );
}

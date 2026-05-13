import { motion } from "framer-motion";

export default function ResultCard({ eyebrow, example }) {
  return (
    <motion.article
      key={example.title}
      className="yc-result-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <p className="yc-result-card__eyebrow">{eyebrow}</p>
      <h3>{example.title}</h3>
      <p>{example.text}</p>
      <div className="yc-result-card__highlight">
        <span>{example.resultLabel}</span>
        <strong>{example.result}</strong>
      </div>
    </motion.article>
  );
}

import { motion } from "framer-motion";

export default function EmotionBubble({ emotion, label }) {
  return (
    <div className="yc-emotion-bubble" aria-label={`${emotion} - ${label}`}>
      <motion.span
        className="yc-emotion-bubble__pulse"
        animate={{ scale: [1, 1.12, 1], opacity: [0.38, 0.78, 0.38] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="yc-emotion-bubble__core"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <strong>{emotion}</strong>
        <span>{label}</span>
      </motion.div>
    </div>
  );
}

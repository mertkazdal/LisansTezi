import { motion } from "framer-motion";

export default function StepFlow({ steps }) {
  return (
    <div className="yc-step-flow" aria-label="Analiz akışı">
      {steps.map((step, index) => (
        <div className="yc-step-flow__item" key={step.title}>
          <span className="yc-step-flow__number">{index + 1}</span>
          <div>
            <strong>{step.title}</strong>
            <p>{step.description}</p>
          </div>
          {index < steps.length - 1 && (
            <motion.span
              className="yc-step-flow__arrow"
              aria-hidden="true"
              animate={{ x: [0, 7, 0], opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: index * 0.18 }}
            >
              →
            </motion.span>
          )}
        </div>
      ))}
    </div>
  );
}

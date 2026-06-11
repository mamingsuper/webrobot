import { motion, useReducedMotion } from "framer-motion";

export function GradientBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[color:var(--site-bg)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.032)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.032)_1px,transparent_1px)] bg-[size:52px_52px]" />
      <div className="absolute left-0 right-0 top-0 h-32 bg-gradient-to-b from-[color:var(--site-bg)] to-transparent" />
      <div className="absolute inset-y-0 left-[7%] w-px bg-[rgba(15,23,42,0.045)]" />
      <div className="absolute inset-y-0 right-[9%] hidden w-px bg-[rgba(15,23,42,0.045)] lg:block" />

      {!reduceMotion && (
        <>
          {[0, 1, 2].map((line) => (
            <motion.div
              key={line}
              className="absolute left-[-22%] h-px w-[42%] bg-gradient-to-r from-transparent via-[color:var(--teal)] to-transparent opacity-20"
              style={{ top: `${28 + line * 19}%` }}
              animate={{ x: ["0vw", "150vw"] }}
              transition={{
                duration: 24 + line * 5,
                delay: line * 1.8,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

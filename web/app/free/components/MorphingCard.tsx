"use client";

import { motion, cubicBezier } from "framer-motion";

const easing = cubicBezier(0.2, 0.8, 0.2, 1);

const morphVariants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: 8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easing,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -8,
    transition: {
      duration: 0.3,
      ease: easing,
    },
  },
};

export function MorphingCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={morphVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-[320px]"
    >
      {children}
    </motion.div>
  );
}

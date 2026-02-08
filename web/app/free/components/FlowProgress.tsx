"use client";

import { motion, cubicBezier } from "framer-motion";
import type { FlowStep } from "@/lib/types";

const easing = cubicBezier(0.2, 0.8, 0.2, 1);

const STEPS: FlowStep[] = ["time", "transport", "results"];

export function FlowProgress({
  currentStep,
  className = "",
}: {
  currentStep: FlowStep;
  className?: string;
}) {
  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {STEPS.map((step, idx) => (
        <div key={step} className="relative flex-1">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{
                scaleX: idx <= currentIndex ? 1 : 0,
              }}
              transition={{
                duration: 0.4,
                ease: easing,
              }}
              style={{ originX: 0 }}
              className="h-full bg-[var(--accent)]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

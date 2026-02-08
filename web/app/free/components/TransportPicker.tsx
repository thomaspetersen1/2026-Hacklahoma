"use client";

import { motion, cubicBezier } from "framer-motion";
import { Footprints, Car, Bus } from "lucide-react";
import type { TravelMode } from "@/lib/types";

const easing = cubicBezier(0.2, 0.8, 0.2, 1);

const TRANSPORT_OPTIONS: Array<{
  mode: TravelMode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = [
  { mode: "WALK", icon: Footprints, label: "Walk" },
  { mode: "DRIVE", icon: Car, label: "Drive" },
  { mode: "TRANSIT", icon: Bus, label: "Transit" },
];

export function TransportPicker({
  onSelect,
}: {
  onSelect: (mode: TravelMode) => void;
}) {
  return (
    <div className="space-y-3">
      {TRANSPORT_OPTIONS.map(({ mode, icon: Icon, label }, idx) => (
        <motion.button
          key={mode}
          type="button"
          onClick={() => onSelect(mode)}
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: 1,
            x: 0,
            transition: {
              delay: idx * 0.08,
              duration: 0.4,
              ease: easing,
            },
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="glass group w-full flex items-center gap-4 rounded-2xl p-5 text-left transition hover:border-white/25"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/5 transition group-hover:bg-white/10">
            <Icon className="h-6 w-6 text-[var(--accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-[0.22em] text-white/60">
              Travel by
            </div>
            <div className="mt-1 text-lg font-semibold text-white/95">
              {label}
            </div>
          </div>
          <div className="shrink-0 text-white/40 transition group-hover:translate-x-1 group-hover:text-white/60">
            →
          </div>
        </motion.button>
      ))}
    </div>
  );
}

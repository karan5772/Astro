"use client";

import { motion, AnimatePresence } from "framer-motion";

interface QuestionCardProps {
  question: string;
  options: string[];
  currentIndex: number;
  total: number;
  onSelect: (option: string) => void;
  onSkip: () => void;
}

export default function QuestionCard({
  question,
  options,
  currentIndex,
  total,
  onSelect,
  onSkip,
}: QuestionCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="w-full relative rounded-2xl overflow-hidden bg-card border border-border shadow-lg"
        style={{
          boxShadow:
            "0 0 0 1px rgba(109,93,251,0.15), 0 8px 32px rgba(109,93,251,0.08), 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* Animated progress line — top edge */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-foreground/[0.05]">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #6D5DFB, #a78bfa)",
            }}
            initial={{ width: `${(currentIndex / total) * 100}%` }}
            animate={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Ambient glow orb */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(109,93,251,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Decorative star field */}
        <div className="absolute top-4 right-5 text-[9px] tracking-[5px] text-foreground/[0.06] select-none pointer-events-none">
          ✦ ✦ ✦ ✦
        </div>

        <div className="relative px-5 pt-5 pb-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-primary" style={{ fontSize: 9 }}>✦</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                Question {currentIndex + 1}
              </span>
              <span className="text-[10px] text-foreground/25">/ {total}</span>
            </div>
            <button
              onClick={onSkip}
              className="flex items-center gap-1 text-[11px] text-foreground/25 hover:text-foreground/55 transition-colors cursor-pointer group"
            >
              Skip
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </button>
          </div>

          {/* Question text */}
          <p className="text-[15px] font-semibold text-foreground/90 leading-snug mb-5 pr-2">
            {question}
          </p>

          {/* Options — full-width rows with left accent */}
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <motion.button
                key={opt}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, delay: 0.05 + i * 0.07 }}
                onClick={() => onSelect(opt)}
                className="group w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-foreground/[0.02] hover:bg-primary/[0.07] hover:border-primary/30 transition-all duration-200 cursor-pointer"
              >
                {/* Left accent bar */}
                <span className="w-[3px] h-4 rounded-full bg-foreground/10 group-hover:bg-primary transition-colors duration-200 shrink-0" />

                <span className="flex-1 text-sm text-foreground/55 group-hover:text-foreground/90 transition-colors duration-200">
                  {opt}
                </span>

                <span className="text-xs text-transparent group-hover:text-primary/70 transition-colors duration-200">
                  →
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

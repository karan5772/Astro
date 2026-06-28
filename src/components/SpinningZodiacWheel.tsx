'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const COLORS = ['#ff6b35','#51cf66','#74c0fc','#4dabf7','#ffd43b','#63e6be','#f783ac','#e64980','#ff8c00','#868e96','#74c0fc','#cc5de8'];

export default function SpinningZodiacWheel({ status }: { status: string }) {
  const S = 260, CX = 130, CY = 130, OR = 118, IR = 72, GR = 95, GAP = 2;
  const rad = (d: number) => (d * Math.PI) / 180;

  const arc = (i: number) => {
    const s = rad(i * 30 - 90 + GAP / 2);
    const e = rad((i + 1) * 30 - 90 - GAP / 2);
    const p = (a: number, r: number) => [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
    const [ox1, oy1] = p(s, OR); const [ox2, oy2] = p(e, OR);
    const [ix2, iy2] = p(e, IR); const [ix1, iy1] = p(s, IR);
    return `M ${ox1} ${oy1} A ${OR} ${OR} 0 0 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${IR} ${IR} 0 0 0 ${ix1} ${iy1} Z`;
  };

  const glyphAt = (i: number) => {
    const mid = rad((i + 0.5) * 30 - 90);
    return [CX + GR * Math.cos(mid), CY + GR * Math.sin(mid)] as const;
  };

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      >
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
          {GLYPHS.map((g, i) => {
            const [gx, gy] = glyphAt(i);
            return (
              <g key={i}>
                <path d={arc(i)} fill={COLORS[i]} opacity={0.45 + (i % 3) * 0.12} />
                <text x={gx} y={gy} textAnchor="middle" dominantBaseline="middle"
                  fontSize="11" fill="rgba(255,255,255,0.55)">{g}</text>
              </g>
            );
          })}
        </svg>
      </motion.div>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-[140px] h-[140px] rounded-full bg-background flex flex-col items-center justify-center gap-2">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            <Sparkles size={22} className="text-primary" />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.p
              key={status}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="text-[9px] text-foreground/35 text-center px-4 leading-tight"
            >
              {status}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Globe, Search, Loader2, Sparkles, ArrowRight,
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-time-picker';
import { TimePicker } from '@/components/ui/date-time-picker';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeocodeResult { name: string; latitude: number; longitude: number }

// ── Spinning zodiac wheel (loading step) ──────────────────────────────────────

const GLYPHS  = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const COLORS  = ['#ff6b35','#51cf66','#74c0fc','#4dabf7','#ffd43b','#63e6be','#f783ac','#e64980','#ff8c00','#868e96','#74c0fc','#cc5de8'];

function SpinningZodiacWheel({ status }: { status: string }) {
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

      {/* Rotating ring */}
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

      {/* Static center — sits over the spinning ring */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-[140px] h-[140px] rounded-full bg-[#0c0d12] flex flex-col items-center justify-center gap-2">
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
              className="text-[9px] text-white/35 text-center px-4 leading-tight"
            >
              {status}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Shared field styles ───────────────────────────────────────────────────────

const FIELD = 'w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.07] rounded-xl text-sm text-white placeholder-white/20 outline-none focus:border-primary/40 transition-colors';
const LABEL = 'block text-[10px] uppercase tracking-widest text-white/30 mb-2 font-medium';

const stepVariants = {
  enter: (d: number) => ({ x: d > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: d > 0 ? -56 : 56, opacity: 0 }),
};

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  onComplete: (data: any) => void;
}

export default function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep]       = useState<1 | 2 | 3>(1);
  const [dir, setDir]         = useState(1);
  const [status, setStatus]   = useState('Reading the stars…');

  // Form state
  const [birthDate, setBirthDate]             = useState('');
  const [birthTime, setBirthTime]             = useState('');
  const [locationQuery, setLocationQuery]     = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [latitude, setLatitude]               = useState<number | null>(null);
  const [longitude, setLongitude]             = useState<number | null>(null);
  const [timezone, setTimezone]               = useState('+05:30');
  const [suggestions, setSuggestions]         = useState<GeocodeResult[]>([]);
  const [searching, setSearching]             = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Auto-detect timezone
  useEffect(() => {
    const offset = -new Date().getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    setTimezone(`${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`);
  }, []);

  // Location search debounce
  useEffect(() => {
    if (!locationQuery || locationQuery === selectedLocation || locationQuery.trim().length < 2) {
      setSuggestions([]); return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(locationQuery)}`);
        if (res.ok) setSuggestions(await res.json());
      } catch { /* swallow */ }
      finally { setSearching(false); }
    }, 380);
    return () => clearTimeout(t);
  }, [locationQuery, selectedLocation]);

  // Click outside
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSuggestions([]);
    };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, []);

  const go = (s: 1 | 2 | 3, d = 1) => { setDir(d); setStep(s); };

  const handleStep1 = () => {
    if (!birthDate || !birthTime) { toast.error('Please enter your date and time of birth.'); return; }
    go(2);
  };

  const handleStep2 = async () => {
    if (!selectedLocation || latitude === null || longitude === null) {
      toast.error('Select a location from the suggestions.'); return;
    }
    go(3);

    const statuses = [
      'Reading the stars…',
      'Mapping planetary positions…',
      'Calculating Vedic placements…',
      'Generating your birth chart…',
    ];
    let i = 0;
    const iv = setInterval(() => { i = (i + 1) % statuses.length; setStatus(statuses[i]); }, 1800);

    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDate, birthTime, birthTimezone: timezone,
          birthLocation: selectedLocation,
          birthLatitude: latitude,
          birthLongitude: longitude,
        }),
      });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Server error'); }
      const data = await res.json();
      setStatus('Your chart is ready ✨');
      setTimeout(() => onComplete(data), 900);
    } catch (err: any) {
      clearInterval(iv);
      toast.error(`Failed: ${err.message}`);
      go(2, -1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d12] text-white flex items-center justify-center px-5">
      {/* Ambient orbs */}
      <div className="fixed w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none -top-32 -left-32" />
      <div className="fixed w-[400px] h-[400px] rounded-full bg-purple-900/8 blur-3xl pointer-events-none -bottom-20 -right-20" />

      <div className="w-full max-w-sm relative z-10">

        {/* Step dots */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-2 mb-12">
            {[1, 2].map(s => (
              <motion.div key={s} className="rounded-full"
                animate={{ width: step === s ? 28 : 7, backgroundColor: step === s ? '#6D5DFB' : 'rgba(255,255,255,0.12)' }}
                style={{ height: 7 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait" custom={dir}>

          {/* ── Step 1: Date & Time ────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="s1" custom={dir} variants={stepVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}>

              <div className="text-center mb-10">
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60 mb-3">Step 1 of 2</p>
                <h1 className="text-[28px] font-bold text-white mb-2 leading-tight">When were you born?</h1>
                <p className="text-[13px] text-white/30 leading-relaxed">
                  Your exact birth time shapes every planetary placement in your chart.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={LABEL}>Date of Birth</label>
                  <DatePicker
                    value={birthDate}
                    onChange={setBirthDate}
                    placeholder="Select your birth date"
                  />
                </div>
                <div>
                  <label className={LABEL}>Time of Birth</label>
                  <TimePicker
                    value={birthTime}
                    onChange={setBirthTime}
                    placeholder="Select your birth time"
                  />
                  <p className="text-[10px] text-white/20 mt-1.5 pl-0.5">
                    Your timezone will be set in the next step
                  </p>
                </div>

                <button onClick={handleStep1}
                  className="w-full mt-3 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                  Continue <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Location ───────────────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="s2" custom={dir} variants={stepVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}>

              <div className="text-center mb-10">
                <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60 mb-3">Step 2 of 2</p>
                <h1 className="text-[28px] font-bold text-white mb-2 leading-tight">Where were you born?</h1>
                <p className="text-[13px] text-white/30 leading-relaxed">
                  Your birth location determines your ascendant and house positions.
                </p>
              </div>

              <div className="space-y-4">
                {/* Location search */}
                <div ref={searchRef} className="relative">
                  <label className={LABEL}><MapPin size={9} className="inline mr-1.5" />Birth Place</label>
                  <div className="relative">
                    <input type="text" placeholder="Search city…" value={locationQuery}
                      onChange={e => { setLocationQuery(e.target.value); setSelectedLocation(''); }}
                      className={`${FIELD} pr-11`} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25">
                      {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div
                        className="absolute top-[calc(100%+6px)] left-0 right-0 bg-[#16171e] border border-white/[0.08] rounded-xl z-50 max-h-48 overflow-y-auto shadow-2xl"
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}>
                        {suggestions.map((loc, idx) => (
                          <button key={idx} type="button"
                            onClick={() => {
                              setLocationQuery(loc.name);
                              setSelectedLocation(loc.name);
                              setLatitude(loc.latitude);
                              setLongitude(loc.longitude);
                              setSuggestions([]);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/[0.04] last:border-0 text-white/65 text-xs flex items-center gap-2.5 transition-colors">
                            <MapPin size={11} className="text-primary/60 shrink-0" />
                            <span className="truncate">{loc.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Timezone */}
                <div>
                  <label className={LABEL}><Globe size={9} className="inline mr-1.5" />Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} className={FIELD}>
                    {[
                      ['-12:00','UTC−12'],  ['-11:00','UTC−11'],  ['-10:00','UTC−10'],
                      ['-09:00','UTC−09'],  ['-08:00','UTC−08 (PST)'], ['-07:00','UTC−07 (MST)'],
                      ['-06:00','UTC−06 (CST)'], ['-05:00','UTC−05 (EST)'], ['-04:00','UTC−04 (AST)'],
                      ['-03:00','UTC−03'],  ['+00:00','UTC+00 (GMT)'], ['+01:00','UTC+01 (CET)'],
                      ['+02:00','UTC+02 (EET)'], ['+03:00','UTC+03'], ['+04:00','UTC+04 (GST)'],
                      ['+05:00','UTC+05'],  ['+05:30','UTC+05:30 (IST)'], ['+05:45','UTC+05:45 (NPT)'],
                      ['+06:00','UTC+06'],  ['+07:00','UTC+07'],  ['+08:00','UTC+08 (SGT)'],
                      ['+09:00','UTC+09 (JST)'], ['+09:30','UTC+09:30'], ['+10:00','UTC+10 (AEST)'],
                      ['+12:00','UTC+12 (NZST)'],
                    ].map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Coordinates preview */}
                {latitude !== null && longitude !== null && (
                  <motion.p
                    initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-white/25 pl-0.5 flex items-center gap-1.5">
                    <MapPin size={9} className="text-primary/40" />
                    {latitude.toFixed(3)}°, {longitude.toFixed(3)}°
                  </motion.p>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => go(1, -1)}
                    className="px-5 py-3.5 rounded-xl border border-white/[0.08] text-white/35 text-xs font-medium hover:text-white/55 transition-colors">
                    Back
                  </button>
                  <button onClick={handleStep2}
                    className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                    Calculate my chart <Sparkles size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Calculating ─────────────────────────────────────────── */}
          {step === 3 && (
            <motion.div key="s3"
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
              <div className="flex flex-col items-center gap-10">
                <SpinningZodiacWheel status={status} />
                <div className="text-center">
                  <p className="text-[11px] text-white/20 uppercase tracking-widest">
                    This may take a moment
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

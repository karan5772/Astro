'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Globe, Search, Loader2, ArrowRight, RotateCcw, Download, Printer } from 'lucide-react';
import SpinningZodiacWheel from '@/components/SpinningZodiacWheel';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { DatePicker } from '@/components/ui/date-time-picker';
import { TimePicker } from '@/components/ui/date-time-picker';

interface GeocodeResult { name: string; latitude: number; longitude: number }


// ── Shared styles + transitions ───────────────────────────────────────────────

const FIELD = 'w-full px-4 py-3.5 bg-foreground/[0.04] border border-border rounded-xl text-sm text-foreground placeholder-white/20 outline-none focus:border-primary/40 transition-colors';
const LABEL = 'block text-[10px] uppercase tracking-widest text-foreground/30 mb-2 font-medium';

const stepVariants = {
  enter: (d: number) => ({ x: d > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (d: number) => ({ x: d > 0 ? -56 : 56, opacity: 0 }),
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BirthChartPage() {
  // Multi-step state
  const [step, setStep] = useState<1|2|3|4>(1);
  const [dir, setDir] = useState(1);
  const [calcStatus, setCalcStatus] = useState('Reading the stars…');

  // Form state (prefilled from user data)
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timezoneOffset, setTimezoneOffset] = useState('+05:30');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Result state
  const [svgData, setSvgData] = useState<string | null>(null);

  // Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      if (typeof window !== 'undefined')
        setSidebarCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    };
    handleSync();
    window.addEventListener('sidebar-collapse-change', handleSync);
    return () => window.removeEventListener('sidebar-collapse-change', handleSync);
  }, []);

  // Timezone auto-detect + user data prefill
  useEffect(() => {
    document.body.classList.add('astraeus-active');

    const offset = -new Date().getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    setTimezoneOffset(`${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`);

    fetch('/api/user')
      .then(r => r.json())
      .then(data => {
        if (data.hasBirthDetails) {
          setDate(data.birthDate || '');
          setTime(data.birthTime || '');
          setTimezoneOffset(data.birthTimezone || '+05:30');
          setLocationQuery(data.birthLocation || '');
          setSelectedLocation(data.birthLocation || '');
          setLatitude(data.birthLatitude);
          setLongitude(data.birthLongitude);
        }
      })
      .catch(() => {});

    return () => { document.body.classList.remove('astraeus-active'); };
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

  // Click outside suggestions
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSuggestions([]);
    };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, []);

  const go = (s: 1|2|3|4, d = 1) => { setDir(d); setStep(s); };

  const handleStep1 = () => {
    if (!date || !time) { toast.error('Please enter your date and time of birth.'); return; }
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
      'Drawing your natal chart…',
    ];
    let i = 0;
    const iv = setInterval(() => { i = (i + 1) % statuses.length; setCalcStatus(statuses[i]); }, 1800);

    try {
      const res = await fetch('/api/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date, time, timezoneOffset,
          locationName: selectedLocation,
          latitude, longitude,
        }),
      });
      clearInterval(iv);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Server error'); }
      const data = await res.json();
      setSvgData(data.svg);
      setCalcStatus('Your chart is ready ✨');
      setTimeout(() => go(4), 900);
    } catch (err: any) {
      clearInterval(iv);
      toast.error(`Chart failed: ${err.message}`);
      go(2, -1);
    }
  };

  const handleDownloadSVG = () => {
    if (!svgData) return;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `birth_chart_${date.replace(/-/g, '')}_${time.replace(/:/g, '')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Chart downloaded!');
  };

  const handlePrint = () => {
    if (!svgData) return;
    const w = window.open('', '_blank');
    if (!w) { toast.error('Popup blocked. Please allow popups.'); return; }
    w.document.write(`
      <html><head><title>Birth Chart</title>
      <style>body{background:#fff;display:flex;flex-direction:column;align-items:center;padding:32px;font-family:sans-serif}
      svg{width:100%;max-width:520px;height:auto;margin-top:16px}</style></head>
      <body><h2>Natal Birth Chart</h2>
      <p>${date} · ${time} (${timezoneOffset}) · ${selectedLocation}</p>
      ${svgData}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row selection:bg-primary/30 selection:text-white">
      <Sidebar />

      <main className={`flex-1 flex items-center justify-center min-h-screen px-5 pt-24 pb-10 lg:py-16 relative z-10 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'}`}>

        {/* Ambient orbs */}
        <div className="fixed w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none -top-32 -left-32" />
        <div className="fixed w-[400px] h-[400px] rounded-full bg-purple-900/8 blur-3xl pointer-events-none -bottom-20 -right-20" />

        <div className={`w-full relative z-10 transition-all duration-300 ${step === 4 ? 'max-w-lg' : 'max-w-sm'}`}>

          {/* Step pill dots — visible on steps 1 & 2 */}
          {(step === 1 || step === 2) && (
            <div className="flex items-center justify-center gap-2 mb-12">
              {[1, 2].map(s => (
                <motion.div key={s}
                  className={`rounded-full ${step === s ? 'bg-primary' : 'bg-foreground/10'}`}
                  animate={{ width: step === s ? 28 : 7 }}
                  style={{ height: 7 }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait" custom={dir}>

            {/* ── Step 1: Date & Time ──────────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="s1" custom={dir} variants={stepVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}>

                <div className="text-center mb-10">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 mb-3">Step 1 of 2</p>
                  <h1 className="text-[28px] font-bold text-foreground mb-2 leading-tight">When were you born?</h1>
                  <p className="text-[13px] text-foreground/30 leading-relaxed">
                    Your exact birth time shapes every planetary placement in your chart.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={LABEL}>Date of Birth</label>
                    <DatePicker
                      value={date}
                      onChange={setDate}
                      placeholder="Select your birth date"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Time of Birth</label>
                    <TimePicker
                      value={time}
                      onChange={setTime}
                      placeholder="Select your birth time"
                    />
                    <p className="text-[10px] text-foreground/20 mt-1.5 pl-0.5">Timezone is set in the next step</p>
                  </div>
                  <button onClick={handleStep1}
                    className="w-full mt-3 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-foreground text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                    Continue <ArrowRight size={13} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Location ─────────────────────────────────────────── */}
            {step === 2 && (
              <motion.div key="s2" custom={dir} variants={stepVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}>

                <div className="text-center mb-10">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 mb-3">Step 2 of 2</p>
                  <h1 className="text-[28px] font-bold text-foreground mb-2 leading-tight">Where were you born?</h1>
                  <p className="text-[13px] text-foreground/30 leading-relaxed">
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
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/25">
                        {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {suggestions.length > 0 && (
                        <motion.div
                          className="absolute top-[calc(100%+6px)] left-0 right-0 bg-card border border-border rounded-xl z-50 max-h-48 overflow-y-auto shadow-2xl"
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
                              className="w-full text-left px-4 py-3 hover:bg-foreground/5 border-b border-border last:border-0 text-foreground/65 text-xs flex items-center gap-2.5 transition-colors">
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
                    <select value={timezoneOffset} onChange={e => setTimezoneOffset(e.target.value)} className={FIELD}>
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
                      className="text-[10px] text-foreground/25 pl-0.5 flex items-center gap-1.5">
                      <MapPin size={9} className="text-primary/40" />
                      {latitude.toFixed(3)}°, {longitude.toFixed(3)}°
                    </motion.p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => go(1, -1)}
                      className="px-5 py-3.5 rounded-xl border border-border text-foreground/35 text-xs font-medium hover:text-foreground/55 transition-colors">
                      Back
                    </button>
                    <button onClick={handleStep2}
                      className="flex-1 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-foreground text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                      Generate chart <Sparkles size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Calculating ──────────────────────────────────────── */}
            {step === 3 && (
              <motion.div key="s3"
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
                <div className="flex flex-col items-center gap-10">
                  <SpinningZodiacWheel status={calcStatus} />
                  <p className="text-[11px] text-foreground/20 uppercase tracking-widest">This may take a moment</p>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Chart result ─────────────────────────────────────── */}
            {step === 4 && svgData && (
              <motion.div key="s4"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>

                <div className="text-center mb-8">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 mb-3">Rasi D-1 Chart</p>
                  <h1 className="text-[24px] font-bold text-foreground mb-2 leading-tight">Your Natal Blueprint</h1>
                  <p className="text-[12px] text-foreground/30">
                    {date} · {time} · {selectedLocation.split(',')[0]}
                  </p>
                </div>

                {/* SVG chart */}
                <div
                  className="w-full bg-foreground/[0.03] border border-border rounded-2xl p-5 mb-6 [&>svg]:w-full [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: svgData }}
                />

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={handleDownloadSVG}
                    className="flex-1 py-3 rounded-xl border border-border text-foreground/50 text-xs font-semibold flex items-center justify-center gap-2 hover:text-foreground/75 hover:border-border transition-colors">
                    <Download size={13} /> Download SVG
                  </button>
                  <button onClick={handlePrint}
                    className="flex-1 py-3 rounded-xl border border-border text-foreground/50 text-xs font-semibold flex items-center justify-center gap-2 hover:text-foreground/75 hover:border-border transition-colors">
                    <Printer size={13} /> Print
                  </button>
                </div>

                <button onClick={() => { setSvgData(null); go(1); }}
                  className="w-full mt-4 flex items-center justify-center gap-1.5 text-[11px] text-foreground/25 hover:text-foreground/45 transition-colors">
                  <RotateCcw size={11} /> Calculate another chart
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

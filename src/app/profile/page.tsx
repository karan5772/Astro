'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, MapPin, Calendar, Clock, Globe, Compass,
  Loader2, Search, ShieldCheck, ShieldAlert, Pencil, X,
  MessageCircle, Mic,
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-time-picker';
import { TimePicker } from '@/components/ui/date-time-picker';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';
import { FREE_MESSAGE_LIMIT } from '@/lib/plans';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserData {
  clerkId: string; email: string; isPro: boolean;
  birthDate: string | null; birthTime: string | null;
  birthTimezone: string | null; birthLocation: string | null;
  birthLatitude: number | null; birthLongitude: number | null;
  hasBirthDetails: boolean; predictionsCount: number;
  messageCount: number; messageBalance: number; voiceBalanceInSeconds: number; payments: any[];
}
interface GeocodeResult { name: string; latitude: number; longitude: number }

// ── Vedic Rashi data ──────────────────────────────────────────────────────────

type RashiData = {
  name: string; english: string; glyph: string;
  element: string; quality: string; ruler: string;
  elementEmoji: string; elementColor: string; glowColor: string;
};

const VEDIC_RASHIS: RashiData[] = [
  { name: 'Mesha', english: 'Aries', glyph: '♈', element: 'Fire', quality: 'Movable', ruler: 'Mars', elementEmoji: '🔥', elementColor: '#ff6b35', glowColor: 'rgba(255,107,53,0.15)' },
  { name: 'Vrishabha', english: 'Taurus', glyph: '♉', element: 'Earth', quality: 'Fixed', ruler: 'Venus', elementEmoji: '🌿', elementColor: '#51cf66', glowColor: 'rgba(81,207,102,0.15)' },
  { name: 'Mithuna', english: 'Gemini', glyph: '♊', element: 'Air', quality: 'Dual', ruler: 'Mercury', elementEmoji: '💨', elementColor: '#74c0fc', glowColor: 'rgba(116,192,252,0.15)' },
  { name: 'Karka', english: 'Cancer', glyph: '♋', element: 'Water', quality: 'Movable', ruler: 'Moon', elementEmoji: '💧', elementColor: '#4dabf7', glowColor: 'rgba(77,171,247,0.15)' },
  { name: 'Simha', english: 'Leo', glyph: '♌', element: 'Fire', quality: 'Fixed', ruler: 'Sun', elementEmoji: '🔥', elementColor: '#ffd43b', glowColor: 'rgba(255,212,59,0.15)' },
  { name: 'Kanya', english: 'Virgo', glyph: '♍', element: 'Earth', quality: 'Dual', ruler: 'Mercury', elementEmoji: '🌿', elementColor: '#63e6be', glowColor: 'rgba(99,230,190,0.15)' },
  { name: 'Tula', english: 'Libra', glyph: '♎', element: 'Air', quality: 'Movable', ruler: 'Venus', elementEmoji: '💨', elementColor: '#f783ac', glowColor: 'rgba(247,131,172,0.15)' },
  { name: 'Vrischika', english: 'Scorpio', glyph: '♏', element: 'Water', quality: 'Fixed', ruler: 'Mars', elementEmoji: '💧', elementColor: '#e64980', glowColor: 'rgba(230,73,128,0.15)' },
  { name: 'Dhanu', english: 'Sagittarius', glyph: '♐', element: 'Fire', quality: 'Dual', ruler: 'Jupiter', elementEmoji: '🔥', elementColor: '#ff8c00', glowColor: 'rgba(255,140,0,0.15)' },
  { name: 'Makara', english: 'Capricorn', glyph: '♑', element: 'Earth', quality: 'Movable', ruler: 'Saturn', elementEmoji: '🌿', elementColor: '#868e96', glowColor: 'rgba(134,142,150,0.15)' },
  { name: 'Kumbha', english: 'Aquarius', glyph: '♒', element: 'Air', quality: 'Fixed', ruler: 'Saturn', elementEmoji: '💨', elementColor: '#74c0fc', glowColor: 'rgba(116,192,252,0.15)' },
  { name: 'Meena', english: 'Pisces', glyph: '♓', element: 'Water', quality: 'Dual', ruler: 'Jupiter', elementEmoji: '💧', elementColor: '#cc5de8', glowColor: 'rgba(204,93,232,0.15)' },
];

const RASHI_RANGES: [number, number, number, number, number][] = [
  [1, 1, 1, 14, 8], [1, 15, 2, 12, 9], [2, 13, 3, 14, 10],
  [3, 15, 4, 13, 11], [4, 14, 5, 14, 0], [5, 15, 6, 14, 1],
  [6, 15, 7, 16, 2], [7, 17, 8, 16, 3], [8, 17, 9, 16, 4],
  [9, 17, 10, 17, 5], [10, 18, 11, 16, 6], [11, 17, 12, 15, 7],
  [12, 16, 12, 31, 8],
];

function getVedicRashi(dateStr: string | null): RashiData | null {
  if (!dateStr) return null;
  const [, ms, ds] = dateStr.split('-');
  const month = parseInt(ms, 10), day = parseInt(ds, 10);
  for (const [sm, sd, em, ed, idx] of RASHI_RANGES) {
    if ((month > sm || (month === sm && day >= sd)) && (month < em || (month === em && day <= ed)))
      return VEDIC_RASHIS[idx];
  }
  return VEDIC_RASHIS[8];
}

// ── Zodiac Wheel ──────────────────────────────────────────────────────────────

function ZodiacWheel({ userRashi }: { userRashi: RashiData | null }) {
  const SIZE = 280, CX = 140, CY = 140;
  const OUTER_R = 126, INNER_R = 79, GLYPH_R = 102;
  const GAP = 1.5;
  const r = (d: number) => (d * Math.PI) / 180;

  const arc = (i: number) => {
    const s = r(i * 30 - 90 + GAP / 2);
    const e = r((i + 1) * 30 - 90 - GAP / 2);
    const c = (a: number, R: number) => [CX + R * Math.cos(a), CY + R * Math.sin(a)] as const;
    const [ox1, oy1] = c(s, OUTER_R); const [ox2, oy2] = c(e, OUTER_R);
    const [ix2, iy2] = c(e, INNER_R); const [ix1, iy1] = c(s, INNER_R);
    return `M ${ox1} ${oy1} A ${OUTER_R} ${OUTER_R} 0 0 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${INNER_R} ${INNER_R} 0 0 0 ${ix1} ${iy1} Z`;
  };

  const glyphAt = (i: number) => {
    const mid = r((i + 0.5) * 30 - 90);
    return [CX + GLYPH_R * Math.cos(mid), CY + GLYPH_R * Math.sin(mid)] as const;
  };

  return (
    <div className="relative flex items-center justify-center">
      {userRashi && (
        <div
          className="absolute w-44 h-44 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: userRashi.elementColor, opacity: 0.18 }}
        />
      )}
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <defs>
          <filter id="rg" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer dashed decoration ring */}
        <circle cx={CX} cy={CY} r={OUTER_R + 9} fill="none"
          stroke="var(--foreground)" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="2 10" />

        {VEDIC_RASHIS.map((rashi, i) => {
          const active = userRashi?.name === rashi.name;
          const [gx, gy] = glyphAt(i);
          return (
            <g key={rashi.name}>
              <path
                d={arc(i)}
                fill={active ? rashi.elementColor : 'var(--foreground)'}
                fillOpacity={active ? 1 : 0.07}
                filter={active ? 'url(#rg)' : 'none'}
              />
              <text
                x={gx} y={gy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={active ? 15 : 11}
                fill={active ? '#fff' : 'var(--foreground)'}
                opacity={active ? 1 : 0.35}
                fontWeight={active ? '700' : '400'}
              >
                {rashi.glyph}
              </text>
            </g>
          );
        })}

        {/* Center fill — uses foreground so it's dark on cream, light on dark */}
        <circle cx={CX} cy={CY} r={INNER_R - 1} fill="var(--foreground)" />

        {/* Center content */}
        {userRashi ? (
          <>
            <text x={CX} y={CY - 13} textAnchor="middle" dominantBaseline="middle"
              fontSize="30" fill="var(--background)">{userRashi.glyph}</text>
            <text x={CX} y={CY + 11} textAnchor="middle"
              fill="var(--background)" fontSize="12" fontWeight="600" fontFamily="Inter,sans-serif">
              {userRashi.name}
            </text>
            <text x={CX} y={CY + 26} textAnchor="middle"
              fill="var(--background)" opacity="0.6" fontSize="9" fontFamily="Inter,sans-serif">
              {userRashi.english}
            </text>
          </>
        ) : (
          <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
            fill="var(--foreground)" opacity="0.35" fontSize="9.5" fontFamily="Inter,sans-serif">
            add birth date
          </text>
        )}
      </svg>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const voiceMinsRemaining = Math.max(0, Math.ceil(((userData?.voiceBalanceInSeconds) || 0) / 60));
  const totalVoicePurchased = (userData?.payments ?? []).reduce((a, p) => a + (p.durationInMinutes || 0), 0);
  const totalMsgsPurchased = (userData?.payments ?? []).reduce((a, p) => a + (p.messagesGranted || 0), 0);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timezoneOffset, setTimezoneOffset] = useState('+05:30');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingBirth, setIsEditingBirth] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        if (data.hasBirthDetails) {
          setDate(data.birthDate || '');
          setTime(data.birthTime || '');
          setTimezoneOffset(data.birthTimezone || '+05:30');
          setLocationQuery(data.birthLocation || '');
          setSelectedLocationName(data.birthLocation || '');
          setLatitude(data.birthLatitude);
          setLongitude(data.birthLongitude);
        }
      }
    } catch { toast.error('Failed to load profile.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchUserData();
    const outside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node))
        setSuggestions([]);
    };
    window.addEventListener('mousedown', outside);
    return () => window.removeEventListener('mousedown', outside);
  }, []);

  useEffect(() => {
    if (!locationQuery || locationQuery === selectedLocationName || locationQuery.trim().length < 2) {
      setSuggestions([]); return;
    }
    const t = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(locationQuery)}`);
        if (res.ok) setSuggestions(await res.json());
      } catch { /* swallow */ }
      finally { setIsSearchingLocation(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [locationQuery, selectedLocationName]);

  const handleSelectLocation = (loc: GeocodeResult) => {
    setLocationQuery(loc.name); setSelectedLocationName(loc.name);
    setLatitude(loc.latitude); setLongitude(loc.longitude);
    setSuggestions([]);
    toast.success(`Location set to ${loc.name.split(',')[0]}`);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || latitude === null || longitude === null) {
      toast.error('Please complete all birth details.'); return;
    }
    setIsUpdating(true);
    const p = new Promise<void>(async (resolve, reject) => {
      try {
        const res = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate: date, birthTime: time, birthTimezone: timezoneOffset,
            birthLocation: selectedLocationName,
            birthLatitude: latitude, birthLongitude: longitude,
          }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Server error'); }
        await fetchUserData();
        setIsEditingBirth(false);
        resolve();
      } catch (err: any) { reject(err); }
      finally { setIsUpdating(false); }
    });
    toast.promise(p, {
      loading: 'Recalculating destiny…',
      success: 'Birth chart updated!',
      error: (err) => `Failed: ${err.message || 'Unknown error'}`,
    });
  };

  if (!clerkLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-foreground/20" />
      </div>
    );
  }

  const rashi = getVedicRashi(userData?.birthDate ?? null);
  const freeUsed = Math.min(userData?.messageCount || 0, FREE_MESSAGE_LIMIT);
  const freeLeft = Math.max(0, FREE_MESSAGE_LIMIT - freeUsed);
  const paidMsgs = userData?.messageBalance || 0;
  const onFree = freeLeft > 0;
  const hasVoice = voiceMinsRemaining > 0;
  const hasPaidMsgs = paidMsgs > 0;

  const FIELD = 'w-full px-3 py-2.5 bg-foreground/[0.04] border border-border rounded-lg text-sm text-foreground placeholder-foreground/25 outline-none focus:border-primary/40 transition-colors';
  const LABEL = 'block text-[10px] uppercase tracking-widest text-foreground/40 mb-1.5 font-medium';
  const SECTION = 'text-[10px] uppercase tracking-[0.14em] text-foreground/45 font-semibold mb-5';

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Navbar variant="dashboard" />

      <main className="max-w-3xl mx-auto px-5 pt-20 md:pt-28 pb-20 space-y-12 md:space-y-16">

        {/* ══ 1. BIRTH DETAILS ══════════════════════════════════════════════════ */}
        <section>
          {/* User identity card */}
          <div className="flex items-center justify-between mb-8 p-4 bg-gradient-to-r from-card to-secondary/40 border border-border/80 rounded-xl shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="scale-110 flex items-center">
                <UserButton appearance={{ elements: { avatarBox: { width: '38px', height: '38px', border: '1.5px solid var(--border)' } } }} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-foreground leading-tight">
                  {user?.fullName || userData?.email?.split('@')[0] || 'Astro Traveler'}
                </p>
                <p className="text-[12px] text-foreground/40 mt-0.5">{userData?.email}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border ${userData?.isPro ? 'border-primary/30 text-primary bg-primary/8' : 'border-border text-foreground/40 bg-foreground/[0.03]'}`}>
              {userData?.isPro ? <><ShieldCheck size={11} /> Pro</> : <><ShieldAlert size={11} /> Free</>}
            </div>
          </div>

          {/* Zodiac wheel */}
          <motion.div
            className="flex flex-col items-center gap-5 mb-6 md:mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ZodiacWheel userRashi={rashi} />
            {rashi ? (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* Element tag — coloured with rashi's element colour */}
                <span
                  className="text-[11px] px-3 py-1 rounded-full border font-medium"
                  style={{
                    color: rashi.elementColor,
                    backgroundColor: rashi.elementColor + '15',
                    borderColor: rashi.elementColor + '40',
                  }}
                >
                  {rashi.elementEmoji} {rashi.element}
                </span>
                {/* Quality + Ruler — neutral */}
                {[rashi.quality, `♦ ${rashi.ruler}`].map(tag => (
                  <span key={tag} className="text-[11px] text-foreground/50 bg-foreground/[0.05] border border-border px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-foreground/30">Add your birth date to reveal your Vedic Rashi</p>
            )}
          </motion.div>

          {/* Birth detail cards + edit */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-5">
              <p className={`${SECTION} mb-0`}>Birth Details</p>
              {!isEditingBirth ? (
                <button onClick={() => setIsEditingBirth(true)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-primary border border-primary/25 bg-primary/[0.08] px-2.5 py-1.5 rounded-lg hover:bg-primary/15 transition-colors">
                  <Pencil size={11} /> Edit
                </button>
              ) : (
                <button onClick={() => setIsEditingBirth(false)}
                  className="flex items-center gap-1.5 text-[11px] text-foreground/40 border border-border px-2.5 py-1.5 rounded-lg hover:text-foreground/60 transition-colors">
                  <X size={11} /> Cancel
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!isEditingBirth ? (
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {userData?.hasBirthDetails ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { icon: <Calendar size={11} />, label: 'Date', value: date ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—', wide: false },
                        { icon: <Clock size={11} />, label: 'Time', value: time || '—', wide: false },
                        { icon: <MapPin size={11} />, label: 'Place', value: selectedLocationName || '—', wide: true },
                        { icon: <Globe size={11} />, label: 'Timezone', value: timezoneOffset ? `UTC${timezoneOffset}` : '—', wide: false },
                        { icon: <Compass size={11} />, label: 'Coordinates', value: latitude !== null && longitude !== null ? `${latitude.toFixed(2)}° · ${longitude.toFixed(2)}°` : '—', wide: false },
                      ].map(({ icon, label, value, wide }) => (
                        <div key={label} className={`bg-card border border-border rounded-xl px-4 py-3 shadow-sm ${wide ? 'col-span-2' : ''}`}>
                          <div className="flex items-center gap-1.5 text-foreground/35 mb-1.5">{icon}
                            <span className="text-[9px] uppercase tracking-widest font-medium">{label}</span>
                          </div>
                          <p className="text-[13px] text-foreground/90 font-medium leading-snug">{value}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-border rounded-xl p-8 text-center">
                      <p className="text-[12px] text-foreground/30 mb-4">No birth details added yet</p>
                      <button onClick={() => setIsEditingBirth(true)}
                        className="text-[11px] font-semibold text-foreground/55 hover:text-foreground transition-colors">
                        Add birth details →
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.form key="edit" onSubmit={handleUpdateProfile} className="space-y-4"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Date</label>
                      <DatePicker value={date} onChange={setDate} placeholder="Birth date" />
                    </div>
                    <div>
                      <label className={LABEL}>Time</label>
                      <TimePicker value={time} onChange={setTime} placeholder="Birth time" />
                    </div>
                  </div>
                  <div ref={searchContainerRef} className="relative">
                    <label className={LABEL}><MapPin size={9} className="inline mr-1" />Birth Place</label>
                    <div className="relative">
                      <input type="text" placeholder="Search city…" value={locationQuery}
                        onChange={e => setLocationQuery(e.target.value)} className={`${FIELD} pr-9`} />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/25">
                        {isSearchingLocation ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                      </div>
                    </div>
                    <AnimatePresence>
                      {suggestions.length > 0 && (
                        <motion.div
                          className="absolute top-[calc(100%+6px)] left-0 right-0 bg-card border border-border rounded-lg z-50 max-h-48 overflow-y-auto shadow-2xl"
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                          {suggestions.map((loc, idx) => (
                            <button key={idx} type="button" onClick={() => handleSelectLocation(loc)}
                              className="w-full text-left px-3 py-2.5 hover:bg-foreground/5 border-b border-border last:border-0 text-foreground/70 text-xs flex items-center gap-2 transition-colors">
                              <MapPin size={12} className="text-primary/60 shrink-0" />
                              <span className="truncate">{loc.name}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}><Globe size={9} className="inline mr-1" />Timezone</label>
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
                    <div>
                      <label className={LABEL}><Compass size={9} className="inline mr-1" />Coordinates</label>
                      <div className={`${FIELD} cursor-default text-foreground/40 text-xs flex items-center`}>
                        {latitude !== null && longitude !== null ? `${latitude.toFixed(2)}° · ${longitude.toFixed(2)}°` : 'Auto-filled on select'}
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={isUpdating}
                    className="w-full py-3 rounded-lg bg-primary/90 hover:bg-primary text-white text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-1">
                    {isUpdating ? <><Loader2 size={13} className="animate-spin" /> Updating…</> : <><Sparkles size={13} /> Save Chart</>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* ══ 2. ACCOUNT & USAGE ═══════════════════════════════════════════════ */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className={SECTION}>Account & Usage</p>

          {/* Balance cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {/* Messages */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={13} className="text-foreground/35" />
                <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-semibold">Messages</p>
              </div>
              {onFree ? (
                <>
                  <p className="text-2xl font-bold text-foreground">{freeLeft}</p>
                  <p className="text-[11px] text-foreground/40 mt-0.5">free remaining</p>
                  <div className="mt-4 h-1 rounded-full bg-foreground/[0.07] overflow-hidden">
                    <motion.div className="h-full rounded-full bg-primary/60"
                      initial={{ width: '0%' }}
                      animate={{ width: `${(freeUsed / FREE_MESSAGE_LIMIT) * 100}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }} />
                  </div>
                  <p className="text-[10px] text-foreground/30 mt-1.5">{freeUsed} of {FREE_MESSAGE_LIMIT} used</p>
                </>
              ) : hasPaidMsgs ? (
                <>
                  <p className="text-2xl font-bold text-foreground">{paidMsgs}</p>
                  <p className="text-[11px] text-foreground/40 mt-0.5">paid credits left</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground/25">0</p>
                  <p className="text-[11px] text-foreground/35 mt-0.5">no credits left</p>
                </>
              )}
            </div>

            {/* Voice */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Mic size={13} className="text-foreground/35" />
                <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-semibold">Voice</p>
              </div>
              {hasVoice ? (
                <>
                  <p className="text-2xl font-bold text-foreground">{voiceMinsRemaining}</p>
                  <p className="text-[11px] text-foreground/40 mt-0.5">minutes remaining</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground/25">0</p>
                  <p className="text-[11px] text-foreground/35 mt-0.5">no time left</p>
                </>
              )}
              <div className="mt-4 h-1 rounded-full bg-foreground/[0.07] overflow-hidden">
                <motion.div className="h-full rounded-full bg-primary/60"
                  initial={{ width: '0%' }}
                  animate={{ width: `${totalVoicePurchased > 0 ? (voiceMinsRemaining / totalVoicePurchased) * 100 : 0}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.35 }} />
              </div>
              <p className="text-[10px] text-foreground/30 mt-1.5">of {totalVoicePurchased} min total</p>
            </div>
          </div>

          {/* Low balance nudge */}
          {!onFree && !hasPaidMsgs ? (
            <div className="border border-border rounded-xl p-4 text-center bg-secondary/50 mb-6">
              <p className="text-[11px] text-foreground/50 mb-2">No message credits left</p>
              <a href="/pricing" className="text-[11px] font-semibold text-foreground/65 hover:text-foreground transition-colors">Top up →</a>
            </div>
          ) : onFree && freeLeft <= 2 && !hasPaidMsgs ? (
            <div className="border border-border rounded-xl p-4 text-center bg-secondary/50 mb-6">
              <p className="text-[11px] text-foreground/50 mb-2">
                {freeLeft === 1 ? '1 free message left.' : '2 free messages left.'}
              </p>
              <a href="/pricing" className="text-[11px] font-semibold text-foreground/65 hover:text-foreground transition-colors">Top up →</a>
            </div>
          ) : null}

          {/* Stat cells */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Predictions', value: String(userData?.predictionsCount || 0), sub: 'generated' },
              { label: 'Free Used', value: `${freeUsed} / ${FREE_MESSAGE_LIMIT}`, sub: 'messages' },
              { label: 'Voice Used', value: `${totalVoicePurchased - voiceMinsRemaining}m`, sub: 'consumed' },
              { label: 'Purchases', value: String(userData?.payments?.length || 0), sub: 'total' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <p className="text-[9px] uppercase tracking-widest text-foreground/40 mb-1">{label}</p>
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-[10px] text-foreground/35 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ══ 3. BILLING ═══════════════════════════════════════════════════════ */}
        {(userData?.payments?.length ?? 0) > 0 && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <p className={SECTION}>Billing</p>
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              {userData!.payments.map((p: any, i: number) => (
                <div key={i} className="flex justify-between items-center px-5 py-4 border-b border-border last:border-0 hover:bg-foreground/[0.02] transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-foreground font-medium capitalize">{p.plan || 'Bundle'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.messagesGranted > 0 && (
                        <span className="text-[11px] text-foreground/40 flex items-center gap-1">
                          <MessageCircle size={10} /> {p.messagesGranted} msgs
                        </span>
                      )}
                      {p.durationInMinutes > 0 && (
                        <span className="text-[11px] text-foreground/40 flex items-center gap-1">
                          <Mic size={10} /> {p.durationInMinutes} min
                        </span>
                      )}
                      <span className="text-[11px] text-foreground/30">
                        {p.date || p.createdAt ? new Date(p.date || p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">${p.amount}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

      </main>
    </div>
  );
}

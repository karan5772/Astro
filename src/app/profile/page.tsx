'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Globe,
  Compass,
  Loader2,
  Search,
  User as UserIcon,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Star,
  BookOpen,
  Activity,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';

interface Prediction {
  name: string;
  description: string;
  tags: string[];
}

interface UserData {
  clerkId: string;
  email: string;
  isPro: boolean;
  birthDate: string | null;
  birthTime: string | null;
  birthTimezone: string | null;
  birthLocation: string | null;
  birthLatitude: number | null;
  birthLongitude: number | null;
  hasBirthDetails: boolean;
  predictions: Prediction[];
  messageCount: number;
  voiceBalanceInSeconds: number;
  payments: any[];
}

interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
}

const getCosmicOrigins = (dateStr: string | null, timeStr: string | null) => {
  if (!dateStr) return null;

  // Weekday and ruler
  // Parse YYYY-MM-DD safely
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
  const day = parseInt(parts[2], 10);
  const birthDateObj = new Date(Date.UTC(year, month, day));
  
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekday = weekdays[birthDateObj.getUTCDay()];
  
  const rulers: Record<string, { planet: string; symbol: string; description: string }> = {
    Sunday: { planet: 'Sun', symbol: '☀️', description: 'Represents expression, life force, and the true self.' },
    Monday: { planet: 'Moon', symbol: '🌙', description: 'Governs emotion, intuition, and the subconscious mind.' },
    Tuesday: { planet: 'Mars', symbol: '♂️', description: 'Rules drive, determination, energy, and physical action.' },
    Wednesday: { planet: 'Mercury', symbol: '☿', description: 'Governs communication, intellect, logic, and travel.' },
    Thursday: { planet: 'Jupiter', symbol: '♃', description: 'Rules luck, expansion, wisdom, and higher learning.' },
    Friday: { planet: 'Venus', symbol: '♀', description: 'Governs love, beauty, value, and personal relationships.' },
    Saturday: { planet: 'Saturn', symbol: '♄', description: 'Rules structure, boundaries, discipline, and life lessons.' },
  };
  const ruler = rulers[weekday];

  // Sect (Day vs Night)
  let sect = 'Unknown';
  let sectIcon = '✨';
  let sectDescription = '';
  if (timeStr) {
    const hour = parseInt(timeStr.split(':')[0], 10);
    const isDay = hour >= 6 && hour < 18;
    sect = isDay ? 'Diurnal (Day Birth)' : 'Nocturnal (Night Birth)';
    sectIcon = isDay ? '☀️' : '🌙';
    sectDescription = isDay 
      ? 'The Sun is your primary luminary. Your chart favors external expression, active focus, and conscious goals.' 
      : 'The Moon is your primary luminary. Your chart leans toward emotional depth, intuition, and subconscious processes.';
  }

  // Solar Season
  const m = month + 1; // 1-12
  const d = day;
  let season = 'Unknown';
  let seasonIcon = '✨';
  
  if ((m === 12 && d >= 21) || m === 1 || m === 2 || (m === 3 && d < 20)) {
    season = 'Winter Solstice Cycle';
    seasonIcon = '❄️';
  } else if ((m === 3 && d >= 20) || m === 4 || m === 5 || (m === 6 && d < 21)) {
    season = 'Spring Equinox Cycle';
    seasonIcon = '🌱';
  } else if ((m === 6 && d >= 21) || m === 7 || m === 8 || (m === 9 && d < 22)) {
    season = 'Summer Solstice Cycle';
    seasonIcon = '☀️';
  } else {
    season = 'Autumn Equinox Cycle';
    seasonIcon = '🍂';
  }

  return {
    weekday,
    ruler,
    sect,
    sectIcon,
    sectDescription,
    season,
    seasonIcon,
  };
};

export default function ProfilePage() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const getVoiceTimeRemaining = () => {
    if (!userData) return 0;
    return Math.max(0, Math.ceil((userData.voiceBalanceInSeconds || 0) / 60));
  };

  const getTotalVoiceMinutes = () => {
    if (!userData?.payments) return 0;
    return userData.payments.reduce((acc, p) => acc + (p.durationInMinutes || 0), 0);
  };

  const getVoiceTimeUsed = () => {
    const total = getTotalVoiceMinutes();
    const remaining = getVoiceTimeRemaining();
    return Math.max(0, total - remaining);
  };

  // Form State
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
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
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
    } catch (err) {
      console.error('Error fetching user profile:', err);
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.classList.add('astraeus-active');
    fetchUserData();

    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.body.classList.remove('astraeus-active');
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Geocoding autocompletion
  useEffect(() => {
    if (!locationQuery || locationQuery === selectedLocationName || locationQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(locationQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Failed to autocomplete location:', err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [locationQuery, selectedLocationName]);

  const handleSelectLocation = (location: GeocodeResult) => {
    setLocationQuery(location.name);
    setSelectedLocationName(location.name);
    setLatitude(location.latitude);
    setLongitude(location.longitude);
    setSuggestions([]);
    toast.success(`Location set to ${location.name.split(',')[0]}`);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || latitude === null || longitude === null) {
      toast.error('Please enter all required birth details.');
      return;
    }

    setIsUpdating(true);
    const updatePromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthDate: date,
            birthTime: time,
            birthTimezone: timezoneOffset,
            birthLocation: selectedLocationName,
            birthLatitude: latitude,
            birthLongitude: longitude,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Server error updating profile.');
        }

        const data = await response.json();
        // Refresh details, including predictions
        await fetchUserData();
        resolve(data);
      } catch (err: any) {
        reject(err);
      } finally {
        setIsUpdating(false);
      }
    });

    toast.promise(updatePromise, {
      loading: 'Recalculating predictions & updating profile...',
      success: 'Profile and planetary alignments successfully updated!',
      error: (err) => `Failed to update: ${err.message || 'Unknown error'}`
    });
  };

  if (!clerkLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 mt-[20vh] w-full">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-white/50 text-sm">Aligning solar system details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col selection:bg-primary/30 selection:text-white">
      <Navbar variant="dashboard" />

      <main className="flex-grow pt-32 pb-16 px-4 md:px-12 flex flex-col items-center overflow-y-auto w-full relative z-10">
        {/* Glow Background Orbs */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" style={{ top: '15%', left: '10%' }}></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#9d4edd]/5 blur-3xl pointer-events-none" style={{ bottom: '15%', right: '10%' }}></div>

        <div className="w-full max-w-[1280px]">

          {/* Page Heading */}
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest font-bold text-primary mb-2">Account & Destiny</p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">User Profile</h1>
          </div>

          {/* User Info Header Block */}
          <div className="w-full bg-secondary/40 backdrop-blur-lg border border-card-border rounded-2xl p-8 mb-10 flex flex-wrap gap-8 items-center justify-between shadow-xl">
            <div className="flex items-center gap-6">
              <div className="scale-125 md:scale-150 pl-2 flex items-center justify-center">
                <UserButton appearance={{ elements: { avatarBox: { width: '40px', height: '40px', border: '2px solid #6D5DFB' } } }} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                  {user?.fullName || userData?.email.split('@')[0] || 'Astro Traveler'}
                </h2>
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <Mail size={14} />
                  <span>{userData?.email}</span>
                </div>
              </div>
            </div>

            {/* Plan Status Card */}
            <div className={`flex items-center gap-3.5 px-6 py-4 rounded-xl border ${userData?.isPro ? 'bg-[#1e2e3d]/40 border-blue-600/80 shadow-[0_0_20px_rgba(0,76,255,0.1)]' : 'bg-[#18181b]/35 border-card-border'}`}>
              {userData?.isPro ? (
                <>
                  <ShieldCheck size={24} className="text-blue-500" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-purple-400">Plan tier</div>
                    <div className="text-white text-base font-bold">Pro Member</div>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert size={24} className="text-white/40" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-white/40">Plan tier</div>
                    <div className="text-white text-base font-bold">Free Account</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Grid: Left - Edit Natal Info, Right - Predictions */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 items-start pb-12">

            {/* Left: Natal Form */}
            <motion.section
              className="bg-secondary/40 backdrop-blur-lg border border-card-border rounded-2xl p-8 shadow-xl"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-3 border-b border-card-border pb-4 mb-6">
                <Sparkles className="text-primary" size={20} />
                <h3 className="text-lg font-bold text-white">Birth Parameters</h3>
              </div>

              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1.5">
                      <Calendar size={12} /> Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-3 text-sm rounded-lg bg-secondary/80 border border-card-border text-white outline-none focus:border-primary/50 transition-colors"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1.5">
                      <Clock size={12} /> Time
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full p-3 text-sm rounded-lg bg-secondary/80 border border-card-border text-white outline-none focus:border-primary/50 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div ref={searchContainerRef} className="flex flex-col gap-2 relative">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1.5">
                    <MapPin size={12} /> Birth Place
                  </label>
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="Search city/place..."
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      className="w-full p-3 pr-10 text-sm rounded-lg bg-secondary/80 border border-card-border text-white outline-none focus:border-primary/50 transition-colors"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                      {isSearchingLocation ? (
                        <Loader2 size={16} className="animate-spin text-primary" />
                      ) : (
                        <Search size={14} />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div
                        className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#18181B] border border-card-border rounded-lg z-50 max-h-[200px] overflow-y-auto shadow-2xl"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                      >
                        {suggestions.map((loc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectLocation(loc)}
                            className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 text-white/80 text-xs flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <MapPin size={14} className="text-primary shrink-0" />
                            <span className="truncate">{loc.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1.5">
                      <Globe size={12} /> Timezone
                    </label>
                    <select
                      value={timezoneOffset}
                      onChange={(e) => setTimezoneOffset(e.target.value)}
                      className="w-full p-3 text-sm rounded-lg bg-secondary/80 border border-card-border text-white outline-none focus:border-primary/50 transition-colors"
                    >
                      <option value="-08:00">UTC-08:00 (PST)</option>
                      <option value="-05:00">UTC-05:00 (EST)</option>
                      <option value="+00:00">UTC+00:00 (GMT)</option>
                      <option value="+05:30">UTC+05:30 (IST)</option>
                      <option value="+08:00">UTC+08:00 (SGT)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1.5">
                      <Compass size={12} /> Coordinates
                    </label>
                    <div className="w-full p-3 text-xs rounded-lg flex items-center justify-between bg-secondary/40 border border-white/5 cursor-not-allowed">
                      {latitude !== null && longitude !== null ? (
                        <span className="text-[#cebdff] truncate">
                          {latitude.toFixed(2)}°N | {longitude.toFixed(2)}°E
                        </span>
                      ) : (
                        <span className="text-white/40">None</span>
                      )}
                      <Globe size={14} className="text-white/40 shrink-0" />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    className={`w-full py-3.5 px-6 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_16px_-4px_rgba(109,93,251,0.4)] bg-gradient-to-r from-primary to-[#5b4be3] text-white hover:opacity-90 transition-all ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        RECALCULATING DESTINY...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        UPDATE BLUEPRINT
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.section>

            {/* Right: Stats & Payments */}
            <motion.section
              className="bg-secondary/40 backdrop-blur-lg border border-card-border rounded-2xl p-8 shadow-xl flex flex-col gap-8"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* Telemetry Stats */}
              <div>
                <div className="flex items-center gap-3 border-b border-card-border pb-4 mb-6">
                  <Activity className="text-primary" size={20} />
                  <h3 className="text-lg font-bold text-white">Cosmic Telemetry</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-secondary/20 border border-white/5 rounded-xl p-5">
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-white/40 mb-1">Messages Sent / Remaining</div>
                    <div className="text-2xl font-bold text-white">
                      {userData?.messageCount || 0} / {userData?.isPro ? '∞' : Math.max(0, 15 - (userData?.messageCount || 0))}
                    </div>
                  </div>

                  <div className="bg-secondary/20 border border-white/5 rounded-xl p-5">
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-white/40 mb-1">Voice Time Used / Remaining</div>
                    <div className="text-2xl font-bold text-primary">
                      {getVoiceTimeUsed()} / {getVoiceTimeRemaining()} <span className="text-xs font-medium text-white/40">min</span>
                    </div>
                  </div>

                  <div className="bg-secondary/20 border border-white/5 rounded-xl p-5">
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-white/40 mb-1">Total Voice Purchased</div>
                    <div className="text-2xl font-bold text-white">
                      {getTotalVoiceMinutes()} <span className="text-xs font-medium text-white/40">min</span>
                    </div>
                  </div>

                  <div className="bg-secondary/20 border border-white/5 rounded-xl p-5">
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-white/40 mb-1">Predictions</div>
                    <div className="text-2xl font-bold text-white">{userData?.predictions?.length || 0}</div>
                  </div>
                </div>
              </div>

              {/* Transactions History */}
              <div>
                <div className="flex items-center gap-3 border-b border-card-border pb-4 mb-6">
                  <CreditCard className="text-purple-400" size={20} />
                  <h3 className="text-lg font-bold text-white">Billing & Passes</h3>
                </div>

                <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1">
                  {userData?.payments && userData.payments.length > 0 ? (
                    userData.payments.map((payment: any, index: number) => (
                      <div key={index} className="bg-secondary/20 border border-white/5 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold text-white">{payment.durationInMinutes} Minutes Pass</div>
                          <div className="text-[10px] text-white/40 mt-0.5">ID: {payment.paymentId}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-white">${payment.amount}</div>
                          <div className="text-[10px] text-white/40 mt-0.5">{new Date(payment.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-white/40 text-sm">
                      No transactions recorded yet
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          </div>

          {/* Cosmic Origins Dashboard */}
          {userData?.hasBirthDetails && (() => {
            const origins = getCosmicOrigins(userData.birthDate, userData.birthTime);
            if (!origins) return null;

            return (
              <motion.section
                className="mt-10 bg-secondary/40 backdrop-blur-lg border border-card-border rounded-2xl p-8 shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="border-b border-card-border pb-6 mb-6">
                  <div className="flex items-center gap-3">
                    <Compass className="text-primary animate-pulse" size={24} />
                    <div>
                      <h3 className="text-xl font-bold text-white">Cosmic Origin Alignments</h3>
                      <p className="text-xs text-white/50 mt-1">Astronomical alignments calculated directly from your birth parameters</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Planetary Day Ruler */}
                  <div className="bg-[#18181b]/35 border border-white/5 hover:border-primary/20 rounded-xl p-6 flex flex-col justify-between transition-all duration-300">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-extrabold text-white/40 mb-2">Planetary Day Ruler</div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{origins.ruler?.symbol}</span>
                        <div>
                          <div className="text-base font-bold text-white">{origins.weekday}</div>
                          <div className="text-xs text-primary font-medium">Ruled by the {origins.ruler?.planet}</div>
                        </div>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {origins.ruler?.description}
                      </p>
                    </div>
                  </div>

                  {/* Sect Info */}
                  <div className="bg-[#18181b]/35 border border-white/5 hover:border-primary/20 rounded-xl p-6 flex flex-col justify-between transition-all duration-300">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-extrabold text-white/40 mb-2">Diurnal/Nocturnal Sect</div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{origins.sectIcon}</span>
                        <div>
                          <div className="text-base font-bold text-white">
                            {origins.sect.includes('Diurnal') ? 'Day Birth' : 'Night Birth'}
                          </div>
                          <div className="text-xs text-primary font-medium">{origins.sect}</div>
                        </div>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">
                        {origins.sectDescription}
                      </p>
                    </div>
                  </div>

                  {/* Solstice/Equinox */}
                  <div className="bg-[#18181b]/35 border border-white/5 hover:border-primary/20 rounded-xl p-6 flex flex-col justify-between transition-all duration-300">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-extrabold text-white/40 mb-2">Solar Season Alignment</div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{origins.seasonIcon}</span>
                        <div>
                          <div className="text-base font-bold text-white">{origins.season}</div>
                          <div className="text-xs text-primary font-medium">Solar Grid Placement</div>
                        </div>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">
                        Determines the balance of light and darkness on Earth at the exact moment of your arrival.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.section>
            );
          })()}
        </div>
      </main>
    </div>
  );
}

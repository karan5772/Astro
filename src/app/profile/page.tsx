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
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import '../astraeus.css';

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
  ayanamsa: string;
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
  const [ayanamsa, setAyanamsa] = useState('RAMAN');

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
          setAyanamsa(data.ayanamsa || 'RAMAN');
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
            ayanamsa,
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
      <div className="theme-astraeus sidebar-layout min-h-screen flex items-center justify-center">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '20vh', width: '100%' }}>
          <Loader2 size={40} className="spin" color="#6D5DFB" />
          <p style={{ color: '#a1a1aa', fontSize: '0.95rem' }}>Aligning solar system details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-astraeus sidebar-layout min-h-screen">
      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        .prediction-card {
          background: rgba(24, 24, 27, 0.4);
          border: 1px solid rgba(39, 39, 42, 0.5);
          border-radius: 0.75rem;
          padding: 1.25rem;
          transition: all 0.2s ease;
        }
        .prediction-card:hover {
          border-color: rgba(109, 93, 251, 0.5);
          background: rgba(24, 24, 27, 0.6);
        }
        .profile-page-main {
          padding: 2rem 3rem;
        }
        .profile-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
          gap: 2.5rem;
        }
        .profile-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .profile-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        @media (max-width: 1024px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .profile-header-card {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1.5rem !important;
          }
        }
        @media (max-width: 768px) {
          .profile-page-main {
            padding: 1.5rem 1rem !important;
          }
        }
        @media (max-width: 600px) {
          .profile-form-row {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .profile-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <Sidebar />

      <main className="page-main profile-page-main relative z-10 flex-1 fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
        <div className="glow-orb glow-orb-1 pointer-events-none"></div>
        <div className="glow-orb glow-orb-2 pointer-events-none"></div>

        <div className="astral-container" style={{ width: '100%', maxWidth: '1280px' }}>

          {/* Page Heading */}
          <div className="page-heading" style={{ marginBottom: '2rem' }}>
            <p className="section-kicker" style={{ color: '#6D5DFB', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Account & Destiny</p>
            <h1 className="page-title" style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', fontWeight: 800, color: '#fff' }}>User Profile</h1>
            {/* <p className="page-lead" style={{ maxWidth: '48rem', color: '#a1a1aa', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Review your cosmic blueprint, update natal parameters, and monitor your subscription.
            </p> */}
          </div>

          {/* User Info Header Block */}
          <div className="glass-panel profile-header-card" style={{ width: '100%', background: 'rgba(9, 9, 11, 0.6)', border: '1px solid rgba(39, 39, 42, 0.8)', borderRadius: '1.5rem', padding: '2rem', marginBottom: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ scale: 1.4, paddingLeft: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserButton appearance={{ elements: { avatarBox: { width: '46px', height: '46px', border: '2px solid #6D5DFB' } } }} />
              </div>
              <div>
                <h2 style={{ margin: '0 0 0.3rem 0', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                  {user?.fullName || userData?.email.split('@')[0] || 'Astro Traveler'}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', fontSize: '0.9rem' }}>
                  <Mail size={14} />
                  <span>{userData?.email}</span>
                </div>
              </div>
            </div>

            {/* Plan Status Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderRadius: '1rem', background: userData?.isPro ? 'rgba(30, 46, 61, 0.39)' : 'rgba(39, 39, 42, 0.3)', border: userData?.isPro ? '1px solid rgba(0, 76, 255, 0.84)' : '1px solid rgba(63, 63, 70, 0.4)' }}>
              {userData?.isPro ? (
                <>
                  <ShieldCheck size={24} color="#5578f7ff" />
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a855f7', fontWeight: 600 }}>Plan tier</div>
                    <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>Pro Member</div>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert size={24} color="#71717a" />
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', fontWeight: 600 }}>Plan tier</div>
                    <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>Free Account</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Grid: Left - Edit Natal Info, Right - Predictions */}
          <div className="profile-grid" style={{ alignItems: 'start', paddingBottom: '3rem' }}>

            {/* Left: Natal Form */}
            <motion.section
              className="glass-panel"
              style={{
                background: 'rgba(9, 9, 11, 0.7)',
                border: '1px solid rgba(39, 39, 42, 0.6)',
                borderRadius: '1.5rem',
                padding: '2rem',
                position: 'relative'
              }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(39,39,42,0.8)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <Sparkles color="#6D5DFB" size={20} />
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f4f4f5', fontWeight: 600 }}>Birth Parameters</h3>
              </div>

              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="profile-form-row">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={12} /> Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', borderRadius: '0.5rem', background: 'rgba(24, 24, 27, 0.6)', border: '1px solid #27272A', color: '#e4e4e7', outline: 'none' }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> Time
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', borderRadius: '0.5rem', background: 'rgba(24, 24, 27, 0.6)', border: '1px solid #27272A', color: '#e4e4e7', outline: 'none' }}
                      required
                    />
                  </div>
                </div>

                <div ref={searchContainerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                  <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={12} /> Birth Place
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      type="text"
                      placeholder="Search city/place..."
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      style={{ width: '100%', padding: '0.85rem', paddingRight: '2.5rem', fontSize: '0.9rem', borderRadius: '0.5rem', background: 'rgba(24, 24, 27, 0.6)', border: '1px solid #27272A', color: '#e4e4e7', outline: 'none' }}
                      required
                    />
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }}>
                      {isSearchingLocation ? (
                        <Loader2 size={16} className="spin text-primary" color="#6D5DFB" />
                      ) : (
                        <Search size={14} />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div
                        style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#18181B', border: '1px solid #27272A', borderRadius: '0.5rem', zIndex: 50, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                      >
                        {suggestions.map((loc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectLocation(loc)}
                            style={{ width: '100%', textAlign: 'left', padding: '0.85rem 1rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(39,39,42,0.5)', color: '#d4d4d8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                          >
                            <MapPin size={14} color="#6D5DFB" style={{ flexShrink: 0 }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="profile-form-row">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Globe size={12} /> Timezone
                    </label>
                    <select
                      value={timezoneOffset}
                      onChange={(e) => setTimezoneOffset(e.target.value)}
                      style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', borderRadius: '0.5rem', background: 'rgba(24, 24, 27, 0.6)', border: '1px solid #27272A', color: '#e4e4e7', outline: 'none' }}
                    >
                      <option value="-08:00">UTC-08:00 (PST)</option>
                      <option value="-05:00">UTC-05:00 (EST)</option>
                      <option value="+00:00">UTC+00:00 (GMT)</option>
                      <option value="+05:30">UTC+05:30 (IST)</option>
                      <option value="+08:00">UTC+08:00 (SGT)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Compass size={12} /> Coordinates
                    </label>
                    <div style={{ width: '100%', padding: '0.85rem', fontSize: '0.85rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(24,24,27,0.3)', border: '1px solid rgba(39, 39, 42, 0.4)', cursor: 'not-allowed' }}>
                      {latitude !== null && longitude !== null ? (
                        <span style={{ color: '#cebdff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {latitude.toFixed(2)}°N | {longitude.toFixed(2)}°E
                        </span>
                      ) : (
                        <span style={{ color: '#71717a' }}>None</span>
                      )}
                      <Globe size={14} color="#71717a" style={{ flexShrink: 0 }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a1a1aa' }}>Ayanamsa</label>
                  <select
                    value={ayanamsa}
                    onChange={(e) => setAyanamsa(e.target.value)}
                    style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', borderRadius: '0.5rem', background: 'rgba(24, 24, 27, 0.6)', border: '1px solid #27272A', color: '#e4e4e7', outline: 'none' }}
                  >
                    <option value="RAMAN">Raman</option>
                    <option value="LAHIRI">Lahiri</option>
                    <option value="KP">K.P.</option>
                  </select>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '0.95rem',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                      cursor: isUpdating ? 'not-allowed' : 'pointer',
                      background: 'linear-gradient(135deg, #6D5DFB 0%, #5b4be3 100%)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 8px 16px -4px rgba(109, 93, 251, 0.4)',
                      opacity: isUpdating ? 0.7 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 size={16} className="spin" />
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
              className="glass-panel"
              style={{
                background: 'rgba(9, 9, 11, 0.7)',
                border: '1px solid rgba(39, 39, 42, 0.6)',
                borderRadius: '1.5rem',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
              }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* Telemetry Stats */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(39,39,42,0.8)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <Activity color="#6D5DFB" size={20} />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f4f4f5', fontWeight: 600 }}>Cosmic Telemetry</h3>
                </div>

                <div className="profile-stats-grid">
                  <div style={{ background: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(39, 39, 42, 0.5)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', marginBottom: '0.25rem' }}>Messages Sent / Remaining</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                      {userData?.messageCount || 0} / {userData?.isPro ? '∞' : Math.max(0, 15 - (userData?.messageCount || 0))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(39, 39, 42, 0.5)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', marginBottom: '0.25rem' }}>Voice Time Used / Remaining</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6D5DFB' }}>
                      {getVoiceTimeUsed()} / {getVoiceTimeRemaining()} <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 500 }}>min</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(39, 39, 42, 0.5)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', marginBottom: '0.25rem' }}>Total Voice Purchased</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                      {getTotalVoiceMinutes()} <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 500 }}>min</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(24, 24, 27, 0.4)', border: '1px solid rgba(39, 39, 42, 0.5)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', marginBottom: '0.25rem' }}>Predictions</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{userData?.predictions?.length || 0}</div>
                  </div>
                </div>
              </div>

              {/* Transactions History */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(39,39,42,0.8)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <CreditCard color="#a855f7" size={20} />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f4f4f5', fontWeight: 600 }}>Billing & Passes</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {userData?.payments && userData.payments.length > 0 ? (
                    userData.payments.map((payment: any, index: number) => (
                      <div key={index} style={{ background: 'rgba(24, 24, 27, 0.3)', border: '1px solid rgba(39, 39, 42, 0.4)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{payment.durationInMinutes} Minutes Pass</div>
                          <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '0.15rem' }}>ID: {payment.paymentId}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>${payment.amount}</div>
                          <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '0.15rem' }}>{new Date(payment.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#71717a', fontSize: '0.85rem' }}>
                      No transactions recorded yet
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
}

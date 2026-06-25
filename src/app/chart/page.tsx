'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Download,
  Printer,
  Globe,
  Compass,
  Info,
  Search,
  X,
  Loader2
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
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
}

export default function BirthChartPage() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('1990-06-15');
  const [time, setTime] = useState('12:00');
  const [timezoneOffset, setTimezoneOffset] = useState('+05:30');
  const [locationQuery, setLocationQuery] = useState('Pilani, Surajgarh, Rajasthan, India');
  const [selectedLocationName, setSelectedLocationName] = useState('Pilani, Surajgarh, Rajasthan, India');
  const [latitude, setLatitude] = useState<number | null>(28.364);
  const [longitude, setLongitude] = useState<number | null>(75.601);

  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);
  const [svgData, setSvgData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleSync = () => {
      if (typeof window !== 'undefined') {
        setSidebarCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
      }
    };
    handleSync();
    window.addEventListener('sidebar-collapse-change', handleSync);
    return () => window.removeEventListener('sidebar-collapse-change', handleSync);
  }, []);

  useEffect(() => {
    document.body.classList.add('astraeus-active');

    const offset = -new Date().getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');
    setTimezoneOffset(`${sign}${hours}:${minutes}`);

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
      } finally {
        setLoading(false);
      }
    };

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
    }
  };

  const handleSelectLocation = (location: GeocodeResult) => {
    setLocationQuery(location.name);
    setSelectedLocationName(location.name);
    setLatitude(location.latitude);
    setLongitude(location.longitude);
    setSuggestions([]);
    toast.success(`Location set: ${location.name.split(',')[0]}`);
  };

  const handleGenerateChart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || latitude === null || longitude === null) {
      toast.error('Please enter all required birth details.');
      return;
    }

    setIsGeneratingChart(true);
    setError(null);
    setSvgData(null);

    const generatePromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('/api/chart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date, time, timezoneOffset, locationName: selectedLocationName,
            latitude, longitude,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Server error generating chart.');
        }

        const data = await response.json();
        setSvgData(data.svg);
        resolve(data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong.');
        reject(err);
      } finally {
        setIsGeneratingChart(false);
      }
    });

    toast.promise(generatePromise, {
      loading: 'Aligning planets and drawing natal chart...',
      success: 'Cosmic chart successfully drawn!',
      error: (err) => `Chart calculation failed: ${err.message || 'Unknown error'}`
    });
  };

  const handleDownloadSVG = () => {
    if (!svgData) return;
    try {
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `astro_birth_chart_${date.replace(/-/g, '')}_${time.replace(/:/g, '')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('SVG chart downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download chart.');
    }
  };

  const handlePrintChart = () => {
    if (!svgData) return;
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Popup blocked! Please allow popups to print.');
        return;
      }
      printWindow.document.write(`
        <html>
          <head>
            <title>Birth Chart - Astraeus Astrology</title>
            <style>
              body { background: white; color: black; font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; }
              .container { text-align: center; max-width: 600px; width: 100%; }
              svg { width: 100%; max-height: 500px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Natal Birth Chart</h2>
              <p>Date: ${date} | Time: ${time} (${timezoneOffset})</p>
              <p>Location: ${selectedLocationName}</p>
              ${svgData}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } catch (err) {
      toast.error('Failed to open print layout.');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0d12] text-white flex flex-col lg:flex-row selection:bg-primary/30 selection:text-white">
      <Sidebar />

      <main className={`flex-1 pt-24 lg:pt-8 pb-16 px-4 md:px-12 flex flex-col items-center overflow-y-auto w-full relative z-10 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        }`}>
        {/* Glow Background Orbs */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" style={{ top: '15%', left: '10%' }}></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#9d4edd]/5 blur-3xl pointer-events-none" style={{ bottom: '15%', right: '10%' }}></div>

        <div className="w-full max-w-[1280px] my-auto">

          <div className="flex justify-center w-full pb-12">
            <motion.section
              className="w-full max-w-[750px] bg-secondary/40 backdrop-blur-lg border border-card-border rounded-2xl p-8 md:p-10 shadow-2xl relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              {/* Subtle inner glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[300px] bg-primary/5 filter blur-[80px] pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 border-b border-card-border pb-4 mb-6">
                  <Sparkles className="text-primary" size={20} />
                  <h3 className="text-lg font-bold text-white">Natal Details</h3>
                </div>

                <form onSubmit={handleGenerateChart} className="flex flex-col gap-5">

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
                      className={`w-full py-3.5 px-6 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_16px_-4px_rgba(109,93,251,0.4)] bg-gradient-to-r from-primary to-[#5b4be3] text-white hover:opacity-90 transition-all ${isGeneratingChart ? 'opacity-70 cursor-not-allowed' : ''}`}
                      disabled={isGeneratingChart}
                    >
                      {isGeneratingChart ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          CALCULATING HEAVENS...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          GENERATE BLUEPRINT
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* DYNAMIC RESULTS RENDERED BELOW FORM */}
              <AnimatePresence mode="wait">
                {(isGeneratingChart || svgData || error) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '2.5rem' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="border-t border-card-border pt-8 overflow-hidden"
                  >
                    {error && (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mb-4">
                          <X className="text-red-500" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-red-500 mb-1">Calculation Failed</h3>
                        <p className="text-white/50 text-sm">{error}</p>
                      </div>
                    )}

                    {svgData && !isGeneratingChart && (
                      <div className="flex flex-col items-center">
                        <div className="text-center mb-6 w-full">
                          <span className="text-primary text-[10px] font-extrabold uppercase tracking-widest block mb-1">Generated Output</span>
                          <h3 className="text-xl font-extrabold text-white">
                            Rasi D-1 Chart
                          </h3>
                        </div>

                        <div
                          className="w-full flex justify-center bg-[#0c0d12]/60 border border-card-border rounded-xl p-6 [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[480px] [&>svg]:object-contain"
                          dangerouslySetInnerHTML={{ __html: svgData }}
                        />

                        <div className="flex items-center gap-4 mt-8">
                          <button
                            onClick={handleDownloadSVG}
                            className="px-5 py-2.5 rounded-lg flex items-center gap-2 bg-[#18181b] border border-card-border hover:border-white/10 text-white cursor-pointer text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            <Download size={16} /> SVG
                          </button>
                          <button
                            onClick={handlePrintChart}
                            className="px-5 py-2.5 rounded-lg flex items-center gap-2 bg-[#18181b] border border-card-border hover:border-white/10 text-white cursor-pointer text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            <Printer size={16} /> Print
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
}
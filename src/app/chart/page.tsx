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
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import '../astraeus.css';

interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
}

export default function BirthChartPage() {
  const [date, setDate] = useState('1990-06-15');
  const [time, setTime] = useState('12:00');
  const [timezoneOffset, setTimezoneOffset] = useState('+05:30');
  const [locationQuery, setLocationQuery] = useState('Pilani, Surajgarh, Rajasthan, India');
  const [selectedLocationName, setSelectedLocationName] = useState('Pilani, Surajgarh, Rajasthan, India');
  const [latitude, setLatitude] = useState<number | null>(28.364);
  const [longitude, setLongitude] = useState<number | null>(75.601);
  const [chartType, setChartType] = useState('RasiD1');
  const [ayanamsa, setAyanamsa] = useState('RAMAN');

  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);
  const [svgData, setSvgData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('astraeus-active');

    const offset = -new Date().getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');
    setTimezoneOffset(`${sign}${hours}:${minutes}`);

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
            latitude, longitude, chartType, ayanamsa,
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
    <div className="theme-astraeus sidebar-layout min-h-screen">

      <style>{`
        .chart-svg-wrapper svg {
          width: 100% !important;
          height: auto !important;
          max-height: 500px !important;
          object-fit: contain;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <Sidebar />

      <main className="page-main relative z-10 flex-1 fade-in" style={{ padding: '2rem 3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
        <div className="glow-orb glow-orb-1 pointer-events-none"></div>
        <div className="glow-orb glow-orb-2 pointer-events-none"></div>

        <div className="astral-container" style={{ width: '100%', maxWidth: '1280px' }}>

          <div className="page-heading" style={{ marginBottom: '1.5rem' }}>
            <p className="section-kicker" style={{ color: '#6D5DFB', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem' }}>Birth chart</p>
            <h1 className="page-title" style={{ fontSize: '2.5rem', margin: '0 0 1rem 0', fontWeight: 800, color: '#fff' }}>Build fast, read fast.</h1>
            <p className="page-lead" style={{ maxWidth: '48rem', color: '#a1a1aa', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Enter the essentials, generate the chart, and keep the result panel clean enough to actually use.
            </p>
          </div>

          <div className="chart-meta-strip" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <div className="chart-meta-chip" style={{ padding: '0.6rem 1.2rem', borderRadius: '9999px', background: 'rgba(39, 39, 42, 0.4)', border: '1px solid #27272A', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="metric-label" style={{ color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mode</span>
              <strong style={{ color: '#e4e4e7', fontSize: '0.875rem' }}>Chart workbench</strong>
            </div>
            <div className="chart-meta-chip" style={{ padding: '0.6rem 1.2rem', borderRadius: '9999px', background: 'rgba(39, 39, 42, 0.4)', border: '1px solid #27272A', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="metric-label" style={{ color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Format</span>
              <strong style={{ color: '#e4e4e7', fontSize: '0.875rem' }}>Rasi D1 / Navamsa</strong>
            </div>
            <div className="chart-meta-chip" style={{ padding: '0.6rem 1.2rem', borderRadius: '9999px', background: 'rgba(39, 39, 42, 0.4)', border: '1px solid #27272A', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="metric-label" style={{ color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output</span>
              <strong style={{ color: '#e4e4e7', fontSize: '0.875rem' }}>SVG + interpretation</strong>
            </div>
          </div>

          {/* SINGLE CENTERED STAGE (Voice Page Layout) */}
          <div className="chart-shell" style={{ display: 'flex', justifyContent: 'center', width: '100%', paddingBottom: '3rem' }}>
            <motion.section
              className="chart-stage glass-panel shared-surface"
              style={{
                width: '100%',
                maxWidth: '750px',
                background: 'rgba(9, 9, 11, 0.7)',
                border: '1px solid rgba(39, 39, 42, 0.6)',
                borderRadius: '1.5rem',
                padding: '2.5rem',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              {/* Subtle inner glow */}
              <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '300px', background: 'rgba(109, 93, 251, 0.05)', filter: 'blur(80px)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(39,39,42,0.8)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                  <Sparkles color="#6D5DFB" size={20} />
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f4f4f5', fontWeight: 600 }}>Natal Details</h3>
                </div>

                <form onSubmit={handleGenerateChart} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
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
                      <div style={{ width: '100%', padding: '0.85rem', fontSize: '0.8rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(24,24,27,0.3)', border: '1px solid rgba(39, 39, 42, 0.4)', cursor: 'not-allowed' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a1a1aa' }}>Format</label>
                      <select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', borderRadius: '0.5rem', background: 'rgba(24, 24, 27, 0.6)', border: '1px solid #27272A', color: '#e4e4e7', outline: 'none' }}
                      >
                        <option value="RasiD1">Rasi (D1)</option>
                        <option value="NavamsaD9">Navamsa (D9)</option>
                      </select>
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
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        padding: '1.2rem',
                        fontSize: '1rem',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        cursor: isGeneratingChart ? 'not-allowed' : 'pointer',
                        background: 'linear-gradient(135deg, #6D5DFB 0%, #5b4be3 100%)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 10px 20px -5px rgba(109, 93, 251, 0.4)',
                        opacity: isGeneratingChart ? 0.7 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      disabled={isGeneratingChart}
                    >
                      {isGeneratingChart ? (
                        <>
                          <Loader2 size={18} className="spin" />
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
                    style={{ borderTop: '1px solid rgba(39,39,42,0.8)', paddingTop: '2.5rem', overflow: 'hidden' }}
                  >
                    {error && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                          <X color="#ef4444" size={30} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ef4444', margin: '0 0 0.5rem 0' }}>Calculation Failed</h3>
                        <p style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>{error}</p>
                      </div>
                    )}

                    {svgData && !isGeneratingChart && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', width: '100%' }}>
                          <span style={{ color: '#6D5DFB', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.3rem' }}>Generated Output</span>
                          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', margin: '0 0 0.2rem 0' }}>
                            {chartType === 'RasiD1' ? 'Rasi D-1 Chart' : `${chartType} Chart`}
                          </h3>
                        </div>

                        <div
                          className="chart-svg-wrapper"
                          style={{ width: '100%', display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem', padding: '1.5rem' }}
                          dangerouslySetInnerHTML={{ __html: svgData }}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                          <button
                            onClick={handleDownloadSVG}
                            style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(39,39,42,0.8)', border: '1px solid rgba(63,63,70,0.5)', color: '#e4e4e7', cursor: 'pointer', fontSize: '0.9rem' }}
                          >
                            <Download size={16} /> SVG
                          </button>
                          <button
                            onClick={handlePrintChart}
                            style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(39,39,42,0.8)', border: '1px solid rgba(63,63,70,0.5)', color: '#e4e4e7', cursor: 'pointer', fontSize: '0.9rem' }}
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
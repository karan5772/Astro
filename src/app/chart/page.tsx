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
  Check, 
  HelpCircle,
  TrendingUp,
  Award,
  Layers
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';
import '../astraeus.css';

interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
}

export default function BirthChartPage() {
  // Set default values matching the example from the prompt
  const [date, setDate] = useState('1990-06-15');
  const [time, setTime] = useState('12:00');
  const [timezoneOffset, setTimezoneOffset] = useState('+05:30');
  const [locationQuery, setLocationQuery] = useState('Pilani, Surajgarh, Rajasthan, India');
  const [selectedLocationName, setSelectedLocationName] = useState('Pilani, Surajgarh, Rajasthan, India');
  const [latitude, setLatitude] = useState<number | null>(28.364);
  const [longitude, setLongitude] = useState<number | null>(75.601);
  const [chartType, setChartType] = useState('RasiD1');
  const [ayanamsa, setAyanamsa] = useState('RAMAN');

  // UI state
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);
  const [svgData, setSvgData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'guide'>('chart');
  
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Set default timezone offset based on user's browser location on mount
  useEffect(() => {
    document.body.classList.add('astraeus-active');
    
    // Inferrer for timezone offset
    const offset = -new Date().getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');
    setTimezoneOffset(`${sign}${hours}:${minutes}`);

    // Close autocomplete on click outside
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

  // Fetch location autocomplete suggestions
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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date,
            time,
            timezoneOffset,
            locationName: selectedLocationName,
            latitude,
            longitude,
            chartType,
            ayanamsa,
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

  // Download SVG file handler
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

  // Print chart handler
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
              body {
                background: white;
                color: black;
                font-family: sans-serif;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
              }
              .container {
                text-align: center;
                max-width: 600px;
                width: 100%;
              }
              svg {
                width: 100%;
                max-height: 500px;
                margin-top: 20px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                border-radius: 8px;
              }
              h2 { margin: 5px 0; color: #333; }
              p { margin: 3px 0; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Natal Birth Chart</h2>
              <p>Date: ${date} | Time: ${time} (${timezoneOffset})</p>
              <p>Location: ${selectedLocationName}</p>
              <p>Coordinates: Lat ${latitude !== null ? latitude.toFixed(3) : ''}°, Lon ${longitude !== null ? longitude.toFixed(3) : ''}°</p>
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
    <div className="theme-astraeus selection:bg-[#e9c349]/30 selection:text-[#ffe088] min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <Navbar variant="legal" />

      {/* Main Content container */}
      <main className="relative z-10 pt-32 pb-24 flex-1">
        <div className="glow-orb glow-orb-1" style={{ top: '15%', left: '10%' }}></div>
        <div className="glow-orb glow-orb-2" style={{ bottom: '25%', right: '10%' }}></div>

        <div className="astral-container">
          {/* Page Heading Section */}
          <div className="text-center mb-12">
            <motion.div 
              className="astral-chip font-label-caps mx-auto mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Compass size={16} className="text-[#e9c349]" fill="currentColor" />
              <span>Celestial Calculations</span>
            </motion.div>
            <motion.h1 
              className="astral-hero-title hero-title-gradient font-display text-center mx-auto"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Generate Natal Birth Chart
            </motion.h1>
            <motion.p 
              className="astral-hero-desc text-center mx-auto"
              style={{ maxWidth: '600px', marginBottom: 0 }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Map the planetary alignment at the exact second of your birth. Discover your elements, placements, and cosmic blueprints.
            </motion.p>
          </div>

          {/* Form & Result Grid */}
          <div className="chart-grid">
            {/* Form Section */}
            <motion.div 
              className="glass-panel p-8"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <form onSubmit={handleGenerateChart} className="chart-form-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(233,195,73,0.15)', paddingBottom: '0.75rem', marginBottom: '0.5rem' }}>
                  <Sparkles className="text-[#e9c349]" size={20} />
                  <h3 className="font-display text-[#e9c349]" style={{ margin: 0, fontSize: '1.25rem' }}>Natal Details</h3>
                </div>

                {/* Birth Date and Time Row */}
                <div className="chart-input-row">
                  <div className="chart-input-group">
                    <label className="chart-input-label">
                      <Calendar size={14} className="inline mr-1" /> Date of Birth
                    </label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                      className="chart-input-field" 
                      required 
                    />
                  </div>

                  <div className="chart-input-group">
                    <label className="chart-input-label">
                      <Clock size={14} className="inline mr-1" /> Time of Birth
                    </label>
                    <input 
                      type="time" 
                      value={time} 
                      onChange={(e) => setTime(e.target.value)} 
                      className="chart-input-field" 
                      required 
                    />
                  </div>
                </div>

                {/* Location Search Input */}
                <div className="chart-input-group" ref={searchContainerRef}>
                  <label className="chart-input-label">
                    <MapPin size={14} className="inline mr-1" /> Birth Location
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search city/place..."
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      className="chart-input-field"
                      style={{ paddingRight: '2.5rem' }}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-muted">
                      {isSearchingLocation ? (
                        <div className="w-4 h-4 border-2 border-t-transparent border-[#e9c349] rounded-full animate-spin"></div>
                      ) : (
                        <Search size={16} />
                      )}
                    </div>
                  </div>

                  {/* Autocomplete Dropdown suggestions list */}
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div 
                        className="autocomplete-dropdown"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                      >
                        {suggestions.map((loc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="autocomplete-item"
                            onClick={() => handleSelectLocation(loc)}
                          >
                            <MapPin size={14} className="text-[#e9c349] shrink-0" />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Timezone offset and Coordinates read-only */}
                <div className="chart-input-row">
                  <div className="chart-input-group">
                    <label className="chart-input-label">
                      <Globe size={14} className="inline mr-1" /> UTC Timezone Offset
                    </label>
                    <select 
                      value={timezoneOffset} 
                      onChange={(e) => setTimezoneOffset(e.target.value)} 
                      className="chart-input-field"
                    >
                      <option value="-12:00">UTC-12:00 (Baker Island)</option>
                      <option value="-11:00">UTC-11:00 (Samoa)</option>
                      <option value="-10:00">UTC-10:00 (Hawaii)</option>
                      <option value="-09:00">UTC-09:00 (Alaska)</option>
                      <option value="-08:00">UTC-08:00 (Pacific Time)</option>
                      <option value="-07:00">UTC-07:00 (Mountain Time)</option>
                      <option value="-06:00">UTC-06:00 (Central Time)</option>
                      <option value="-05:00">UTC-05:00 (Eastern Time)</option>
                      <option value="-04:00">UTC-04:00 (Atlantic Time)</option>
                      <option value="-03:00">UTC-03:00 (Buenos Aires)</option>
                      <option value="-02:00">UTC-02:00 (Mid-Atlantic)</option>
                      <option value="-01:00">UTC-01:00 (Azores)</option>
                      <option value="+00:00">UTC+00:00 (GMT/London)</option>
                      <option value="+01:00">UTC+01:00 (Central European Time)</option>
                      <option value="+02:00">UTC+02:00 (Eastern European Time)</option>
                      <option value="+03:00">UTC+03:00 (Moscow/Nairobi)</option>
                      <option value="+03:30">UTC+03:30 (Tehran)</option>
                      <option value="+04:00">UTC+04:00 (Dubai/Baku)</option>
                      <option value="+04:30">UTC+04:30 (Kabul)</option>
                      <option value="+05:00">UTC+05:00 (Karachi/Tashkent)</option>
                      <option value="+05:30">UTC+05:30 (India/Sri Lanka)</option>
                      <option value="+05:45">UTC+05:45 (Kathmandu)</option>
                      <option value="+06:00">UTC+06:00 (Dhaka/Almaty)</option>
                      <option value="+06:30">UTC+06:30 (Yangon)</option>
                      <option value="+07:00">UTC+07:00 (Bangkok/Jakarta)</option>
                      <option value="+08:00">UTC+08:00 (Singapore/Beijing)</option>
                      <option value="+09:00">UTC+09:00 (Tokyo/Seoul)</option>
                      <option value="+09:30">UTC+09:30 (Adelaide)</option>
                      <option value="+10:00">UTC+10:00 (Sydney/Vladivostok)</option>
                      <option value="+11:00">UTC+11:00 (Solomon Islands)</option>
                      <option value="+12:00">UTC+12:00 (Auckland/Fiji)</option>
                      <option value="+13:00">UTC+13:00 (Tonga)</option>
                      <option value="+14:00">UTC+14:00 (Line Islands)</option>
                    </select>
                  </div>

                  <div className="chart-input-group">
                    <label className="chart-input-label">
                      <Compass size={14} className="inline mr-1" /> Coordinates
                    </label>
                    <div 
                      className="chart-input-field flex items-center justify-between" 
                      style={{ background: 'rgba(255,255,255,0.02)', cursor: 'default' }}
                    >
                      {latitude !== null && longitude !== null ? (
                        <span className="text-[#cebdff]" style={{ fontSize: '13px' }}>
                          Lat: {latitude.toFixed(3)}° | Lon: {longitude.toFixed(3)}°
                        </span>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '13px' }}>No location selected</span>
                      )}
                      <Globe size={14} className="text-muted" />
                    </div>
                  </div>
                </div>

                {/* Advanced parameters selectors */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', borderBottom: '1px solid rgba(233,195,73,0.15)', paddingBottom: '0.5rem' }}>
                  <Info className="text-muted" size={16} />
                  <h4 className="font-display text-muted" style={{ margin: 0, fontSize: '0.95rem' }}>Calculation Settings</h4>
                </div>

                <div className="chart-input-row">
                  <div className="chart-input-group">
                    <label className="chart-input-label">Chart Format</label>
                    <select 
                      value={chartType} 
                      onChange={(e) => setChartType(e.target.value)} 
                      className="chart-input-field"
                    >
                      <option value="RasiD1">Rasi (D1 - Birth Placements)</option>
                      <option value="NavamsaD9">Navamsa (D9 - Soul & Marriage)</option>
                      <option value="HoraD2">Hora (D2 - Wealth & Finance)</option>
                      <option value="DrekkanaD3">Drekkana (D3 - Siblings & Actions)</option>
                    </select>
                  </div>

                  <div className="chart-input-group">
                    <label className="chart-input-label">Ayanamsa system</label>
                    <select 
                      value={ayanamsa} 
                      onChange={(e) => setAyanamsa(e.target.value)} 
                      className="chart-input-field"
                    >
                      <option value="RAMAN">Raman Ayanamsa</option>
                      <option value="LAHIRI">Lahiri Ayanamsa (Chitra Paksha)</option>
                      <option value="KP">K.P. Ayanamsa</option>
                      <option value="FAGANBRADLEY">Fagan Bradley Ayanamsa</option>
                    </select>
                  </div>
                </div>

                {/* Submit button */}
                <button 
                  type="submit" 
                  className="glow-button-primary cursor-pointer mt-4"
                  style={{ width: '100%', padding: '1rem' }}
                  disabled={isGeneratingChart}
                >
                  {isGeneratingChart ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></span>
                      CALCULATING PLANETS...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles size={16} />
                      GENERATE BIRTH CHART
                    </span>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Results Section */}
            <motion.div 
              className="glass-panel chart-result-card"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Overlay Orb glow inside card */}
              <div className="absolute right-0 bottom-0 w-48 h-48 bg-[#e9c349]/5 rounded-full blur-[60px] pointer-events-none" />

              {isGeneratingChart && (
                <div className="chart-loading-container">
                  <div className="constellation-spinner"></div>
                  <h3 className="loading-text-glow">Consulting the Heavens</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--on-surface-variant)', fontSize: '13px' }}>
                    <span>Positioning the Sun, Moon, and Ascendant...</span>
                    <span>Mapping 12 zodiac houses according to {ayanamsa} ayanamsa...</span>
                  </div>
                </div>
              )}

              {!isGeneratingChart && !svgData && !error && (
                <div className="text-center p-8">
                  <div className="feature-icon-wrapper mx-auto mb-4" style={{ width: '4.5rem', height: '4.5rem', borderRadius: '1.25rem' }}>
                    <Compass size={36} className="text-[#e9c349]" />
                  </div>
                  <h3 className="font-display text-[#e9c349] mb-3" style={{ fontSize: '1.5rem' }}>Chart Output</h3>
                  <p className="text-muted" style={{ maxWidth: '380px', margin: '0 auto', fontSize: '14px', lineHeight: 1.6 }}>
                    Fill in your details and click **Generate** to draw your South Indian style horoscope wheel.
                  </p>
                  
                  <div style={{ border: '1px dashed rgba(233,195,73,0.15)', background: 'rgba(233,195,73,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', marginTop: '1.5rem', fontSize: '12px', display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--on-surface-variant)' }}>
                    <Info size={16} className="text-[#e9c349] shrink-0" />
                    <span style={{ textAlign: 'left' }}>The South Indian chart style presents the 12 zodiac houses in a clockwise format. It is a traditional map used in Vedic Astrology.</span>
                  </div>
                </div>
              )}

              {!isGeneratingChart && error && (
                <div className="text-center p-8">
                  <div className="feature-icon-wrapper mx-auto mb-4" style={{ background: 'rgba(147,0,10,0.2)', border: '1px solid rgba(255,180,171,0.3)', color: '#ffb4ab' }}>
                    <X size={30} />
                  </div>
                  <h3 className="font-display" style={{ color: '#ffb4ab', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Failed to generate</h3>
                  <p className="text-muted" style={{ maxWidth: '350px', margin: '0 auto', fontSize: '13px' }}>
                    {error}
                  </p>
                  <button 
                    onClick={handleGenerateChart} 
                    className="glow-button-secondary mt-6"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '11px' }}
                  >
                    Retry Calculation
                  </button>
                </div>
              )}

              {!isGeneratingChart && svgData && (
                <div className="w-full h-full p-6 flex flex-col items-center justify-between z-10">
                  <div className="text-center mb-4">
                    <span className="font-label-caps text-[#e9c349] text-xs block mb-1">Generated Output</span>
                    <h3 className="font-display text-white" style={{ fontSize: '1.3rem', margin: 0 }}>
                      {chartType === 'RasiD1' ? 'Rasi D-1 Chart' : 'Navamsa D-9 Chart'}
                    </h3>
                    <p className="text-muted" style={{ fontSize: '11px', margin: '4px 0 0 0' }}>
                      {date} | {time} | {selectedLocationName.split(',')[0]}
                    </p>
                  </div>

                  {/* Render the SVG Inline */}
                  <div 
                    className="svg-display-wrapper" 
                    dangerouslySetInnerHTML={{ __html: svgData }} 
                  />

                  {/* Actions buttons */}
                  <div className="chart-actions-row">
                    <button 
                      onClick={handleDownloadSVG}
                      className="btn btn-outline"
                      style={{ padding: '0.6rem 1.2rem', fontSize: '13px', borderRadius: '8px' }}
                    >
                      <Download size={15} />
                      Download SVG
                    </button>
                    <button 
                      onClick={handlePrintChart}
                      className="btn btn-outline"
                      style={{ padding: '0.6rem 1.2rem', fontSize: '13px', borderRadius: '8px' }}
                    >
                      <Printer size={15} />
                      Print Chart
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Tab Navigation for Guide */}
          <div className="chart-guide-section">
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => setActiveTab('chart')}
                className={`font-label-caps pb-2 cursor-pointer ${activeTab === 'chart' ? 'text-[#e9c349] border-b-2 border-[#e9c349]' : 'text-muted'}`}
                style={{ background: 'transparent', border: 'none', fontWeight: 600, fontSize: '12px' }}
              >
                Chart Interpretation
              </button>
              <button 
                onClick={() => setActiveTab('guide')}
                className={`font-label-caps pb-2 cursor-pointer ${activeTab === 'guide' ? 'text-[#e9c349] border-b-2 border-[#e9c349]' : 'text-muted'}`}
                style={{ background: 'transparent', border: 'none', fontWeight: 600, fontSize: '12px' }}
              >
                Vedic Elements
              </button>
            </div>

            {activeTab === 'chart' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="guide-grid"
              >
                <div className="guide-step-card">
                  <div className="guide-step-title">
                    <TrendingUp size={16} />
                    <span>1. Clockwise Zodiac Order</span>
                  </div>
                  <p className="guide-step-desc">
                    In South Indian charts, houses are laid out in a fixed clockwise order starting from Aries in the second box of the top row, down through Pisces. The Ascendant (Lagna) is indicated by diagonal lines or the letter &quot;Asc/Lg&quot;.
                  </p>
                </div>

                <div className="guide-step-card">
                  <div className="guide-step-title">
                    <Award size={16} />
                    <span>2. Planet Symbols</span>
                  </div>
                  <p className="guide-step-desc">
                    Planets are represented by abbreviations (e.g., Su = Sun, Mo = Moon, Ma = Mars, Me = Mercury, Ju = Jupiter, Ve = Venus, Sa = Saturn, Ra = Rahu, Ke = Ketu). Their presence in a square indicates their house residency.
                  </p>
                </div>

                <div className="guide-step-card">
                  <div className="guide-step-title">
                    <Layers size={16} />
                    <span>3. Planetary Strengths</span>
                  </div>
                  <p className="guide-step-desc">
                    The houses represent different aspects of life: 1st (self/health), 2nd (wealth/speech), 5th (intellect/children), 7th (marriage/partners), 10th (profession). Planets occupying these houses influence their outcomes based on dignity.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="guide-grid"
              >
                <div className="guide-step-card">
                  <div className="guide-step-title">
                    <span className="text-[#ffe088]">✦</span>
                    <span>Raman vs Lahiri</span>
                  </div>
                  <p className="guide-step-desc">
                    Ayanamsa is the angular distance between the sidereal and tropical zodiacs. Lahiri is officially used by the Indian Government, while Raman is favored by Bangalore Venkata Raman. They differ by about 1.4 degrees.
                  </p>
                </div>

                <div className="guide-step-card">
                  <div className="guide-step-title">
                    <span className="text-[#ffe088]">✦</span>
                    <span>Rasi vs Navamsa</span>
                  </div>
                  <p className="guide-step-desc">
                    The Rasi D-1 chart represents the physical manifestation of life (body, actions, health). The Navamsa D-9 divisional chart shows the inner strength, spiritual essence, and potential in marriage.
                  </p>
                </div>

                <div className="guide-step-card">
                  <div className="guide-step-title">
                    <span className="text-[#ffe088]">✦</span>
                    <span>Vedic Astrological Science</span>
                  </div>
                  <p className="guide-step-desc">
                    Vedic astrology (Jyotish) is a predictive science rooted in the ancient Vedas. It calculates planetary gravity and astronomical coordinates at the time of birth to draw karma-based blueprints.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Footer component */}
      <Footer />
    </div>
  );
}

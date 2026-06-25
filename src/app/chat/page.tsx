'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  User,
  Copy,
  Check,
  Briefcase,
  Heart,
  Compass,
  Moon,
  MapPin,
  Calendar,
  Clock,
  Globe,
  Search,
  Lock,
  Info,
  X,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
}

const SUGGESTIONS = [
  {
    title: "Career & Success",
    prompt: "What does my birth chart say about my career?",
    description: "Explore your professional path and wealth potential.",
    icon: "Briefcase"
  },
  {
    title: "Love & Alignment",
    prompt: "How will planetary alignments affect my love life?",
    description: "Understand your relationship patterns and compatibility.",
    icon: "Heart"
  },
  {
    title: "Daily Oracle",
    prompt: "Can you give me a general reading for today?",
    description: "Receive your daily astrological transit update.",
    icon: "Compass"
  },
  {
    title: "Inner Harmony",
    prompt: "What is the cosmic advice for finding peace?",
    description: "Seek astrological wisdom for mindfulness and balance.",
    icon: "Moon"
  }
];

const getSuggestionIcon = (iconName: string) => {
  switch (iconName) {
    case 'Briefcase': return <Briefcase color="#cebdff" size={20} />;
    case 'Heart': return <Heart color="#ffb4ab" size={20} />;
    case 'Compass': return <Compass color="#6D5DFB" size={20} />;
    case 'Moon': return <Moon color="#c0c6db" size={20} />;
    default: return <Sparkles color="#6D5DFB" size={20} />;
  }
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Reading copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy text");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="copy-btn"
      title="Copy reading"
    >
      {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
    </button>
  );
}

function MarkdownText({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="markdown-content">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={index} className="font-semibold text-accent text-sm md:text-base mt-3 mb-1">
              {renderInline(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={index} className="font-bold text-accent text-base md:text-lg mt-4 mb-1.5">
              {renderInline(trimmed.slice(3))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={index} className="font-bold text-accent text-lg md:text-xl mt-5 mb-2">
              {renderInline(trimmed.slice(2))}
            </h2>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={index} className="flex items-start gap-2 my-1 pl-2 text-sm md:text-base">
              <span className="text-primary mt-1.5 flex-shrink-0" style={{ fontSize: '0.65rem' }}>◆</span>
              <span className="leading-relaxed">{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        if (trimmed === '') {
          return <div key={index} className="h-2" />;
        }

        return (
          <p key={index} className="my-1.5 leading-relaxed text-sm md:text-base">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold" style={{ color: 'var(--accent)' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

const getMockPlacements = (dateStr?: string) => {
  if (!dateStr) return [];
  const date = new Date(dateStr);
  const month = date.getMonth();
  const day = date.getDate();

  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const sunSign = signs[(month + (day > 20 ? 1 : 0)) % 12];
  const moonSign = signs[(month + day) % 12];
  const lagnaSign = signs[(day * 3 + 1) % 12];
  const venusSign = signs[(month + 2) % 12];

  return [
    { body: "Sun", sign: sunSign, degree: `${(day * 1.3).toFixed(1)}°` },
    { body: "Moon", sign: moonSign, degree: `${(day * 2.1).toFixed(1)}°` },
    { body: "Ascendant", sign: lagnaSign, degree: `${(day * 0.7).toFixed(1)}°` },
    { body: "Venus", sign: venusSign, degree: `${(day * 1.5).toFixed(1)}°` }
  ];
};

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [localInput, setLocalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Profile status check
  const [checkingDetails, setCheckingDetails] = useState(true);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);

  // Onboarding Form States (defaulting to standard Raman birth metadata)
  const [birthDate, setBirthDate] = useState('1990-06-15');
  const [birthTime, setBirthTime] = useState('12:00');
  const [birthTimezone, setBirthTimezone] = useState('+05:30');
  const [locationQuery, setLocationQuery] = useState('Pilani, Surajgarh, Rajasthan, India');
  const [selectedLocationName, setSelectedLocationName] = useState('Pilani, Surajgarh, Rajasthan, India');
  const [latitude, setLatitude] = useState<number | null>(28.364);
  const [longitude, setLongitude] = useState<number | null>(75.601);

  // Autocomplete state
  const [locationSuggestions, setLocationSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.add('astraeus-active');

    // Inferrer for timezone offset
    const offset = -new Date().getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');
    setBirthTimezone(`${sign}${hours}:${minutes}`);

    // Check user profile data on load
    async function checkUserProfile() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setDbUser(data);
          if (!data.hasBirthDetails) {
            setShowOnboardingForm(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user metadata:', err);
      } finally {
        setCheckingDetails(false);
      }
    }

    checkUserProfile();

    // Autocomplete click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setLocationSuggestions([]);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.body.classList.remove('astraeus-active');
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch location autocomplete
  useEffect(() => {
    if (!locationQuery || locationQuery === selectedLocationName || locationQuery.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(locationQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setLocationSuggestions(data);
        }
      } catch (err) {
        console.error('Failed to search locations:', err);
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
    setLocationSuggestions([]);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate || !birthTime || latitude === null || longitude === null) {
      toast.error('Please enter all required birth details.');
      return;
    }

    setIsSubmittingDetails(true);

    const savePromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            birthDate,
            birthTime,
            birthTimezone,
            birthLocation: selectedLocationName,
            birthLatitude: latitude,
            birthLongitude: longitude,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Server error saving birth details.');
        }

        const data = await response.json();
        setDbUser(data);
        setShowOnboardingForm(false);
        resolve(data);
      } catch (err: any) {
        reject(err);
      } finally {
        setIsSubmittingDetails(false);
      }
    });

    toast.promise(savePromise, {
      loading: 'Syncing with the cosmos & querying horoscope predictions...',
      success: 'Cosmic profile locked! Planetary readings initialized.',
      error: (err) => `Failed to synchronize: ${err.message || 'Unknown error'}`
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const submitMessage = async (messageText: string) => {
    if (!messageText || !messageText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const newMessages: Message[] = [...messages, { id: `u-${messages.length}`, role: 'user', content: messageText }];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!res.ok) {
        if (res.status === 403) {
          const errText = await res.text();
          if (errText === 'TRIAL_LIMIT_REACHED') {
            throw new Error('TRIAL_LIMIT_REACHED');
          }
        }
        throw new Error(`Server returned ${res.status}`);
      }

      const aiMessageId = `ai-${newMessages.length}`;
      setMessages((prev) => [...prev, { id: aiMessageId, role: 'assistant', content: '' }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          setMessages((prev) =>
            prev.map(m => m.id === aiMessageId ? { ...m, content: m.content + chunk } : m)
          );
        }
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      if (err.message === 'TRIAL_LIMIT_REACHED') {
        toast.error("Your free 15-message trial has ended. Please upgrade to continue.");
        router.push('/pricing');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!localInput.trim()) return;
    const text = localInput;
    setLocalInput('');
    submitMessage(text);
  };

  const showTypingIndicator = isLoading && (
    messages.length === 0 ||
    (messages[messages.length - 1].role === 'assistant'
      ? messages[messages.length - 1].content.length === 0
      : true)
  );

  // 1. Render global loader while fetching user details
  if (checkingDetails) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-white flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  // 2. Render onboarding details collection form if not configured
  if (showOnboardingForm) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-white flex flex-col lg:flex-row selection:bg-primary/30 selection:text-white">
        <Sidebar />

        <main className="flex-1 pt-24 lg:pt-8 pb-16 px-4 md:px-12 lg:pl-[300px] flex items-center justify-center relative z-10 w-full">
          {/* Glow Background Orbs */}
          <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" style={{ top: '15%', left: '10%' }}></div>
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[#9d4edd]/5 blur-3xl pointer-events-none" style={{ bottom: '15%', right: '10%' }}></div>

          <motion.div
            className="p-8 w-full max-w-lg bg-[#18181b]/40 backdrop-blur-lg border border-card-border rounded-2xl shadow-2xl relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {dbUser?.hasBirthDetails && (
              <button
                type="button"
                onClick={() => setShowOnboardingForm(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}

            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-4">
                {dbUser?.hasBirthDetails ? (
                  <Sparkles size={32} />
                ) : (
                  <Lock size={32} />
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                {dbUser?.hasBirthDetails ? 'Update Cosmic Identity' : 'Unlock Cosmic Identity'}
              </h1>
              <p className="text-xs text-white/50 leading-relaxed mt-0">
                {dbUser?.hasBirthDetails
                  ? 'Modify your birth parameters to recalculate your planetary placements and predictions.'
                  : 'Before starting your chat reading, please enter your exact birth metadata. Our Vedic systems will map your placements to provide accurate horoscope predictions.'}
              </p>
            </div>

            <form onSubmit={handleSaveDetails} className="flex flex-col gap-4">
              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1.5">
                    <Calendar size={13} className="shrink-0" /> Date of Birth
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full p-3 text-sm rounded-lg bg-secondary/80 border border-card-border text-white outline-none focus:border-primary/50 transition-colors"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1.5">
                    <Clock size={13} className="shrink-0" /> Time of Birth
                  </label>
                  <input
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="w-full p-3 text-sm rounded-lg bg-secondary/80 border border-card-border text-white outline-none focus:border-primary/50 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Location Autocomplete */}
              <div className="flex flex-col gap-2 relative" ref={searchContainerRef}>
                <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1.5">
                  <MapPin size={13} className="shrink-0" /> Birth Place
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="w-full p-3 pr-10 text-sm rounded-lg bg-secondary/80 border border-card-border text-white outline-none focus:border-primary/50 transition-colors"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-white/40">
                    {isSearchingLocation ? (
                      <Loader2 size={16} className="animate-spin text-primary" />
                    ) : (
                      <Search size={15} />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {locationSuggestions.length > 0 && (
                    <motion.div
                      className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#18181B] border border-card-border rounded-lg z-50 max-h-[200px] overflow-y-auto shadow-2xl"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      {locationSuggestions.map((loc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 text-white/80 text-xs flex items-center gap-2 cursor-pointer transition-colors"
                          onClick={() => handleSelectLocation(loc)}
                        >
                          <MapPin size={13} className="text-primary shrink-0" />
                          <span className="truncate">{loc.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Timezone offset and Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1.5">
                    <Globe size={13} className="shrink-0" /> UTC Timezone Offset
                  </label>
                  <select
                    value={birthTimezone}
                    onChange={(e) => setBirthTimezone(e.target.value)}
                    className="w-full p-3 text-sm rounded-lg bg-secondary/80 border border-card-border text-white outline-none focus:border-primary/50 transition-colors"
                  >
                    <option value="-12:00">UTC-12:00</option>
                    <option value="-11:00">UTC-11:00</option>
                    <option value="-10:00">UTC-10:00</option>
                    <option value="-09:00">UTC-09:00</option>
                    <option value="-08:00">UTC-08:00 (PST)</option>
                    <option value="-07:00">UTC-07:00 (MST)</option>
                    <option value="-06:00">UTC-06:00 (CST)</option>
                    <option value="-05:00">UTC-05:00 (EST)</option>
                    <option value="-04:00">UTC-04:00 (AST)</option>
                    <option value="-03:00">UTC-03:00</option>
                    <option value="-02:00">UTC-02:00</option>
                    <option value="-01:00">UTC-01:00</option>
                    <option value="+00:00">UTC+00:00 (GMT)</option>
                    <option value="+01:00">UTC+01:00 (CET)</option>
                    <option value="+02:00">UTC+02:00 (EET)</option>
                    <option value="+03:00">UTC+03:00</option>
                    <option value="+04:00">UTC+04:00 (GST)</option>
                    <option value="+04:30">UTC+04:30</option>
                    <option value="+05:00">UTC+05:00</option>
                    <option value="+05:30">UTC+05:30 (IST)</option>
                    <option value="+05:45">UTC+05:45 (NPT)</option>
                    <option value="+06:00">UTC+06:00</option>
                    <option value="+07:00">UTC+07:00</option>
                    <option value="+08:00">UTC+08:00 (SGT)</option>
                    <option value="+09:00">UTC+09:00 (JST)</option>
                    <option value="+09:30">UTC+09:30</option>
                    <option value="+10:00">UTC+10:00 (AEST)</option>
                    <option value="+11:00">UTC+11:00</option>
                    <option value="+12:00">UTC+12:00 (NZST)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] uppercase tracking-wider font-extrabold text-white/50 flex items-center gap-1.5">
                    <Compass size={13} className="shrink-0" /> Coordinates
                  </label>
                  <div
                    className="w-full p-3 text-xs rounded-lg flex items-center justify-between bg-secondary/40 border border-white/5 cursor-default"
                  >
                    {latitude !== null && longitude !== null ? (
                      <span className="text-[#cebdff] text-xs">
                        Lat: {latitude.toFixed(2)} | Lon: {longitude.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-white/40 text-xs">None</span>
                    )}
                    <Globe size={13} className="text-white/40 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Submit Details button */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer bg-gradient-to-r from-primary to-[#4f46e5] text-white shadow-[0_0_20px_rgba(109,93,251,0.2)] hover:shadow-[0_0_30px_rgba(109,93,251,0.4)] mt-2 transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed"
                disabled={isSubmittingDetails}
              >
                {isSubmittingDetails ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 size={16} className="animate-spin" />
                    SYNCHRONIZING CELESTIAL ALIGNMENTS...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <Sparkles size={16} />
                    {dbUser?.hasBirthDetails ? 'SAVE COSMIC CHANGES' : 'UNLOCK COSMIC CHAT'}
                  </span>
                )}
              </button>
            </form>
          </motion.div>
        </main>
      </div>
    );
  }

  // 3. Main Chat Interface
  const mockPlacements = getMockPlacements(dbUser?.birthDate);

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col lg:flex-row selection:bg-primary/30 selection:text-white">
      <Sidebar />

      <main className="flex-1 pt-24 lg:pt-8 pb-16 px-4 md:px-12 lg:pl-[300px] flex flex-col items-center h-screen relative z-10 w-full">
        {/* Glow Background Orbs */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" style={{ top: '15%', left: '10%' }}></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#9d4edd]/5 blur-3xl pointer-events-none" style={{ bottom: '15%', right: '10%' }}></div>

        <div className="flex flex-col h-full w-full max-w-[1000px] mx-auto min-h-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4 mb-6 shrink-0">
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-primary mb-1">Live chat</p>
              <h1 className="text-2xl font-extrabold text-white">Talk to Astro AI</h1>
              <p className="text-xs text-white/50 leading-relaxed">
                A focused text console for quick questions, follow-ups, and deeper readings.
              </p>
            </div>
            <div className="flex gap-2 text-[10px] uppercase tracking-wider font-extrabold text-white/50">
              <span className="px-2.5 py-1 bg-secondary/60 border border-white/5 rounded-full">Text console</span>
              <span className="px-2.5 py-1 bg-secondary/60 border border-white/5 rounded-full">{messages.length} messages</span>
            </div>
          </div>

          <section className="flex-grow bg-secondary/40 backdrop-blur-lg border border-card-border rounded-2xl shadow-xl flex flex-col min-h-0 overflow-hidden relative">
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 min-h-0">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
                  <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center mb-2">
                    <Sparkles size={28} />
                  </div>
                  <h2 className="text-lg font-bold text-white">Ask one clear question.</h2>
                  <p className="text-sm text-white/50 max-w-sm">Start with your career, love life, timing, or a general reading.</p>

                  <div className="flex flex-wrap gap-2.5 justify-center mt-4">
                    {SUGGESTIONS.map((s) => (
                      <button
                        type="button"
                        key={s.title}
                        className="px-4 py-2 bg-[#18181b]/50 border border-card-border hover:border-primary/50 hover:bg-primary/10 rounded-full text-xs text-white/70 hover:text-white transition-all cursor-pointer"
                        onClick={() => submitMessage(s.prompt)}
                      >
                        <span>{s.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => {
                if (m.role === 'assistant' && m.content.length === 0) return null;

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-4 max-w-[85%] items-end ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary border border-primary/20">
                        <img src="/logo.png" alt="Astro.AI" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className={`p-4 rounded-2xl relative text-sm leading-relaxed group pr-8 ${m.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-[#18181b]/60 border border-card-border text-white/90 rounded-bl-none'}`}>
                      <MarkdownText text={m.content} />
                      {m.role === 'assistant' && <CopyButton text={m.content} />}
                    </div>

                    {m.role === 'user' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-secondary border border-card-border overflow-hidden">
                        {user?.imageUrl ? <img src={user.imageUrl} alt="You" className="w-full h-full object-cover" /> : <User size={16} className="text-white/40" />}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {showTypingIndicator && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 max-w-[85%] items-end self-start"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary border border-primary/20">
                    <Sparkles size={16} />
                  </div>
                  <div className="p-4 bg-[#18181b]/60 border border-card-border text-white/90 rounded-2xl rounded-bl-none flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                    </div>
                    <div className="text-xs text-white/50 font-medium">Consulting the stars...</div>
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl mb-4">
                  <strong>Error:</strong> {error || 'Something went wrong. Please check your API keys.'}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-card-border bg-[#0c0d12]/40 shrink-0">
              <form onSubmit={onFormSubmit} className="flex items-center gap-3 w-full bg-secondary/80 border border-card-border rounded-xl px-4 py-3 focus-within:border-primary/50 transition-all" id="chat-composer">
                <input
                  ref={inputRef}
                  className="flex-grow bg-transparent text-white placeholder-white/30 outline-none text-sm"
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  placeholder="Message Astro AI"
                />
                <button
                  type="submit"
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer shrink-0 ${localInput.trim() ? 'bg-primary text-white' : ''}`}
                  disabled={isLoading || !localInput.trim()}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

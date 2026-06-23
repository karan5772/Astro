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
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import '../astraeus.css';

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
  const [ayanamsa, setAyanamsa] = useState('RAMAN');

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
            ayanamsa,
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
      <div className="theme-astraeus min-h-screen flex items-center justify-center">
        <div className="constellation-spinner"></div>
      </div>
    );
  }

  // 2. Render onboarding details collection form if not configured
  if (showOnboardingForm) {
    return (
      <div className="theme-astraeus sidebar-layout min-h-screen flex flex-col">
        <Sidebar />
        
        <main className="page-main flex-1 flex items-center justify-center px-4 relative z-10">
          <div className="glow-orb glow-orb-1"></div>
          <div className="glow-orb glow-orb-2"></div>

          <motion.div 
            className="glass-panel p-8 w-full max-w-lg relative shared-surface"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {dbUser?.hasBirthDetails && (
              <button
                type="button"
                onClick={() => setShowOnboardingForm(false)}
                className="absolute top-4 right-4 text-muted hover:text-white transition-colors animate-pulse-slow"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}
            
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div className="feature-icon-wrapper mx-auto mb-4" style={{ width: '4.5rem', height: '4.5rem', borderRadius: '8px' }}>
                {dbUser?.hasBirthDetails ? (
                  <Sparkles size={32} className="text-primary" />
                ) : (
                  <Lock size={32} className="text-primary" />
                )}
              </div>
              <h1 className="page-title" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>
                {dbUser?.hasBirthDetails ? 'Update Cosmic Identity' : 'Unlock Cosmic Identity'}
              </h1>
              <p className="page-lead" style={{ fontSize: '13px', lineHeight: 1.6, marginTop: 0 }}>
                {dbUser?.hasBirthDetails 
                  ? 'Modify your birth parameters to recalculate your planetary placements and predictions.' 
                  : 'Before starting your chat reading, please enter your exact birth metadata. Our Vedic systems will map your placements to provide accurate horoscope predictions.'}
              </p>
            </div>

            <form onSubmit={handleSaveDetails} className="chart-form-panel">
              {/* Date & Time */}
              <div className="chart-input-row">
                <div className="chart-input-group">
                  <label className="chart-input-label">
                    <Calendar size={13} className="inline mr-1" /> Date of Birth
                  </label>
                  <input 
                    type="date" 
                    value={birthDate} 
                    onChange={(e) => setBirthDate(e.target.value)} 
                    className="chart-input-field" 
                    required 
                  />
                </div>

                <div className="chart-input-group">
                  <label className="chart-input-label">
                    <Clock size={13} className="inline mr-1" /> Time of Birth
                  </label>
                  <input 
                    type="time" 
                    value={birthTime} 
                    onChange={(e) => setBirthTime(e.target.value)} 
                    className="chart-input-field" 
                    required 
                  />
                </div>
              </div>

              {/* Location Autocomplete */}
              <div className="chart-input-group" ref={searchContainerRef}>
                <label className="chart-input-label">
                  <MapPin size={13} className="inline mr-1" /> Birth Place
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search city..."
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    className="chart-input-field"
                    style={{ paddingRight: '2.5rem' }}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-muted">
                    {isSearchingLocation ? (
                      <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin"></div>
                    ) : (
                      <Search size={15} />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {locationSuggestions.length > 0 && (
                    <motion.div 
                      className="autocomplete-dropdown"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      {locationSuggestions.map((loc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="autocomplete-item"
                          onClick={() => handleSelectLocation(loc)}
                        >
                          <MapPin size={13} className="text-primary shrink-0" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Timezone offset and Coordinates */}
              <div className="chart-input-row">
                <div className="chart-input-group">
                  <label className="chart-input-label">
                    <Globe size={13} className="inline mr-1" /> UTC Timezone Offset
                  </label>
                  <select 
                    value={birthTimezone} 
                    onChange={(e) => setBirthTimezone(e.target.value)} 
                    className="chart-input-field"
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

                <div className="chart-input-group">
                  <label className="chart-input-label">
                    <Compass size={13} className="inline mr-1" /> Coordinates
                  </label>
                  <div 
                    className="chart-input-field flex items-center justify-between" 
                    style={{ background: 'rgba(255,255,255,0.02)', cursor: 'default' }}
                  >
                    {latitude !== null && longitude !== null ? (
                      <span className="text-[#cebdff]" style={{ fontSize: '12px' }}>
                        Lat: {latitude.toFixed(2)} | Lon: {longitude.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '12px' }}>None</span>
                    )}
                    <Globe size={13} className="text-muted" />
                  </div>
                </div>
              </div>

              {/* Ayanamsa choice */}
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
                </select>
              </div>

              {/* Submit Details button */}
              <button 
                type="submit" 
                className="glow-button-primary cursor-pointer mt-2"
                style={{ width: '100%', padding: '0.875rem' }}
                disabled={isSubmittingDetails}
              >
                {isSubmittingDetails ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></span>
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
    <div className="theme-astraeus sidebar-layout min-h-screen">
      <Sidebar />

      <main className="page-main chat-shell fade-in relative z-10">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>

        <div className="chat-shell-inner">
          <div className="chat-shell-header">
            <div>
              <p className="section-kicker">Live chat</p>
              <h1 className="chat-page-title">Talk to Astro AI</h1>
              <p className="chat-page-copy">
                A focused text console for quick questions, follow-ups, and deeper readings.
              </p>
            </div>
            <div className="chat-shell-pills">
              <span>Text console</span>
              <span>{messages.length} messages</span>
            </div>
          </div>

          <section className="chat-stage glass-panel shared-surface">
            <div className="messages chat-messages">
              {messages.length === 0 && (
                <div className="chat-empty-state">
                  <div className="feature-icon-wrapper mx-auto mb-6">
                    <Sparkles size={28} />
                  </div>
                  <h2>Ask one clear question.</h2>
                  <p>Start with your career, love life, timing, or a general reading.</p>

                  <div className="chat-suggestion-strip">
                    {SUGGESTIONS.map((s) => (
                      <button
                        type="button"
                        key={s.title}
                        className="chat-suggestion-chip"
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
                    className={`message-wrapper ${m.role === 'user' ? 'user' : 'ai'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="message-avatar ai">
                        <Sparkles size={16} />
                      </div>
                    )}

                    <div className="message-bubble">
                      <MarkdownText text={m.content} />
                      {m.role === 'assistant' && <CopyButton text={m.content} />}
                    </div>

                    {m.role === 'user' && (
                      <div className="message-avatar user">
                        {user?.imageUrl ? <img src={user.imageUrl} alt="You" /> : <User size={16} />}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {showTypingIndicator && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="message-wrapper ai"
                >
                  <div className="message-avatar ai">
                    <Sparkles size={16} />
                  </div>
                  <div className="message-bubble typing-bubble">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div className="typing-text">Consulting the stars...</div>
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="chat-error-banner">
                  <strong>Error:</strong> {error || 'Something went wrong. Please check your API keys.'}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="chat-composer-shell">
              <form onSubmit={onFormSubmit} className="chat-input-wrapper" id="chat-composer">
                <input
                  ref={inputRef}
                  className="chat-input"
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  placeholder="Message Astro AI"
                  style={{ paddingLeft: '0.75rem' }}
                />
                <button
                  type="submit"
                  className={`chat-send-btn ${localInput.trim() ? 'active' : ''}`}
                  disabled={isLoading || !localInput.trim()}
                >
                  <Send size={18} style={{ marginLeft: localInput.trim() ? '-2px' : '0px' }} />
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

"use client";

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
  Loader2,
  Paperclip,
  Sun,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import QuestionCard from '@/components/QuestionCard';
import { chatStorage, type ConversationMeta, type StoredMessage } from '@/lib/chat-storage';

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

function MarkdownText({ text, isUser }: { text: string; isUser?: boolean }) {
  if (!text) return null;

  const lines = text.split('\n');
  const textSizeClass = isUser ? 'text-sm' : 'text-sm md:text-base';

  return (
    <div className="markdown-content">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={index} className={`font-semibold text-accent mt-3 mb-1 ${isUser ? 'text-sm' : 'text-sm md:text-base'}`}>
              {renderInline(trimmed.slice(4))}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={index} className={`font-bold text-accent mt-4 mb-1.5 ${isUser ? 'text-base' : 'text-base md:text-lg'}`}>
              {renderInline(trimmed.slice(3))}
            </h3>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={index} className={`font-bold text-accent mt-5 mb-2 ${isUser ? 'text-lg' : 'text-lg md:text-xl'}`}>
              {renderInline(trimmed.slice(2))}
            </h2>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={index} className={`flex items-start gap-2 my-1 pl-2 ${textSizeClass}`}>
              <span className="text-primary mt-1.5 flex-shrink-0" style={{ fontSize: '0.65rem' }}>◆</span>
              <span className="leading-relaxed">{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        if (trimmed === '') {
          return <div key={index} className="h-2" />;
        }

        return (
          <p key={index} className={`my-1.5 leading-relaxed ${textSizeClass}`}>
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

type ContentPart =
  | { type: 'text'; content: string }
  | { type: 'question'; question: string; options: string[] };

function tryParseQuestion(raw: string): { question: string; options: string[] } | null {
  // Step 1 — strict JSON parse
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    // Step 2 — salvage common LLM formatting mistakes
    const cleaned = raw
      .trim()
      .replace(/,(\s*[}\]])/g, '$1')         // trailing commas
      .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":') // unquoted keys
      .replace(/'/g, '"');                    // single → double quotes
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  // Schema validation
  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    'question' in parsed &&
    'options' in parsed &&
    typeof (parsed as any).question === 'string' &&
    (parsed as any).question.trim().length > 0 &&
    Array.isArray((parsed as any).options) &&
    (parsed as any).options.length >= 2 &&
    (parsed as any).options.length <= 6 &&
    (parsed as any).options.every((o: unknown) => typeof o === 'string' && o.trim().length > 0)
  ) {
    return {
      question: ((parsed as any).question as string).trim(),
      options: ((parsed as any).options as string[]).map((o) => o.trim()),
    };
  }
  return null;
}

function parseMessageContent(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const regex = /<q>([\s\S]*?)<\/q>/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }

    const question = tryParseQuestion(match[1]);
    if (question) {
      parts.push({ type: 'question', ...question });
    } else {
      // Parsing/validation failed — emit as plain text so nothing is hidden
      parts.push({ type: 'text', content: match[0] });
    }

    lastIndex = regex.lastIndex;
  }

  // Strip any incomplete in-progress <q> block (still streaming)
  const remaining = content.slice(lastIndex);
  const incompleteStart = remaining.indexOf('<q>');
  const textToAdd = incompleteStart !== -1 ? remaining.slice(0, incompleteStart) : remaining;
  if (textToAdd) parts.push({ type: 'text', content: textToAdd });

  return parts;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
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

  const [localInput, setLocalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Question flow state
  const [questionQueue, setQuestionQueue] = useState<{ question: string; options: string[] }[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<{ question: string; answer: string | null }[]>([]);
  const [isInQuestionMode, setIsInQuestionMode] = useState(false);

  // Conversation (channel) state
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Limit minimum height to 24px and dynamically expand based on scrollHeight
      textareaRef.current.style.height = `${Math.max(24, textareaRef.current.scrollHeight)}px`;
    }
  }, [localInput]);

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

  // ── Conversation helpers ──────────────────────────────────────────────────

  const switchConversation = async (id: string | null) => {
    if (!id) { handleNewConversation(); return; }
    const msgs = await chatStorage.getMessages(id);
    setMessages(msgs.map((m, i) => ({ ...m, id: `loaded-${i}` })));
    setActiveConvId(id);
    setIsInQuestionMode(false);
    setQuestionQueue([]);
    window.dispatchEvent(new CustomEvent('chat:active-changed', { detail: { id } }));
  };

  const handleNewConversation = () => {
    setMessages([]);
    setActiveConvId(null);
    setIsInQuestionMode(false);
    setQuestionQueue([]);
    setLocalInput('');
    window.dispatchEvent(new CustomEvent('chat:active-changed', { detail: { id: null } }));
  };

  // Load most recent conversation on mount (after user/onboarding check)
  useEffect(() => {
    if (!checkingDetails && !showOnboardingForm) {
      chatStorage.listConversations().then(list => {
        setConversations(list);
        if (list.length > 0) switchConversation(list[0].id);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingDetails, showOnboardingForm]);

  // Listen for sidebar new/switch events
  useEffect(() => {
    const onNew = () => handleNewConversation();
    const onSwitch = (e: Event) => switchConversation((e as CustomEvent).detail?.id ?? null);
    window.addEventListener('sidebar:new', onNew);
    window.addEventListener('sidebar:switch', onSwitch);
    return () => {
      window.removeEventListener('sidebar:new', onNew);
      window.removeEventListener('sidebar:switch', onSwitch);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  const formatAnswers = (answers: { question: string; answer: string | null }[]) => {
    const lines = answers
      .filter((a) => a.answer !== null)
      .map((a) => `• ${a.question}\n  → ${a.answer}`)
      .join('\n\n');
    return lines ? `My answers:\n\n${lines}` : '';
  };

  const handleAnswer = (answer: string | null) => {
    const current = questionQueue[questionIndex];
    const updated = [...questionAnswers, { question: current.question, answer }];

    if (questionIndex < questionQueue.length - 1) {
      setQuestionAnswers(updated);
      setQuestionIndex(questionIndex + 1);
    } else {
      setIsInQuestionMode(false);
      setQuestionQueue([]);
      setQuestionIndex(0);
      setQuestionAnswers([]);
      const combined = formatAnswers(updated);
      if (combined) submitMessage(combined);
    }
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

    // Auto-create conversation on first message
    let convId = activeConvIdRef.current;
    if (!convId) {
      const title = messageText.slice(0, 45) + (messageText.length > 45 ? '…' : '');
      const meta = await chatStorage.createConversation(title);
      convId = meta.id;
      setActiveConvId(meta.id);
      setConversations(prev => [meta, ...prev]);
      window.dispatchEvent(new CustomEvent('chat:list-changed', { detail: { activeId: meta.id } }));
      window.dispatchEvent(new CustomEvent('chat:active-changed', { detail: { id: meta.id } }));
    }

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
      let aiContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          aiContent += chunk;

          setMessages((prev) =>
            prev.map(m => m.id === aiMessageId ? { ...m, content: m.content + chunk } : m)
          );
        }
      }

      // Persist messages to storage
      if (convId) {
        const finalMessages: StoredMessage[] = [
          ...newMessages.map(({ role, content }) => ({ role, content } as StoredMessage)),
          { role: 'assistant', content: aiContent },
        ];
        chatStorage.saveMessages(convId, finalMessages).then(() => {
          setConversations(prev =>
            prev
              .map(c => c.id === convId ? { ...c, updatedAt: new Date().toISOString() } : c)
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          );
          window.dispatchEvent(new CustomEvent('chat:list-changed', { detail: { activeId: convId } }));
        });
      }

      // After stream ends, extract any questions and enter question mode
      const detectedQuestions = parseMessageContent(aiContent)
        .filter((p) => p.type === 'question') as { type: 'question'; question: string; options: string[] }[];
      if (detectedQuestions.length > 0) {
        setQuestionQueue(detectedQuestions);
        setQuestionIndex(0);
        setQuestionAnswers([]);
        setIsInQuestionMode(true);
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
    <div className="min-h-screen bg-white dark:bg-[#0c0d12] text-gray-900 dark:text-white flex flex-col lg:flex-row selection:bg-primary/30 selection:text-white relative overflow-hidden">
      <Sidebar />

      {/* Main Chat Workspace */}
      <main className={`flex-1 flex flex-col h-screen min-w-0 relative z-10 w-full bg-transparent overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'}`}>
        {/* Subtle Linear Grid Pattern Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e2230_0.5px,transparent_0.5px),linear-gradient(to_bottom,#1e2230_0.5px,transparent_0.5px)] bg-[size:24px_24px] pointer-events-none opacity-40 z-0" />



        {/* Message Panel Scroll Area - Full width scrollable container so you can scroll anywhere on the page */}
        <div className="flex-1 overflow-y-auto w-full z-10 min-h-0 flex flex-col">
          <div className="px-4 md:px-8 py-6 flex flex-col gap-6 w-full max-w-4xl mx-auto flex-grow">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4 my-auto">
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center mb-2">
                  <img src="logo.png" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ask Astraeus anything.</h2>
                <p className="text-sm text-gray-500 dark:text-white/50 max-w-sm">Start with your career, love life, timing, or a general reading.</p>

                <div className="flex flex-wrap gap-2.5 justify-center mt-4">
                  {SUGGESTIONS.map((s) => (
                    <button
                      type="button"
                      key={s.title}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-[#18181b]/50 border border-gray-200 dark:border-card-border hover:border-primary/50 hover:dark:bg-primary/10 rounded-full text-xs text-gray-600 dark:text-white/70 hover:text-gray-900 hover:dark:text-white transition-all cursor-pointer"
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

              const textParts = parseMessageContent(m.content).filter((p) => p.type === 'text');

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={m.role === 'user' ? 'flex items-start gap-3.5 self-end max-w-[80%]' : 'flex items-start gap-3.5 self-start max-w-[85%]'}
                >
                  {m.role === 'user' ? (
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-950 dark:bg-white text-white dark:text-black px-4.5 py-2.5 rounded-2xl text-sm font-medium shadow-sm leading-relaxed">
                        <MarkdownText text={m.content} isUser />
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                        {user?.imageUrl ? <img src={user.imageUrl} alt="You" className="w-full h-full object-cover" /> : <User size={16} className="text-gray-400" />}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                        <img src="/logo.png" alt="Astro" className="object-contain" />
                      </div>
                      <div className="bg-[#f4f4f5] dark:bg-[#18181b]/60 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white/95 px-5 py-3.5 rounded-2xl text-sm leading-relaxed max-w-xl shadow-sm">
                        {textParts.map((part, pi) => (
                          <MarkdownText key={pi} text={part.content} />
                        ))}
                        <div className="mt-2.5 flex justify-end">
                          <CopyButton text={m.content} />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}

            {showTypingIndicator && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3.5 max-w-[85%] self-start"
              >
                <div className="w-8 h-8 rounded bg-gray-50 dark:bg-[#18181b] border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                  <img src="/logo.png" alt="Astro" className="w-5 h-5 object-contain" />
                </div>
                <div className="p-4 bg-[#f4f4f5] dark:bg-[#18181b]/60 border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white/90 rounded-2xl flex items-center gap-3 shadow-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white/50 font-medium">Consulting the stars...</div>
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
        </div>

        {/* Composer / Question area */}
        <div className="p-4 bg-transparent shrink-0 w-full flex justify-center z-10">
          <AnimatePresence mode="wait">
            {isInQuestionMode ? (
              <motion.div
                key="question-mode"
                className="w-full max-w-2xl"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <QuestionCard
                  question={questionQueue[questionIndex]?.question ?? ''}
                  options={questionQueue[questionIndex]?.options ?? []}
                  currentIndex={questionIndex}
                  total={questionQueue.length}
                  onSelect={(opt) => handleAnswer(opt)}
                  onSkip={() => handleAnswer(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="input-mode"
                className="w-full max-w-2xl bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-full px-5 py-2 flex items-end gap-3 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] focus-within:border-gray-300 dark:focus-within:border-white/20 transition-all"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  placeholder="Ask Astraeus..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        if (localInput.trim() && !isLoading) {
                          const text = localInput;
                          setLocalInput('');
                          submitMessage(text);
                        }
                      }
                    }
                  }}
                  className="flex-grow bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none border-none resize-none py-1.5 min-h-[24px] max-h-[140px] leading-relaxed align-bottom"
                />
                <button
                  onClick={() => {
                    if (localInput.trim() && !isLoading) {
                      const text = localInput;
                      setLocalInput('');
                      submitMessage(text);
                    }
                  }}
                  disabled={isLoading || !localInput.trim()}
                  className={`px-4.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 mb-0.5 ${
                    localInput.trim() && !isLoading
                      ? 'bg-gray-950 dark:bg-white text-white dark:text-black hover:opacity-90 cursor-pointer shadow-sm'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/20 cursor-not-allowed'
                  }`}
                >
                  Send
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

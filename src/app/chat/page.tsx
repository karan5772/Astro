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
  Info,
  X,
  Loader2,
  Paperclip,
  Sun,
} from 'lucide-react';
import OnboardingFlow from '@/components/OnboardingFlow';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import QuestionCard from '@/components/QuestionCard';
import { chatStorage, type ConversationMeta, type StoredMessage } from '@/lib/chat-storage';

type Message = { id: string; role: 'user' | 'assistant'; content: string };


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
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);


  useEffect(() => {
    document.body.classList.add('astraeus-active');

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

    return () => { document.body.classList.remove('astraeus-active'); };
  }, []);

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
        // If the sidebar navigated here with a specific conversation, open it
        const pending = localStorage.getItem('sidebar:pending-conv');
        if (pending) {
          localStorage.removeItem('sidebar:pending-conv');
          switchConversation(pending);
        } else if (list.length > 0) {
          switchConversation(list[0].id);
        }
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
        setShowTrialModal(true);
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

  // 2. Onboarding flow — multi-step birth details entry
  if (showOnboardingForm) {
    return (
      <OnboardingFlow
        onComplete={(data) => {
          setDbUser(data);
          setShowOnboardingForm(false);
        }}
      />
    );
  }

  // 3. Main Chat Interface

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0d12] text-gray-900 dark:text-white flex flex-col lg:flex-row selection:bg-primary/30 selection:text-white relative overflow-hidden">

      {/* Trial limit modal */}
      {showTrialModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative bg-[#13141a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-8 flex flex-col items-center gap-5 text-center">
            {/* Glow ring */}
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-1">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L19.09 12.26L28 13.27L21.5 19.64L23.18 28L16 24L8.82 28L10.5 19.64L4 13.27L12.91 12.26L16 4Z" fill="currentColor" className="text-primary" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight">You've used all 15 free messages</h2>
            <p className="text-sm text-white/55 leading-relaxed">
              Upgrade to continue your cosmic journey — unlimited messages, voice sessions, and deeper astrological insights.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="w-full py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              View upgrade plans
            </button>
            <button
              onClick={() => setShowTrialModal(false)}
              className="text-xs text-white/35 hover:text-white/60 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

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

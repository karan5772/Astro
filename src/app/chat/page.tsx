"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Copy, Check, Briefcase, Heart, Compass, Moon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';

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
    case 'Briefcase': return <Briefcase className="text-purple-400" size={20} />;
    case 'Heart': return <Heart className="text-red-400" size={20} />;
    case 'Compass': return <Compass className="text-yellow-400" size={20} />;
    case 'Moon': return <Moon className="text-blue-400" size={20} />;
    default: return <Sparkles className="text-purple-400" size={20} />;
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
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
}

function MarkdownText({ text }: { text: string }) {
  if (!text) return null;

  // Split by newlines to parse block-level structures
  const lines = text.split('\n');
  
  return (
    <div className="markdown-content">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        
        // Headers
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
        
        // Bullet list items
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={index} className="flex items-start gap-2 my-1 pl-2 text-sm md:text-base">
              <span className="text-primary mt-1.5 flex-shrink-0" style={{ fontSize: '0.65rem' }}>◆</span>
              <span className="leading-relaxed">{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Empty line spacer
        if (trimmed === '') {
          return <div key={index} className="h-2" />;
        }

        // Paragraph line
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
  // Regex to split on bold **word** or italic *word*
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

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [localInput, setLocalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Only show the typing dots loader if fetch is working and the assistant message is not yet populated
  const showTypingIndicator = isLoading && (
    messages.length === 0 || 
    (messages[messages.length - 1].role === 'assistant' 
      ? messages[messages.length - 1].content.length === 0 
      : true)
  );

  return (
    <>
      <Navbar variant="chat" />

      <main className="chat-container fade-in relative z-10">
        <div className="glow-orb glow-orb-1" style={{ top: '20%', left: '10%' }}></div>
        <div className="glow-orb glow-orb-2" style={{ bottom: '20%', right: '10%' }}></div>

        <div className="messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', padding: '2rem' }}>
              <div className="feature-icon-wrapper mx-auto mb-6">
                <Sparkles size={32} />
              </div>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Ask the Cosmos</h2>
              <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
                Select a query below or type your own question to talk to your AI Astrologer.
              </p>
              
              <div className="suggestion-grid">
                {SUGGESTIONS.map((s, idx) => (
                  <button 
                    type="button"
                    key={idx} 
                    className="suggestion-card"
                    onClick={() => {
                      submitMessage(s.prompt);
                    }}
                  >
                    <div className="suggestion-card-icon">
                      {getSuggestionIcon(s.icon)}
                    </div>
                    <div className="suggestion-card-title">{s.title}</div>
                    <div className="suggestion-card-desc">{s.description}</div>
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <Link href="/pricing" className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                  Upgrade to Voice Reading
                </Link>
              </div>
            </div>
          )}

          {messages.map(m => {
            // Hide the AI message block when content is empty and the typing indicator is doing the visual job
            if (m.role === 'assistant' && m.content.length === 0) return null;
            
            return (
              <motion.div 
                key={m.id} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`message-wrapper ${m.role === 'user' ? 'user' : 'ai'}`}
              >
                {m.role === 'assistant' && (
                  <div className="message-avatar ai">
                    <Sparkles size={16} />
                  </div>
                )}
                
                <div className="message-bubble">
                  <div className="message-sender-name">
                    {m.role === 'user' ? 'You' : 'Astro AI'}
                  </div>
                  
                  <MarkdownText text={m.content} />

                  {m.role === 'assistant' && (
                    <CopyButton text={m.content} />
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="message-avatar user">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt="You" />
                    ) : (
                      <User size={16} />
                    )}
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
            <div className="message" style={{ backgroundColor: 'rgba(255, 71, 87, 0.1)', border: '1px solid #ff4757', color: '#ff4757', alignSelf: 'center', borderRadius: '1.25rem', padding: '1rem 1.5rem', maxWidth: '80%' }}>
              <strong>Error:</strong> {error || 'Something went wrong. Please check your API keys.'}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ paddingBottom: '1.5rem', paddingTop: '1rem' }}>
          <form onSubmit={onFormSubmit} className="chat-input-wrapper">
            <input
              ref={inputRef}
              className="chat-input"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="Ask about your future, career, or love life..."
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
      </main>
    </>
  );
}

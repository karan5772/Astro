"use client";

import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import Link from 'next/link';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [localInput, setLocalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!localInput || !localInput.trim() || isLoading) return;
    
    const userMessage = localInput;
    setLocalInput(''); // Clear immediately
    setIsLoading(true);
    setError(null);

    const newMessages: Message[] = [...messages, { id: Date.now().toString(), role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const aiMessageId = (Date.now() + 1).toString();
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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <nav className="navbar scrolled">
        <div className="nav-container">
          <Link href="/dashboard" className="nav-brand text-muted" style={{ fontSize: '1rem', fontWeight: '500' }}>
            &larr; Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            <span className="font-semibold">Text Reading</span>
          </div>
        </div>
      </nav>

      <main className="chat-container fade-in relative z-10" style={{ paddingTop: '80px', height: '100vh', marginTop: 0 }}>
        <div className="glow-orb glow-orb-1" style={{ top: '20%', left: '10%' }}></div>
        <div className="glow-orb glow-orb-2" style={{ bottom: '20%', right: '10%' }}></div>

        <div className="messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', padding: '2rem' }}>
              <div className="feature-icon-wrapper mx-auto mb-6">
                <Sparkles size={32} />
              </div>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Ask the Cosmos</h2>
              <p className="text-muted" style={{ fontSize: '1.1rem' }}>Type your question to talk to your AI Astrologer.</p>
              <div className="mt-8">
                <Link href="/pricing" className="btn btn-outline" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                  Upgrade to Voice Reading
                </Link>
              </div>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`message ${m.role === 'user' ? 'user' : 'ai'}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ opacity: 0.8, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {m.role === 'user' ? 'You' : 'Astro AI'}
                  </strong>
                  <div style={{ marginTop: '0.5rem' }}>{m.content}</div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message ai">
              <em className="text-muted flex items-center gap-2">
                <Sparkles size={16} className="text-primary" /> Consulting the stars...
              </em>
            </div>
          )}
          {error && (
            <div className="message" style={{ backgroundColor: 'rgba(255, 71, 87, 0.1)', border: '1px solid #ff4757', color: '#ff4757', alignSelf: 'center' }}>
              <strong>Error:</strong> {error || 'Something went wrong. Please check your API keys.'}
            </div>
          )}
        </div>

        <div style={{ paddingBottom: '1.5rem', paddingTop: '1rem' }}>
          <form onSubmit={onFormSubmit} className="chat-input-wrapper glass-card" style={{ padding: '0.75rem', borderRadius: '9999px', display: 'flex' }}>
            <input
              className="chat-input"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="Ask about your future, career, or love life..."
              style={{ paddingLeft: '1rem' }}
            />
            <button type="submit" className="icon-btn" disabled={isLoading || !localInput.trim()} style={{ background: localInput.trim() ? 'var(--primary)' : 'transparent', color: localInput.trim() ? 'white' : 'var(--muted)', borderRadius: '50%', width: '40px', height: '40px' }}>
              <Send size={18} style={{ marginLeft: '-2px' }} />
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

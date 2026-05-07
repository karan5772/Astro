"use client";

import Link from 'next/link';
import { UserButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageSquare, Mic, CreditCard, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      // Fetch user from MongoDB which also lazy creates them if missing
      fetch('/api/user')
        .then(res => res.json())
        .then(data => {
          if (data && data.isPro) {
            setIsPro(true);
          }
        })
        .catch(console.error);
    }
  }, [isLoaded, user]);

  const handleVoiceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPro) {
      router.push('/voice');
    } else {
      toast((t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
          <span>Premium Voice Reading is available only on the Premium plan. Would you like to upgrade now?</span>
          <button 
            onClick={() => { toast.dismiss(t.id); router.push('/pricing'); }}
            style={{ padding: '8px 16px', background: '#f39c12', color: '#111', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Upgrade Now
          </button>
        </div>
      ), { duration: 6000, style: { minWidth: '300px' } });
    }
  };

  return (
    <>
      <nav className="navbar scrolled">
        <div className="nav-container">
          <Link href="/" className="nav-brand">
            <Sparkles className="text-primary" size={24} />
            <span>Astro AI</span>
          </Link>
          <div className="nav-actions">
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="container fade-in" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
        <div className="glow-orb glow-orb-1" style={{ top: '10%', left: '10%' }}></div>
        
        <div className="text-center mb-12">
          <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1rem' }}>
            Your <span className="text-gradient font-serif italic">Cosmic Dashboard</span>
          </h1>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>Choose how you'd like to consult the stars today.</p>
        </div>
        
        <div className="features-grid">
          
          {/* Free Text Chat */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card flex flex-col items-center justify-center text-center" 
            style={{ minHeight: '300px' }}
          >
            <div className="feature-icon-wrapper">
              <MessageSquare size={28} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Text Reading</h3>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>Chat with your AI astrologer via text (Free Tier).</p>
            <Link href="/chat" className="btn btn-primary w-full" style={{ width: '100%' }}>
              Enter Text Chat
            </Link>
          </motion.div>

          {/* Premium Voice Chat */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card flex flex-col items-center justify-center text-center relative overflow-hidden" 
            style={{ minHeight: '300px', border: '1px solid rgba(243, 156, 18, 0.3)' }}
          >
            <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-500 text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: 'rgba(243, 156, 18, 0.2)', color: '#f39c12' }}>PRO</div>
            <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(211, 84, 0, 0.1))', color: '#f39c12', borderColor: 'rgba(243, 156, 18, 0.3)' }}>
              <Mic size={28} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Live Voice Reading</h3>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>Talk naturally with Realtime AI. (Premium Plan only)</p>
            <button onClick={handleVoiceClick} className="btn" style={{ width: '100%', background: 'linear-gradient(to right, #f39c12, #d35400)', color: 'white' }}>
              Start Voice Call
            </button>
          </motion.div>

          {/* Billing */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card flex flex-col items-center justify-center text-center" 
            style={{ minHeight: '300px' }}
          >
            <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(161, 161, 170, 0.2), rgba(82, 82, 91, 0.1))', color: '#a1a1aa', borderColor: 'rgba(161, 161, 170, 0.3)' }}>
              <CreditCard size={28} />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Your Plan</h3>
            <p className="text-muted" style={{ marginBottom: '2rem' }}>Manage your subscription and billing details.</p>
            <Link href="/pricing" className="btn btn-outline w-full" style={{ width: '100%' }}>
              Upgrade / Manage
            </Link>
          </motion.div>

        </div>
      </main>
    </>
  );
}

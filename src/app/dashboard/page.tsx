"use client";

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageSquare, Mic, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
      <Navbar variant="dashboard" />

      <main className="container fade-in main-content">
        <div className="glow-orb glow-orb-1" style={{ top: '10%', left: '10%' }}></div>
        
        <div className="text-center mb-16">
          <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '1rem' }}>
            Your <span className="text-gradient font-serif italic" style={{ background: 'linear-gradient(135deg, #f1c40f, #e67e22)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sacred Space</span>
          </h1>
          <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>How would you like to connect with the universe today?</p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-center gap-8 items-center mt-4">
          
          {/* Silent Reflection */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card flex flex-col items-center justify-center text-center hover-lift" 
            style={{ minHeight: '340px', padding: '2.5rem 2rem', width: '100%', maxWidth: '380px' }}
          >
            <div className="feature-icon-wrapper mb-4" style={{ background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.2), rgba(90, 24, 154, 0.1))', color: '#9d4edd', borderColor: 'rgba(157, 78, 221, 0.3)' }}>
              <MessageSquare size={28} />
            </div>
            <h3 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', fontWeight: 600 }}>Silent Reflection</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem', lineHeight: 1.5, fontSize: '0.95rem' }}>Find peace through the written word.</p>
            
            <ul className="text-left text-sm text-muted mb-6 w-full space-y-2 mx-auto" style={{ maxWidth: '260px' }}>
              <li className="flex items-start gap-2"><Sparkles size={14} className="text-primary mt-1 shrink-0"/> 15 Free Messages</li>
              <li className="flex items-start gap-2"><Sparkles size={14} className="text-primary mt-1 shrink-0"/> Text-based guidance</li>
              <li className="flex items-start gap-2"><Sparkles size={14} className="text-primary mt-1 shrink-0"/> Deep emotional insight</li>
            </ul>

            <Link href="/chat" className="btn btn-outline w-full" style={{ width: '100%', marginTop: 'auto' }}>
              Begin Text Session
            </Link>
          </motion.div>

          {/* Premium Voice Chat */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card flex flex-col items-center justify-center text-center relative overflow-hidden hover-lift" 
            style={{ minHeight: '340px', padding: '2.5rem 2rem', border: '1px solid rgba(243, 156, 18, 0.5)', boxShadow: '0 0 40px rgba(243, 156, 18, 0.15)', width: '100%', maxWidth: '380px' }}
          >
            <div className="absolute top-0 right-0 text-white text-xs font-bold px-4 py-1" style={{ background: 'linear-gradient(to right, #f39c12, #d35400)', borderBottomLeftRadius: '1rem', borderTopRightRadius: '1rem', letterSpacing: '1px' }}>PREMIUM</div>
            <div className="feature-icon-wrapper mb-4" style={{ background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(211, 84, 0, 0.1))', color: '#f39c12', borderColor: 'rgba(243, 156, 18, 0.3)' }}>
              <Mic size={28} />
            </div>
            <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: 700 }}>Vocal Connection</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem', lineHeight: 1.5, fontSize: '0.95rem' }}>Speak naturally. Feel heard.</p>
            
            <ul className="text-left text-sm text-muted mb-6 w-full space-y-2 mx-auto" style={{ maxWidth: '260px' }}>
              <li className="flex items-start gap-2"><Sparkles size={14} className="text-primary mt-1 shrink-0"/> Uninterrupted live voice</li>
              <li className="flex items-start gap-2"><Sparkles size={14} className="text-primary mt-1 shrink-0"/> Real-time AI processing</li>
              <li className="flex items-start gap-2"><Sparkles size={14} className="text-primary mt-1 shrink-0"/> Immersive soul journey</li>
            </ul>

            <button onClick={handleVoiceClick} className="btn" style={{ width: '100%', marginTop: 'auto', background: 'linear-gradient(to right, #f39c12, #d35400)', color: 'white', border: 'none', boxShadow: '0 4px 20px rgba(243, 156, 18, 0.4)' }}>
              Start Voice Call
            </button>
            {/* Premium Voice Chat ends */}
          </motion.div>

        </div>
      </main>
      <Footer />
    </>
  );
}

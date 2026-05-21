"use client";

import { useState, useEffect } from 'react';
import { Check, Sparkles, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [proUntil, setProUntil] = useState<Date | null>(null);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data && data.isPro && data.proUntil) {
          setProUntil(new Date(data.proUntil));
        }
      })
      .catch(console.error);
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as Window & { Razorpay?: unknown }).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: string, amount: number, durationInMinutes: number) => {
    setLoading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Razorpay SDK failed to load. Please check your connection.");
        setLoading(false);
        return;
      }

      // 1. Create order on backend
      const res = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, plan })
      });
      const data = await res.json();

      if (!data.orderId) {
        throw new Error('Order creation failed');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
        amount: data.amount,
        currency: data.currency || "INR",
        name: "Astro AI",
        description: `Subscription to ${plan} Plan`,
        order_id: data.orderId,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                amount: amount,
                durationInMinutes: durationInMinutes
              })
            });
            
            if (verifyRes.ok) {
              toast.success("Payment successful! You are now a Cosmic Oracle.");
              window.location.href = "/dashboard";
            } else {
              toast.error("Payment verification failed.");
            }
          } catch (e) {
            console.error(e);
            toast.error("Error verifying payment.");
          }
        },
        theme: {
          color: "#9d4edd"
        }
      };

      const rzp1 = new (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay(options);
      rzp1.open();

    } catch (error) {
      console.error(error);
      toast.error('Failed to initiate payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar variant="pricing" />

      <main className="container fade-in main-content">
        <div className="glow-orb glow-orb-1" style={{ top: '20%', left: '10%' }}></div>
        <div className="glow-orb glow-orb-2" style={{ bottom: '20%', right: '10%' }}></div>

        <div className="text-center mb-16">
          <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '1rem' }}>
            Invest in Your <span className="text-gradient font-serif italic" style={{ background: 'linear-gradient(135deg, #f1c40f, #e67e22)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Healing Journey</span>
          </h1>
          <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Your first 15 text messages are completely free. When you&apos;re ready for deep, uninterrupted voice guidance, choose a cosmic pass below.
          </p>
          {proUntil && proUntil > new Date() && (
            <div className="mt-6 p-4 glass-card" style={{ display: 'inline-block', border: '1px solid #f39c12' }}>
              <p className="text-yellow-500 font-semibold m-0">
                You currently have an active Cosmic Session!
              </p>
              <p className="text-muted text-sm m-0 mt-1">
                Your Pro access expires on: {proUntil.toLocaleString()}
              </p>
              <p className="text-muted text-xs m-0 mt-1 opacity-75">
                Purchasing another pass will add to your remaining time.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row justify-center gap-8 items-center md:items-stretch mt-8">
          {/* 5 Min Plan */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card flex flex-col hover-lift" 
            style={{ width: '100%', maxWidth: '320px' }}
          >
            <div className="flex items-center gap-3 mb-2">
               <Star className="text-muted" size={24} />
              <h3 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 600 }}>Quick Clarity</h3>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '800', margin: '1rem 0' }}>
              $1<span className="text-muted" style={{ fontSize: '1.2rem', fontWeight: '500' }}> / 5 mins</span>
            </div>
            <p className="text-muted mb-6" style={{ minHeight: '48px' }}>Perfect for a quick cosmic check-in.</p>
            
            <ul className="mb-8 flex flex-col gap-3" style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0' }}>
              <li className="flex items-center gap-2 text-sm"><Check size={18} className="text-primary" /> Live Voice Access</li>
              <li className="flex items-center gap-2 text-sm"><Check size={18} className="text-primary" /> Instant Emotional Support</li>
              <li className="flex items-center gap-2 text-sm"><Check size={18} className="text-primary" /> Private & Secure</li>
            </ul>

            <button 
              className="btn btn-outline mt-auto" 
              style={{ width: '100%' }}
              onClick={() => handleSubscribe('5 Min Pass', 1, 5)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Begin Quick Session'}
            </button>
          </motion.div>

          {/* 30 Min Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card flex flex-col relative pricing-card-featured hover-lift" 
            style={{ width: '100%', maxWidth: '340px' }}
          >
            <div className="absolute top-0 right-0 text-white text-xs font-bold px-4 py-1" style={{ background: 'linear-gradient(to right, #f39c12, #d35400)', borderBottomLeftRadius: '1rem', borderTopRightRadius: '1rem', letterSpacing: '1px' }}>
              MOST LOVED
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-primary" size={24} />
              <h3 className="text-gradient" style={{ fontSize: '1.8rem', margin: 0, fontWeight: 700 }}>Deep Healing</h3>
            </div>
            <div style={{ fontSize: '3.5rem', fontWeight: '800', margin: '1rem 0' }}>
              $3<span className="text-muted" style={{ fontSize: '1.2rem', fontWeight: '500' }}> / 30 mins</span>
            </div>
            <p className="text-muted mb-6" style={{ minHeight: '48px' }}>Dive deep into your birth chart and emotional blockages.</p>
            
            <ul className="mb-8 flex flex-col gap-3" style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0' }}>
              <li className="flex items-center gap-2 text-sm font-medium"><Check size={18} className="text-primary" /> Everything in Quick Clarity</li>
              <li className="flex items-center gap-2 text-sm font-medium"><Check size={18} className="text-primary" /> Uncover Hidden Life Patterns</li>
              <li className="flex items-center gap-2 text-sm font-medium"><Check size={18} className="text-primary" /> Persistent Soul Memory</li>
            </ul>
            
            <button 
              className="btn btn-primary mt-auto" 
              style={{ width: '100%', background: 'linear-gradient(to right, #f39c12, #d35400)', border: 'none', color: 'white', boxShadow: '0 4px 20px rgba(243, 156, 18, 0.4)', padding: '1rem' }}
              onClick={() => handleSubscribe('30 Min Pass', 3, 30)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Start Deep Healing'}
            </button>
          </motion.div>

          {/* 60 Min Plan */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card flex flex-col hover-lift" 
            style={{ width: '100%', maxWidth: '320px' }}
          >
            <div className="flex items-center gap-3 mb-2">
               <Sparkles className="text-muted" size={24} />
              <h3 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 600 }}>Cosmic Awakening</h3>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '800', margin: '1rem 0' }}>
              $5<span className="text-muted" style={{ fontSize: '1.2rem', fontWeight: '500' }}> / 60 mins</span>
            </div>
            <p className="text-muted mb-6" style={{ minHeight: '48px' }}>A full hour of uninterrupted spiritual guidance.</p>

            <ul className="mb-8 flex flex-col gap-3" style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0' }}>
              <li className="flex items-center gap-2 text-sm"><Check size={18} className="text-primary" /> Everything in Deep Healing</li>
              <li className="flex items-center gap-2 text-sm"><Check size={18} className="text-primary" /> Complete Future Forecasting</li>
              <li className="flex items-center gap-2 text-sm"><Check size={18} className="text-primary" /> Ultimate Peace of Mind</li>
            </ul>

            <button 
              className="btn btn-outline mt-auto" 
              style={{ width: '100%' }}
              onClick={() => handleSubscribe('60 Min Pass', 5, 60)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Embrace Awakening'}
            </button>
          </motion.div>
          
        </div>
      </main>
      <Footer />
    </>
  );
}

"use client";

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Check, Sparkles, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
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
        handler: async function (response: any) {
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

      // @ts-ignore
      const rzp1 = new window.Razorpay(options);
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
      <nav className="navbar scrolled">
        <div className="nav-container">
          <Link href="/" className="nav-brand">
            <Sparkles className="text-primary" size={24} />
            <span>Astro AI</span>
          </Link>
          <div className="nav-links">
            <Link href="/dashboard">Dashboard</Link>
          </div>
          <div className="nav-actions">
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="container fade-in" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
        <div className="glow-orb glow-orb-1" style={{ top: '20%', left: '10%' }}></div>
        <div className="glow-orb glow-orb-2" style={{ bottom: '20%', right: '10%' }}></div>

        <div className="text-center mb-16">
          <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '1rem' }}>
            Choose Your <span className="text-gradient font-serif italic">Cosmic Journey</span>
          </h1>
          <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Unlock infinite memory and voice agents with a premium plan.
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
        
        <div className="flex flex-col md:flex-row justify-center gap-8 items-center md:items-stretch">
          {/* 10 Min Plan */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card flex flex-col" 
            style={{ width: '100%', maxWidth: '300px' }}
          >
            <div className="flex items-center gap-3 mb-2">
               <Star className="text-muted" size={24} />
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Quick Peek</h3>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '1rem 0' }}>
              $1<span className="text-muted" style={{ fontSize: '1.2rem', fontWeight: '500' }}></span>
            </div>
            <p className="text-muted mb-6">5 minutes of Pro access.</p>
            <button 
              className="btn btn-outline" 
              style={{ width: '100%', marginTop: 'auto' }}
              onClick={() => handleSubscribe('5 Min Pass', 1, 5)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Buy 5 Mins'}
            </button>
          </motion.div>

          {/* 30 Min Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card flex flex-col relative" 
            style={{ width: '100%', maxWidth: '300px', border: '1px solid rgba(157, 78, 221, 0.5)', boxShadow: '0 0 30px rgba(157, 78, 221, 0.15)' }}
          >
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1" style={{ borderBottomLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              POPULAR
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-primary" size={24} />
              <h3 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>Cosmic Session</h3>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '800', margin: '1rem 0' }}>
              $3<span className="text-muted" style={{ fontSize: '1.2rem', fontWeight: '500' }}></span>
            </div>
            <p className="text-muted mb-6">30 minutes of Pro access.</p>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: 'auto' }}
              onClick={() => handleSubscribe('30 Min Pass', 3, 30)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Buy 30 Mins'}
            </button>
          </motion.div>

          {/* 60 Min Plan */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card flex flex-col" 
            style={{ width: '100%', maxWidth: '300px' }}
          >
            <div className="flex items-center gap-3 mb-2">
               <Sparkles className="text-muted" size={24} />
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Deep Dive</h3>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', margin: '1rem 0' }}>
              $5<span className="text-muted" style={{ fontSize: '1.2rem', fontWeight: '500' }}></span>
            </div>
            <p className="text-muted mb-6">60 minutes of Pro access.</p>
            <button 
              className="btn btn-outline" 
              style={{ width: '100%', marginTop: 'auto' }}
              onClick={() => handleSubscribe('60 Min Pass', 5, 60)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Buy 60 Mins'}
            </button>
          </motion.div>
          
        </div>
      </main>
    </>
  );
}

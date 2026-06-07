"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import '../astraeus.css';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  durationInMinutes: number;
  description: string;
  icon: string;
  iconColor: string;
  featured?: boolean;
  badgeText?: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'quick-clarity',
    name: '5 Min Pass',
    displayName: 'Quick Clarity',
    price: 1,
    durationInMinutes: 5,
    description: 'Perfect for a quick cosmic check-in.',
    icon: 'star',
    iconColor: 'var(--secondary)',
    features: ['Live Voice Access', 'Instant Emotional Support', 'Private & Secure']
  },
  {
    id: 'deep-healing',
    name: '30 Min Pass',
    displayName: 'Deep Healing',
    price: 3,
    durationInMinutes: 30,
    description: 'Dive deep into your birth chart and emotional blockages.',
    icon: 'bolt',
    iconColor: 'var(--tertiary)',
    featured: true,
    badgeText: 'MOST LOVED',
    features: ['Everything in Quick Clarity', 'Uncover Hidden Life Patterns', 'Persistent Soul Memory']
  },
  {
    id: 'cosmic-awakening',
    name: '60 Min Pass',
    displayName: 'Cosmic Awakening',
    price: 5,
    durationInMinutes: 60,
    description: 'A full hour of uninterrupted spiritual guidance.',
    icon: 'stars',
    iconColor: 'var(--secondary)',
    features: ['Everything in Deep Healing', 'Complete Future Forecasting', 'Ultimate Peace of Mind']
  }
];

const getPlanIcon = (iconName: string, iconColor: string) => {
  switch (iconName) {
    case 'star':
      return <Star size={36} style={{ color: iconColor }} fill="currentColor" />;
    case 'bolt':
      return <Zap size={36} style={{ color: iconColor }} fill="currentColor" />;
    case 'stars':
      return <Sparkles size={36} style={{ color: iconColor }} fill="currentColor" />;
    default:
      return <Star size={36} style={{ color: iconColor }} fill="currentColor" />;
  }
};

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [proUntil, setProUntil] = useState<Date | null>(null);

  useEffect(() => {
    document.body.classList.add('astraeus-active');
    
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data && data.isPro && data.proUntil) {
          setProUntil(new Date(data.proUntil));
        }
      })
      .catch(console.error);

    return () => {
      document.body.classList.remove('astraeus-active');
    };
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
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "Astraeus",
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
              window.location.href = "/chat";
            } else {
              toast.error("Payment verification failed.");
            }
          } catch (e) {
            console.error(e);
            toast.error("Error verifying payment.");
          }
        },
        theme: {
          color: "#e9c349"
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
    <div className="theme-astraeus min-h-screen flex flex-col">
      <Navbar variant="pricing" />

      {/* Main Content */}
      <main className="flex-grow astral-container relative z-10" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
        
        {/* Glow Background Orbs */}
        <div className="glow-orb glow-orb-1" style={{ top: '20%', left: '10%' }}></div>
        <div className="glow-orb glow-orb-2" style={{ bottom: '20%', right: '10%' }}></div>

        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 'tight', marginBottom: '1.5rem', background: 'linear-gradient(to right, #ffffff, var(--secondary), var(--tertiary))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Invest in Your Healing Journey
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
            Your first 15 text messages are completely free. When you&apos;re ready for deep, uninterrupted voice guidance, choose a cosmic pass below.
          </p>

          {/* Active Session Notification */}
          {proUntil && proUntil > new Date() && (
            <div className="mt-8 p-6 glass-panel" style={{ display: 'inline-block', borderRadius: '1rem', border: '1px solid var(--tertiary)' }}>
              <p className="text-tertiary font-semibold m-0" style={{ fontSize: '1.1rem' }}>
                You currently have an active Cosmic Session!
              </p>
              <p className="text-on-surface-variant text-sm m-0 mt-2">
                Your Pro access expires on: {proUntil.toLocaleString()}
              </p>
              <p className="text-on-surface-variant text-xs m-0 mt-1 opacity-75">
                Purchasing another package will add to your remaining time.
              </p>
            </div>
          )}
        </header>

        {/* 3 Tiers Cards Grid */}
        <div 
          className="pricing-layout-grid" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem', 
            maxWidth: '1100px', 
            margin: '4rem auto 0 auto' 
          }}
        >
          {PLANS.map((plan) => {
            const isFeatured = plan.featured;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="glass-card flex flex-col"
                style={{
                  borderRadius: '1.5rem',
                  padding: '2.5rem 2rem',
                  position: 'relative',
                  border: isFeatured ? '1px solid var(--tertiary)' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: isFeatured ? '0 0 40px rgba(233, 195, 73, 0.15)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
                  minHeight: '440px',
                }}
              >
                {isFeatured && plan.badgeText && (
                  <div 
                    className="font-label-caps"
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: 'linear-gradient(135deg, var(--tertiary), #b89a38)',
                      color: 'var(--on-tertiary)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '6px 16px',
                      borderBottomLeftRadius: '1rem',
                      borderTopRightRadius: '1.5rem',
                      letterSpacing: '1px'
                    }}
                  >
                    {plan.badgeText}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  {getPlanIcon(plan.icon, plan.iconColor)}
                  <h3 className={isFeatured ? 'text-gradient font-display' : 'font-display'} style={{ fontSize: '1.6rem', margin: 0, fontWeight: 700 }}>
                    {plan.displayName}
                  </h3>
                </div>

                <div style={{ fontSize: '2.75rem', fontWeight: '800', margin: '1rem 0', display: 'flex', alignItems: 'baseline', color: 'var(--on-bg-color)' }}>
                  ${plan.price}
                  <span style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--on-surface-variant)', marginLeft: '0.25rem' }}>
                    / {plan.durationInMinutes} mins
                  </span>
                </div>

                <p className="text-on-surface-variant" style={{ margin: '0 0 1.5rem 0', lineHeight: 1.5, minHeight: '48px', fontSize: '0.95rem' }}>
                  {plan.description}
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {plan.features.map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>
                      <CheckCircle2 size={18} style={{ color: plan.featured ? 'var(--tertiary)' : 'var(--secondary)' }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {isFeatured ? (
                  <button
                    onClick={() => handleSubscribe(plan.name, plan.price, plan.durationInMinutes)}
                    className="glow-button"
                    style={{ width: '100%', marginTop: 'auto', padding: '1rem', fontSize: '12px' }}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Start Deep Healing'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.name, plan.price, plan.durationInMinutes)}
                    className="glow-button-secondary cursor-pointer"
                    style={{ width: '100%', marginTop: 'auto', padding: '1rem', fontSize: '12px' }}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : plan.id === 'quick-clarity' ? 'Begin Quick Session' : 'Embrace Awakening'}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

      </main>

      <Footer />
    </div>
  );
}

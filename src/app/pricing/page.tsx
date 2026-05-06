"use client";

import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { useState } from 'react';
import { Check, Sparkles, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

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

  const handleSubscribe = async (plan: string, amount: number) => {
    setLoading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert("Razorpay SDK failed to load. Please check your connection.");
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
        currency: "INR",
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
                amount: amount
              })
            });
            
            if (verifyRes.ok) {
              alert("Payment successful! You are now a Cosmic Oracle.");
              window.location.href = "/dashboard";
            } else {
              alert("Payment verification failed.");
            }
          } catch (e) {
            console.error(e);
            alert("Error verifying payment.");
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
      alert('Failed to initiate payment.');
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
        </div>
        
        <div className="flex flex-col md:flex-row justify-center gap-8 items-center md:items-stretch">
          
          {/* Basic Plan */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card flex flex-col" 
            style={{ width: '100%', maxWidth: '380px' }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Star className="text-muted" size={24} />
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Stargazer</h3>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '800', margin: '1rem 0' }}>
              ₹0<span className="text-muted" style={{ fontSize: '1.2rem', fontWeight: '500' }}>/mo</span>
            </div>
            <p className="text-muted mb-6">Perfect for seeking occasional guidance from the cosmos.</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1 }}>
              <li className="flex items-center gap-3 mb-4">
                <Check size={20} className="text-primary" />
                <span>10 text messages/day</span>
              </li>
              <li className="flex items-center gap-3 mb-4">
                <Check size={20} className="text-primary" />
                <span>Standard AI Astrologer</span>
              </li>
              <li className="flex items-center gap-3 mb-4 text-muted opacity-50">
                <span style={{ width: '20px', textAlign: 'center' }}>-</span>
                <span>Voice Agents</span>
              </li>
              <li className="flex items-center gap-3 mb-4 text-muted opacity-50">
                <span style={{ width: '20px', textAlign: 'center' }}>-</span>
                <span>Long-term AI Memory</span>
              </li>
            </ul>
            <button className="btn btn-outline" style={{ width: '100%' }}>Current Plan</button>
          </motion.div>

          {/* Premium Plan */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card flex flex-col relative" 
            style={{ width: '100%', maxWidth: '380px', border: '1px solid rgba(157, 78, 221, 0.5)', boxShadow: '0 0 30px rgba(157, 78, 221, 0.15)' }}
          >
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1" style={{ borderBottomLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              MOST POPULAR
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-primary" size={24} />
              <h3 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>Cosmic Oracle</h3>
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '800', margin: '1rem 0' }}>
              ₹999<span className="text-muted" style={{ fontSize: '1.2rem', fontWeight: '500' }}>/mo</span>
            </div>
            <p className="text-muted mb-6">Unlock the full power of real-time AI and infinite memory.</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1 }}>
              <li className="flex items-center gap-3 mb-4">
                <Check size={20} className="text-primary" />
                <span className="font-medium">Unlimited messages</span>
              </li>
              <li className="flex items-center gap-3 mb-4">
                <Check size={20} className="text-primary" />
                <span className="font-medium">Voice & Realtime Agents</span>
              </li>
              <li className="flex items-center gap-3 mb-4">
                <Check size={20} className="text-primary" />
                <span className="font-medium">Mem0 Infinite Memory</span>
              </li>
              <li className="flex items-center gap-3 mb-4">
                <Check size={20} className="text-primary" />
                <span className="font-medium">Advanced AI Models</span>
              </li>
            </ul>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => handleSubscribe('Cosmic Oracle', 999)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Upgrade Now'}
            </button>
          </motion.div>
          
        </div>
      </main>
    </>
  );
}

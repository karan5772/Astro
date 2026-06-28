"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, MessageCircle, Mic, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PLANS, FREE_PLAN, FREE_MESSAGE_LIMIT } from "@/lib/plans";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ messageCount: number; messageBalance: number; voiceBalanceInSeconds: number } | null>(null);

  useEffect(() => {
    fetch("/api/user")
      .then(r => r.json())
      .then(d => setUserData({ messageCount: d.messageCount || 0, messageBalance: d.messageBalance || 0, voiceBalanceInSeconds: d.voiceBalanceInSeconds || 0 }))
      .catch(console.error);
  }, []);

  const loadRazorpay = () => new Promise<boolean>(resolve => {
    if (typeof window !== "undefined" && (window as any).Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const handleBuy = async (planId: string) => {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return;

    setLoading(planId);
    try {
      const ok = await loadRazorpay();
      if (!ok) { toast.error("Payment SDK failed to load."); return; }

      const res = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: plan.price, plan: plan.id }),
      });
      const data = await res.json();
      if (!data.orderId) throw new Error("Order creation failed");

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "Astro AI",
        description: `${plan.name} — ${plan.messagesGranted} messages + ${plan.voiceMinutes} min voice`,
        order_id: data.orderId,
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: plan.price,
              plan: plan.id,
            }),
          });
          if (verifyRes.ok) {
            toast.success("Payment successful — credits added.");
            window.location.href = "/chat";
          } else {
            toast.error("Payment verification failed.");
          }
        },
        theme: { color: "#6D5DFB" },
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate payment.");
    } finally {
      setLoading(null);
    }
  };

  const freeUsed = Math.min(userData?.messageCount ?? 0, FREE_MESSAGE_LIMIT);
  const freeLeft = Math.max(FREE_MESSAGE_LIMIT - freeUsed, 0);
  const paidMessages = userData?.messageBalance ?? 0;
  const voiceMins = Math.ceil((userData?.voiceBalanceInSeconds ?? 0) / 60);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar variant="pricing" />

      <main className="flex-grow pt-32 pb-20 max-w-[1280px] mx-auto px-6 w-full">

        {/* Header */}
        <div className="text-center max-w-[600px] mx-auto mb-16">
          <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/40 font-bold mb-4">Pricing</p>
          <h1 className="text-4xl font-semibold tracking-tight leading-tight mb-4">
            Pay for what you use.<br />Nothing more.
          </h1>
          <p className="text-foreground/50 text-base leading-relaxed">
            Start free with {FREE_MESSAGE_LIMIT} messages. Top up with bundles — messages and voice together, no subscriptions.
          </p>
        </div>

        {/* Current balance banner */}
        {userData && (paidMessages > 0 || voiceMins > 0 || freeLeft > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[700px] mx-auto mb-12 bg-card border border-border rounded-2xl p-5 flex flex-wrap gap-6 items-center justify-between"
          >
            <p className="text-sm font-semibold text-foreground/70">Your current balance</p>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <MessageCircle size={14} className="text-foreground/35" />
                <span className="text-sm font-semibold text-foreground">{freeLeft > 0 ? `${freeLeft} free` : `${paidMessages} paid`}</span>
                <span className="text-xs text-foreground/40">messages</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic size={14} className="text-foreground/35" />
                <span className="text-sm font-semibold text-foreground">{voiceMins}</span>
                <span className="text-xs text-foreground/40">min voice</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Free tier */}
        <div className="max-w-[700px] mx-auto mb-6">
          <div className="flex items-center gap-4 px-6 py-4 bg-card/50 border border-border rounded-2xl">
            <div className="w-8 h-8 rounded-lg bg-foreground/[0.05] border border-border flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-foreground/35" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{FREE_PLAN.name}</p>
              <p className="text-xs text-foreground/45 mt-0.5">{FREE_PLAN.features.join(' · ')}</p>
            </div>
            <span className="text-lg font-semibold text-foreground/60">$0</span>
          </div>
        </div>

        {/* Paid plans */}
        <div className="max-w-[700px] mx-auto flex flex-col gap-4">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className={`relative rounded-2xl border p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-all ${
                plan.featured
                  ? "bg-card border-primary/40 shadow-[0_0_40px_rgba(109,93,251,0.08)]"
                  : "bg-card/50 border-border"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-2.5 left-6 px-2.5 py-0.5 bg-primary text-white text-[9px] uppercase tracking-widest font-bold rounded-full">
                  {plan.badge}
                </div>
              )}

              {/* Left: name + features */}
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-3">{plan.name}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-1.5">
                      <Check size={11} className="text-foreground/40 shrink-0" />
                      <span className="text-[12px] text-foreground/55">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: price + CTA */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-2xl font-semibold text-foreground">${plan.price}</p>
                  <p className="text-[10px] text-foreground/35 mt-0.5">one-time</p>
                </div>
                <button
                  onClick={() => handleBuy(plan.id)}
                  disabled={loading !== null}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 ${
                    plan.featured
                      ? "bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(109,93,251,0.3)]"
                      : "bg-foreground/[0.07] hover:bg-foreground/[0.11] text-foreground border border-border"
                  }`}
                >
                  {loading === plan.id ? "Processing…" : "Buy"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-[11px] text-foreground/30 mt-10">
          Credits never expire · Secure payments via Razorpay · All prices in USD
        </p>

      </main>

      <Footer />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Zap, Sparkles, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
    id: "quick-clarity",
    name: "5 Min Pass",
    displayName: "Quick Clarity",
    price: 2,
    durationInMinutes: 5,
    description: "A fast, focused cosmic check-in when you only need a clean answer.",
    icon: "star",
    iconColor: "var(--tertiary)",
    features: ["Live voice access", "Fast emotional support", "Private and secure"],
  },
  {
    id: "deep-healing",
    name: "15 Min Pass",
    displayName: "Deep Healing",
    price: 5,
    durationInMinutes: 15,
    description: "A more complete reading for patterns, transitions, and recurring themes.",
    icon: "bolt",
    iconColor: "var(--tertiary)",
    featured: true,
    badgeText: "MOST LOVED",
    features: ["Everything in Quick Clarity", "Hidden life patterns", "Longer guided session"],
  },
  {
    id: "cosmic-awakening",
    name: "40 Min Pass",
    displayName: "Cosmic Awakening",
    price: 10,
    durationInMinutes: 40,
    description: "A full session for deeper forecasting and a broader life review.",
    icon: "stars",
    iconColor: "var(--tertiary)",
    features: ["Everything in Deep Healing", "Complete future forecasting", "Maximum session depth"],
  },
];

const getPlanIcon = (iconName: string, iconColor: string) => {
  switch (iconName) {
    case "star":
      return <Star size={28} style={{ color: iconColor }} fill="currentColor" />;
    case "bolt":
      return <Zap size={28} style={{ color: iconColor }} fill="currentColor" />;
    case "stars":
      return <Sparkles size={28} style={{ color: iconColor }} fill="currentColor" />;
    default:
      return <Star size={28} style={{ color: iconColor }} fill="currentColor" />;
  }
};

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [voiceBalanceInSeconds, setVoiceBalanceInSeconds] = useState<number>(0);

  useEffect(() => {
    document.body.classList.add("astraeus-active");

    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        if (data?.isPro && data?.voiceBalanceInSeconds) {
          setVoiceBalanceInSeconds(data.voiceBalanceInSeconds);
        }
      })
      .catch(console.error);

    return () => {
      document.body.classList.remove("astraeus-active");
    };
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as Window & { Razorpay?: unknown }).Razorpay) {
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
        return;
      }

      const res = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, plan }),
      });
      const data = await res.json();

      if (!data.orderId) {
        throw new Error("Order creation failed");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "Astraeus",
        description: `Subscription to ${plan} Plan`,
        order_id: data.orderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                amount,
                durationInMinutes,
              }),
            });

            if (verifyRes.ok) {
              toast.success("Payment successful. You are now a Cosmic Oracle.");
              window.location.href = "/chat";
            } else {
              toast.error("Payment verification failed.");
            }
          } catch (error) {
            console.error(error);
            toast.error("Error verifying payment.");
          }
        },
        theme: { color: "#6D5DFB" },
      };

      const rzp1 = new (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.error(error);
      toast.error("Failed to initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col justify-between selection:bg-primary/30 selection:text-white">
      <Navbar variant="pricing" />

      <main className="relative z-10 pt-32 pb-16 max-w-[1280px] mx-auto px-6 flex-grow w-full">
        {/* Glow Background Orbs */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" style={{ top: '15%', left: '10%' }}></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#9d4edd]/5 blur-3xl pointer-events-none" style={{ bottom: '15%', right: '10%' }}></div>

        <header className="flex flex-col gap-3 mb-12 text-center max-w-[720px] mx-auto">
          <p className="text-xs uppercase tracking-widest font-bold text-primary">Pricing</p>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">Invest in focused guidance, not a bloated subscription.</h1>
          <p className="text-sm text-white/50 leading-relaxed max-w-[580px] mx-auto mt-2">
            Your first 15 text messages are free. When you want deeper voice sessions, pick the pass that fits the depth of the conversation.
          </p>

          {voiceBalanceInSeconds > 0 && (
            <div className="inline-block mt-6 p-4 bg-secondary/80 border border-card-border rounded-lg max-w-[500px] mx-auto text-left">
              <p className="text-primary font-semibold text-sm">You currently have an active Cosmic Session.</p>
              <p className="text-white/50 text-xs mt-1">
                You have {Math.ceil(voiceBalanceInSeconds / 60)} minutes of active voice time remaining.
              </p>
            </div>
          )}
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => {
            const isFeatured = plan.featured;

            return (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`p-8 bg-[#18181b]/40 backdrop-blur-lg border rounded-lg shadow-xl relative flex flex-col justify-between h-full transition-all duration-300 hover:border-primary/50 hover:shadow-[0_8px_32px_rgba(109,93,251,0.05)] hover:-translate-y-1 ${isFeatured ? "border-primary bg-secondary/60 hover:border-primary/80 shadow-[0_0_30px_rgba(109,93,251,0.15)]" : "border-card-border"}`}
              >
                {isFeatured && plan.badgeText && (
                  <div className="absolute top-4 right-4 bg-primary text-white text-[9px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full">{plan.badgeText}</div>
                )}

                <div>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">{getPlanIcon(plan.icon, plan.iconColor)}</div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{plan.displayName}</h2>
                      <p className="text-xs text-white/50 leading-relaxed mt-1">{plan.description}</p>
                    </div>
                  </div>

                  <div className="text-3xl font-black text-white my-6 flex items-baseline gap-1">
                    ${plan.price}
                    <span className="text-xs font-medium text-white/40">/ {plan.durationInMinutes} mins</span>
                  </div>

                  <ul className="flex flex-col gap-3 mb-8 list-none p-0">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-xs text-white/70">
                        <CheckCircle2 size={18} className="text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.name, plan.price, plan.durationInMinutes)}
                  className={`w-full text-center py-3 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-all duration-300 ${isFeatured ? "bg-gradient-to-r from-primary to-[#4f46e5] text-white shadow-[0_0_20px_rgba(109,93,251,0.3)] hover:shadow-[0_0_30px_rgba(109,93,251,0.5)]" : "bg-secondary/80 border border-card-border hover:border-white/20 text-white"}`}
                  disabled={loading}
                >
                  {loading ? "Processing..." : isFeatured ? "Start Deep Healing" : plan.id === "quick-clarity" ? "Begin Quick Session" : "Embrace Awakening"}
                </button>
              </motion.article>
            );
          })}
        </section>
      </main>

      <Footer />
    </div>
  );
}

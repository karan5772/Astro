"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Zap, Sparkles, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "../astraeus.css";

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
    <div className="theme-astraeus page-shell">
      <Navbar variant="pricing" />

      <main className="page-main astral-container">
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />

        <header className="page-heading">
          <p className="section-kicker">Pricing</p>
          <h1 className="page-title">Invest in focused guidance, not a bloated subscription.</h1>
          <p className="page-lead">
            Your first 15 text messages are free. When you want deeper voice sessions, pick the pass that fits the depth of the conversation.
          </p>

          {voiceBalanceInSeconds > 0 && (
            <div className="glass-panel page-card" style={{ display: "inline-block", marginTop: "1.5rem" }}>
              <p style={{ margin: 0, color: "var(--tertiary)", fontWeight: 600 }}>You currently have an active Cosmic Session.</p>
              <p style={{ margin: "0.5rem 0 0", color: "var(--on-surface-variant)" }}>
                You have {Math.ceil(voiceBalanceInSeconds / 60)} minutes of active voice time remaining.
              </p>
            </div>
          )}
        </header>

        <section className="page-grid">
          {PLANS.map((plan) => {
            const isFeatured = plan.featured;

            return (
              <motion.article
                key={plan.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`glass-panel page-card shared-surface pricing-card ${isFeatured ? "pricing-card-featured" : ""}`}
              >
                {isFeatured && plan.badgeText && (
                  <div className="pricing-badge">{plan.badgeText}</div>
                )}

                <div className="pricing-card-top">
                  <div className="pricing-icon">{getPlanIcon(plan.icon, plan.iconColor)}</div>
                  <div>
                    <h2 className="pricing-title">{plan.displayName}</h2>
                    <p className="pricing-desc">{plan.description}</p>
                  </div>
                </div>

                <div className="pricing-price">
                  ${plan.price}
                  <span>/ {plan.durationInMinutes} mins</span>
                </div>

                <ul className="pricing-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle2 size={18} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.name, plan.price, plan.durationInMinutes)}
                  className={isFeatured ? "glow-button-primary pricing-action" : "glow-button-secondary pricing-action"}
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

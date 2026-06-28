"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { ArrowRight, Mic, BarChart3, MessageCircle, Shield } from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTheme } from "@/components/ThemeProvider";

const FEATURES = [
  {
    icon: MessageCircle,
    label: "Live Chat",
    title: "Ask anything. Get a real answer.",
    body: "Love, career, timing, life path — the AI reads your actual planetary positions and responds with specific, grounded guidance. Not generic horoscopes.",
    href: "/chat",
    imgDark: "/chat-dark.png",
    imgLight: "/chat-light.png",
  },
  {
    icon: Mic,
    label: "Voice",
    title: "Speak naturally. Hear your reading.",
    body: "A real-time voice session with your Vedic chart as context. Ask follow-up questions, go deeper, and get answers that are specific to you.",
    href: "/voice",
    imgDark: "/voice-dark.png",
    imgLight: "/voice-light.png",
  },
  {
    icon: BarChart3,
    label: "Birth Chart",
    title: "Your full Vedic chart, calculated instantly.",
    body: "Sidereal positions from your exact birth date, time, and place. Rasi, Navamsa, all 12 houses — calculated once and referenced in every reading.",
    href: "/chart",
    imgDark: "/chart-dark.png",
    imgLight: "/chart-light.png",
  },
];

const STEPS = [
  { n: "01", title: "Enter your birth details", body: "Date, time, and place of birth — that's all it takes to generate your full Vedic chart." },
  { n: "02", title: "Ask your question", body: "Type or speak anything you want to understand about your chart, life, or current period." },
  { n: "03", title: "Get a grounded reading", body: "The AI references your actual planetary positions to give you a specific, personalised answer." },
];

export default function HomePage() {
  const { userId } = useAuth();
  const { theme } = useTheme();
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative max-w-[1280px] mx-auto px-6 lg:px-10 pt-32 pb-24 flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

        {/* Ambient glow */}
        <div className="absolute top-40 right-0 -z-10 w-[600px] h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        {/* Left: copy */}
        <motion.div
          className="flex-1 max-w-[520px]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-[2.6rem] lg:text-[3.4rem] font-semibold leading-[1.12] tracking-tight mb-6">
            Astrology that looks polished,{" "}
            reads clearly,{" "}
            and answers fast.
          </h1>

          <p className="text-foreground/50 text-base leading-relaxed mb-10 max-w-[420px]">
            Astro AI blends Vedic charting, transit tracking, and AI-guided
            interpretation into one focused experience for text or voice readings.
          </p>

          <div className="flex flex-wrap gap-3 mb-12">
            <Link
              href={userId ? "/chat" : "/sign-up"}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-[13px] tracking-widest uppercase transition-all shadow-[0_0_28px_rgba(124,111,253,0.35)] hover:shadow-[0_0_40px_rgba(124,111,253,0.5)]"
            >
              Open chat terminal
            </Link>
            <Link
              href={userId ? "/voice" : "/sign-up"}
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-border hover:border-primary/40 bg-foreground/[0.03] text-foreground/65 hover:text-foreground rounded-xl font-bold text-[13px] tracking-widest uppercase transition-all"
            >
              <Mic size={14} /> Try voice reading
            </Link>
          </div>

          {/* 3 stat columns */}
          <div className="flex flex-wrap border-t border-border pt-8 gap-0">
            {[
              { label: "Charting mode", value: "Raman sidereal" },
              { label: "Input style", value: "Birth chart + chat" },
              { label: "Consultation", value: "Text and voice" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col pr-8 py-1 ${i < 2 ? "mr-8 border-r border-border" : ""}`}
              >
                <span className="text-[9px] uppercase tracking-[0.2em] text-foreground/35 font-bold mb-1.5">{stat.label}</span>
                <span className="text-sm font-semibold text-foreground/80">{stat.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: screenshot */}
        <motion.div
          className="flex-1 max-w-[560px] w-full"
          initial={{ opacity: 0, x: 32, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        >
          <div className="rounded-2xl overflow-hidden border border-border shadow-[0_24px_80px_rgba(0,0,0,0.3)]">
            <div className="relative bg-background overflow-hidden">
              <Image
                src={theme === "dark" ? "/hero-voice-dark.png" : "/hero-voice-light.png"}
                alt="Astraeus AI — voice reading"
                width={1366}
                height={1500}
                className="w-full h-auto object-cover object-top"
                priority
              />
            </div>
          </div>
        </motion.div>

      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        {/* Section header */}
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-24 pb-16 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/40 font-bold mb-4">What Astro AI does</p>
          <h2 className="text-3xl font-semibold leading-tight">One chart. Every question answered.</h2>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pb-24">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 items-center">

            {/* Left: tab list */}
            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-[280px] shrink-0">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                const active = activeFeature === i;
                return (
                  <button
                    key={f.label}
                    onClick={() => setActiveFeature(i)}
                    className={`flex-1 lg:flex-none text-left px-4 py-4 rounded-xl border transition-all duration-300 cursor-pointer ${active ? "bg-card border-border shadow-sm" : "border-transparent hover:border-border/60 hover:bg-card/40"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${active ? "bg-primary/10 border border-primary/20" : "bg-foreground/[0.04] border border-border"}`}>
                        <Icon size={12} className={active ? "text-primary" : "text-foreground/35"} />
                      </div>
                      <span className={`text-xs font-semibold transition-colors ${active ? "text-foreground" : "text-foreground/45"}`}>{f.label}</span>
                    </div>
                    <motion.div
                      initial={false}
                      animate={{ height: active ? "auto" : 0, opacity: active ? 1 : 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden hidden lg:block"
                    >
                      <p className="text-[12px] text-foreground/45 leading-relaxed pt-1.5">{f.body}</p>
                    </motion.div>
                  </button>
                );
              })}
            </div>

            {/* Right: screenshot */}
            <div className="flex-1 w-full min-w-0">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl overflow-hidden border border-border shadow-[0_20px_70px_rgba(0,0,0,0.18)]"
              >
                <Image
                  src={theme === "dark" ? FEATURES[activeFeature].imgDark : FEATURES[activeFeature].imgLight}
                  alt={`Astro AI — ${FEATURES[activeFeature].label}`}
                  width={1366}
                  height={900}
                  className="w-full h-auto object-cover object-top"
                />
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-card/40">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20">
          <motion.div
            className="mb-14 text-center max-w-xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/40 font-bold mb-4">How it works</p>
            <h2 className="text-3xl font-bold leading-tight">Ready in under a minute.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="relative flex flex-col gap-3"
              >
                <span className="text-[2.5rem] font-bold text-primary/15 leading-none">{s.n}</span>
                <p className="font-semibold text-sm text-foreground">{s.title}</p>
                <p className="text-[13px] text-foreground/50 leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/40 font-bold mb-5">✦ Get started</p>
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4 max-w-lg mx-auto">
              Ask the question you've been carrying.
            </h2>
            <p className="text-foreground/45 text-base mb-10 max-w-md mx-auto">
              15 free messages. No credit card. No commitment. Just your chart and the question you actually want answered.
            </p>
            <Link
              href={userId ? "/chat" : "/sign-up"}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_0_28px_rgba(124,111,253,0.35)] hover:shadow-[0_0_40px_rgba(124,111,253,0.5)]"
            >
              Start your reading <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Briefcase,
  Compass,
  Cpu,
  Globe,
  Heart,
  Sparkles,
  Stars,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type DemoTab = "chart" | "oracle" | "transits";

const features = [
  {
    icon: Briefcase,
    title: "Career signals",
    copy: "See how timing, ambition, and opportunity line up in a clean, actionable reading.",
  },
  {
    icon: Heart,
    title: "Love patterns",
    copy: "Explore chemistry, relationship dynamics, and the recurring themes in your chart.",
  },
  {
    icon: Globe,
    title: "Location-aware input",
    copy: "Birth details are normalized for accurate chart generation and transit context.",
  },
  {
    icon: Compass,
    title: "Guided daily advice",
    copy: "Ask for a reading, a decision check, or a focused follow-up whenever you need one.",
  },
];

const steps = [
  {
    index: "01",
    title: "Add your birth details",
    copy: "Enter date, time, and location once. The app handles the rest behind the scenes.",
  },
  {
    index: "02",
    title: "Let Astro AI calculate",
    copy: "Chart data and current transits are combined into a readable, modern interface.",
  },
  {
    index: "03",
    title: "Get a real answer",
    copy: "Use text or voice to explore career, relationships, timing, and general guidance.",
  },
];

const quickFacts = [
  { label: "Charting mode", value: "Raman sidereal" },
  { label: "Input style", value: "Birth chart + chat" },
  { label: "Consultation", value: "Text and voice" },
];

const orbitPoints = [
  { label: "Sun", top: "18%", left: "74%" },
  { label: "Moon", top: "66%", left: "18%" },
  { label: "Rising", top: "44%", left: "82%" },
  { label: "Venus", top: "70%", left: "70%" },
];

const panelCopy: Record<DemoTab, string> = {
  chart:
    "Your chart is being drawn with a sidereal framework, mapped into a calm orbital dashboard instead of a dense table dump.",
  oracle:
    "Calculating your celestial context now. The chart points toward strong creative momentum, with a need to keep communication precise and deliberate.",
  transits:
    "Mercury is active, the lunar phase is waxing, and the current session is optimized for quick, focused guidance rather than a long ritual.",
};

export default function LandingPage() {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState<DemoTab>("chart");
  const [oracleText, setOracleText] = useState("");

  useEffect(() => {
    // Body styling is handled via Tailwind and globals.css
  }, []);

  useEffect(() => {
    if (activeTab !== "oracle") {
      return;
    }

    const fullText = panelCopy.oracle;
    let index = 0;
    let timer: number | undefined;

    const startTyping = () => {
      setOracleText("");
      timer = window.setInterval(() => {
        index += 1;
        setOracleText(fullText.slice(0, index));
        if (index >= fullText.length && timer) {
          window.clearInterval(timer);
        }
      }, 20);
    };

    const startHandle = window.setTimeout(startTyping, 0);

    return () => {
      window.clearTimeout(startHandle);
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [activeTab]);

  const heroMotion = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
  } as const;

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  } as const;

  return (
    <div className="min-h-screen bg-[#0c0d12] text-white overflow-hidden relative selection:bg-primary/30 selection:text-white">
      <Navbar variant="landing" />

      <main className="relative z-10 pt-24 pb-16">
        <section className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-12 md:py-20">
          <motion.div
            className="lg:col-span-7 flex flex-col gap-6"
            initial="initial"
            animate="animate"
            variants={stagger}
          >

            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-primary" variants={heroMotion}>
              Astrology that looks polished, reads clearly, and answers fast.
            </motion.h1>

            <motion.p className="text-base md:text-lg text-white/60 leading-relaxed max-w-[580px]" variants={heroMotion}>
              Astro AI blends Vedic charting, transit tracking, and AI-guided interpretation into one focused experience for text or voice readings.
            </motion.p>

            <motion.div className="flex flex-wrap gap-4 items-center" variants={heroMotion}>
              <Link href={userId ? "/chat" : "/sign-up"} className="inline-flex items-center justify-center gap-2 py-3.5 px-8 bg-gradient-to-r from-primary to-[#4f46e5] text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(109,93,251,0.3)] hover:shadow-[0_0_30px_rgba(109,93,251,0.5)] hover:-translate-y-0.5 transition-all duration-300">
                Open Chat Terminal
              </Link>
              <Link href={userId ? "/voice" : "/sign-up"} className="inline-flex items-center justify-center gap-2 py-3.5 px-8 bg-secondary/80 border border-card-border hover:border-white/20 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:-translate-y-0.5 transition-all duration-300">
                Try Voice Reading
              </Link>
            </motion.div>

            <motion.div className="flex flex-wrap gap-6 mt-4" variants={heroMotion}>
              {quickFacts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-1 border-l-2 border-primary/40 pl-4">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-white/40">{fact.label}</span>
                  <span className="text-sm font-semibold text-white">{fact.value}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="lg:col-span-5 w-full flex justify-center"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <div className="w-full max-w-[480px] bg-secondary/60 backdrop-blur-xl border border-card-border rounded-lg overflow-hidden shadow-2xl transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(109,93,251,0.08)]">
              <div className="flex items-center justify-between px-4 py-3 bg-[#0c0d12]/80 border-b border-card-border">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="w-2 h-2 rounded-full bg-white/10" />
                  <span className="w-2 h-2 rounded-full bg-white/10" />
                </div>
                <div className="flex gap-1" role="tablist" aria-label="Preview modes">
                  {(["chart", "oracle", "transits"] as DemoTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeTab === tab ? "bg-primary/20 text-primary border border-primary/30" : "text-white/40 hover:text-white/80"}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === "chart" ? "Chart" : tab === "oracle" ? "Oracle" : "Transits"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 min-h-[300px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {activeTab === "chart" && (
                    <motion.div
                      key="chart"
                      className="w-full flex flex-col justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="relative w-full aspect-square max-w-[200px] mx-auto flex items-center justify-center mb-4">
                        <div className="absolute inset-0 rounded-full border border-primary/10 animate-pulse" />
                        <div className="absolute rounded-full border border-white/5 w-[90%] h-[90%] animate-spin-slow" />
                        <div className="absolute rounded-full border border-white/5 w-[65%] h-[65%] animate-spin-slow-reverse" />
                        <div className="absolute rounded-full border border-white/5 w-[40%] h-[40%] animate-spin-slow" />
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[#0c0d12] border border-primary/30 shadow-[0_0_15px_rgba(109,93,251,0.2)]">
                          <img src="/logo.png" width={100} height={100} alt="" className="w-6 h-6 object-contain" />
                        </div>
                        {orbitPoints.map((point) => (
                          <div
                            key={point.label}
                            className="absolute flex items-center justify-center"
                            style={{ top: point.top, left: point.left }}
                          >
                            <span className="absolute whitespace-nowrap text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 bg-[#0c0d12] border border-white/10 rounded-full text-white/60 shadow-lg">{point.label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-white/50 text-center leading-relaxed mt-4">{panelCopy.chart}</p>
                    </motion.div>
                  )}

                  {activeTab === "oracle" && (
                    <motion.div
                      key="oracle"
                      className="w-full flex flex-col justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary/80 uppercase tracking-wider mb-3">
                        <Cpu size={13} />
                        <span>AI oracle response</span>
                      </div>
                      <div className="text-sm text-white/80 font-mono leading-relaxed min-h-[140px]">{oracleText}<span className="w-1.5 h-4 bg-primary inline-block animate-pulse ml-0.5" aria-hidden="true" /></div>
                    </motion.div>
                  )}

                  {activeTab === "transits" && (
                    <motion.div
                      key="transits"
                      className="w-full flex flex-col justify-between"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col gap-1 p-3 rounded-lg bg-[#0c0d12]/60 border border-card-border">
                          <span className="text-[9px] uppercase tracking-widest text-white/40">Mercury</span>
                          <strong className="text-white text-sm">Active</strong>
                        </div>
                        <div className="flex flex-col gap-1 p-3 rounded-lg bg-[#0c0d12]/60 border border-card-border">
                          <span className="text-[9px] uppercase tracking-widest text-white/40">Lunar phase</span>
                          <strong className="text-white text-sm">Waxing gibbous</strong>
                        </div>
                        <div className="flex flex-col gap-1 p-3 rounded-lg bg-[#0c0d12]/60 border border-card-border">
                          <span className="text-[9px] uppercase tracking-widest text-white/40">Mode</span>
                          <strong className="text-white text-sm">Raman sidereal</strong>
                        </div>
                        <div className="flex flex-col gap-1 p-3 rounded-lg bg-[#0c0d12]/60 border border-card-border">
                          <span className="text-[9px] uppercase tracking-widest text-white/40">Latency</span>
                          <strong className="text-white text-sm">14ms</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/50 bg-primary/10 border border-primary/20 rounded-lg p-3 leading-relaxed">
                        <Activity size={14} className="shrink-0 text-primary" />
                        <span>{panelCopy.transits}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="max-w-[1280px] mx-auto px-6 py-16 md:py-24 border-t border-white/5">
          <div className="flex flex-col gap-3 max-w-[620px] mb-12">
            <p className="text-xs uppercase tracking-widest font-bold text-primary">What it does</p>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">One product, three useful surfaces.</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              The app is designed to feel like a premium dashboard, not a cluttered astrology template.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="p-6 bg-secondary/40 backdrop-blur-lg border border-card-border rounded-lg shadow-xl hover:border-primary/50 hover:shadow-[0_8px_32px_rgba(109,93,251,0.05)] hover:-translate-y-1 transition-all duration-300">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-4">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.copy}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="max-w-[1280px] mx-auto px-6 py-16 md:py-24 border-t border-white/5">
          <div className="flex flex-col gap-3 max-w-[620px] mb-12">
            <p className="text-xs uppercase tracking-widest font-bold text-primary">How it works</p>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">A short path from birth data to useful insight.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <article key={step.index} className="p-6 bg-secondary/40 backdrop-blur-lg border border-card-border rounded-lg shadow-xl hover:border-primary/50 hover:shadow-[0_8px_32px_rgba(109,93,251,0.05)] hover:-translate-y-1 transition-all duration-300">
                <span className="text-3xl font-black text-primary/30 mb-2 block">{step.index}</span>
                <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="max-w-[1280px] mx-auto px-6 py-12 md:py-16">
          <div className="p-8 md:p-12 bg-secondary/40 backdrop-blur-lg border border-card-border rounded-lg flex flex-col md:flex-row gap-8 items-center justify-between shadow-2xl">
            <div className="flex flex-col gap-3 max-w-[620px]">
              <p className="text-xs uppercase tracking-widest font-bold text-primary">Ready when you are</p>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-white">Open the chat terminal or switch to voice when you want a deeper reading.</h2>
              <p className="text-sm text-white/50 leading-relaxed">
                The rebuilt interface keeps the focus on clarity, so users can move from curiosity to action without fighting the UI.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 items-center shrink-0">
              <Link href={userId ? "/chat" : "/sign-up"} className="inline-flex items-center justify-center gap-2 py-3.5 px-8 bg-gradient-to-r from-primary to-[#4f46e5] text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(109,93,251,0.3)] hover:shadow-[0_0_30px_rgba(109,93,251,0.5)] hover:-translate-y-0.5 transition-all duration-300">
                Start Reading
                <ArrowRight size={14} />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 py-3.5 px-8 bg-secondary/80 border border-card-border hover:border-white/20 text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:-translate-y-0.5 transition-all duration-300">
                See Plans
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}

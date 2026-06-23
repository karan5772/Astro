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
import "./astraeus.css";

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
    document.body.classList.add("astraeus-active");
    return () => {
      document.body.classList.remove("astraeus-active");
    };
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
    <div className="theme-astraeus landing-shell selection:bg-[#6D5DFB]/30 selection:text-white">
      <Navbar variant="landing" />

      <main className="landing-main">
        <section className="landing-hero astral-container">
          <motion.div
            className="landing-copy"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div className="landing-eyebrow" variants={heroMotion}>
              <Stars size={14} />
              <span>Astro AI live showcase</span>
            </motion.div>

            <motion.h1 className="landing-title" variants={heroMotion}>
              Astrology that looks polished, reads clearly, and answers fast.
            </motion.h1>

            <motion.p className="landing-lead" variants={heroMotion}>
              Astro AI blends Vedic charting, transit tracking, and AI-guided interpretation into one focused experience for text or voice readings.
            </motion.p>

            <motion.div className="landing-actions" variants={heroMotion}>
              <Link href={userId ? "/chat" : "/sign-up"} className="glow-button-primary">
                Open Chat Terminal
              </Link>
              <Link href={userId ? "/voice" : "/sign-up"} className="glow-button-secondary">
                Try Voice Reading
              </Link>
            </motion.div>

            <motion.div className="landing-metrics" variants={heroMotion}>
              {quickFacts.map((fact) => (
                <div key={fact.label} className="metric-card">
                  <span className="metric-label">{fact.label}</span>
                  <span className="metric-value">{fact.value}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="landing-demo"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            <div className="glass-panel demo-panel">
              <div className="demo-header">
                <div className="demo-window-controls" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="demo-tabs" role="tablist" aria-label="Preview modes">
                  {(["chart", "oracle", "transits"] as DemoTab[]).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`demo-tab ${activeTab === tab ? "active" : ""}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === "chart" ? "Chart" : tab === "oracle" ? "Oracle" : "Transits"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="demo-body">
                <AnimatePresence mode="wait">
                  {activeTab === "chart" && (
                    <motion.div
                      key="chart"
                      className="demo-panel-content"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="orbit-stage">
                        <div className="orbit-halo" />
                        <div className="orbit-ring orbit-ring-large" />
                        <div className="orbit-ring orbit-ring-medium" />
                        <div className="orbit-ring orbit-ring-small" />
                        <div className="orbit-core">
                          <Sparkles size={22} />
                          <span>ASC</span>
                        </div>
                        {orbitPoints.map((point) => (
                          <div
                            key={point.label}
                            className="orbit-point"
                            style={{ top: point.top, left: point.left }}
                          >
                            <span className="orbit-label">{point.label}</span>
                          </div>
                        ))}
                      </div>
                      <p className="demo-caption">{panelCopy.chart}</p>
                    </motion.div>
                  )}

                  {activeTab === "oracle" && (
                    <motion.div
                      key="oracle"
                      className="demo-panel-content"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="terminal-line">
                        <Cpu size={13} />
                        <span>AI oracle response</span>
                      </div>
                      <div className="terminal-copy">{oracleText}</div>
                      <div className="terminal-cursor" aria-hidden="true" />
                    </motion.div>
                  )}

                  {activeTab === "transits" && (
                    <motion.div
                      key="transits"
                      className="demo-panel-content"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="transit-grid">
                        <div className="transit-card">
                          <span className="transit-label">Mercury</span>
                          <strong>Active</strong>
                        </div>
                        <div className="transit-card">
                          <span className="transit-label">Lunar phase</span>
                          <strong>Waxing gibbous</strong>
                        </div>
                        <div className="transit-card">
                          <span className="transit-label">Mode</span>
                          <strong>Raman sidereal</strong>
                        </div>
                        <div className="transit-card">
                          <span className="transit-label">Latency</span>
                          <strong>14ms</strong>
                        </div>
                      </div>
                      <div className="transit-bar">
                        <Activity size={14} />
                        <span>{panelCopy.transits}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="astral-container content-section">
          <div className="section-heading">
            <p className="section-kicker">What it does</p>
            <h2 className="section-title">One product, three useful surfaces.</h2>
            <p className="section-copy">
              The app is designed to feel like a premium dashboard, not a cluttered astrology template.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className="feature-card glass-panel">
                  <div className="feature-icon">
                    <Icon size={22} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="astral-container content-section">
          <div className="section-heading">
            <p className="section-kicker">How it works</p>
            <h2 className="section-title">A short path from birth data to useful insight.</h2>
          </div>

          <div className="steps-grid">
            {steps.map((step) => (
              <article key={step.index} className="step-card glass-panel">
                <span className="step-index">{step.index}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="astral-container cta-section">
          <div className="cta-card glass-panel">
            <div className="cta-copy">
              <p className="section-kicker">Ready when you are</p>
              <h2 className="cta-title">Open the chat terminal or switch to voice when you want a deeper reading.</h2>
              <p className="section-copy">
                The rebuilt interface keeps the focus on clarity, so users can move from curiosity to action without fighting the UI.
              </p>
            </div>
            <div className="cta-actions">
              <Link href={userId ? "/chat" : "/sign-up"} className="glow-button-primary">
                Start Reading
                <ArrowRight size={14} />
              </Link>
              <Link href="/pricing" className="glow-button-secondary">
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

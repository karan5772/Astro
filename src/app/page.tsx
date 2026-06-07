"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/nextjs';
import { Sparkles, MessageSquare, Mic, Stars, Briefcase, Heart, Users, HeartHandshake } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './astraeus.css';

export default function LandingPage() {
  const { userId } = useAuth();

  useEffect(() => {
    document.body.classList.add('astraeus-active');
    return () => {
      document.body.classList.remove('astraeus-active');
    };
  }, []);

  // Animation constants for reusable transitions
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  } as const;

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  } as const;

  const cardHover = {
    hover: {
      y: -4,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  } as const;

  return (
    <div className="theme-astraeus selection:bg-[#e9c349]/30 selection:text-[#ffe088]">
      {/* Top Navigation */}
      <Navbar variant="landing" />

      <main className="relative z-10 pt-32 pb-24 overflow-x-hidden">

        {/* Hero Section */}
        <section className="astral-container astral-hero-section">

          {/* Decorative half-wheel image anchored to right */}
          <div className="astral-hero-wheel-container">
            <motion.img
              alt="Background decorative wheel"
              className="w-full h-full object-contain rounded-full"
              src="/logo.png"
              animate={{ rotate: 360 }}
              transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* Hero Text Content */}
          <motion.div
            className="astral-hero-content"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div
              className="astral-chip font-label-caps"
              variants={fadeInUp}
            >
              <Stars size={16} className="text-[#e9c349]" fill="currentColor" />
              <span>Cosmic Guidance Awaits</span>
            </motion.div>

            <motion.h1
              className="astral-hero-title hero-title-gradient font-display"
              variants={fadeInUp}
            >
              Your Future, Written in the Stars
            </motion.h1>

            <motion.p
              className="astral-hero-desc"
              variants={fadeInUp}
            >
              Unlock the mysteries of your path. Our expert astrologers and advanced celestial algorithms provide profound clarity on love, career, and your spiritual journey.
            </motion.p>

            <motion.div
              className="astral-hero-buttons"
              variants={fadeInUp}
            >
              <Link href={userId ? "/chat" : "/sign-up"} className="no-underline">
                <button className="glow-button-primary cursor-pointer">

                  Start Chat
                </button>
              </Link>
              <Link href={userId ? "/voice" : "/sign-up"} className="no-underline">
                <button className="glow-button-secondary cursor-pointer">

                  Voice Talk
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Insights Grid (Bento style) */}
        <section className="astral-container astral-bento-section">
          <h2 className="astral-bento-title font-display">
            Unveil the Hidden Aspects of Your Life
          </h2>

          <div className="astral-bento-grid">
            {/* Future & Spirits (Large Card) */}
            <motion.div
              className="glass-panel astral-card astral-card-large group cursor-pointer"
              whileHover="hover"
              variants={cardHover}
            >
              {/* Premium generated image background */}
              <div
                className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-700 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/future_spirits.png')",
                  mixBlendMode: 'screen'
                }}
              />
              <div className="astral-card-large-icon-bg">
                <Sparkles size={120} className="text-[#e9c349] drop-shadow-[0_0_15px_rgba(233,195,73,0.5)]" />
              </div>
              <div className="relative z-10">
                <h3 className="astral-card-headline-lg font-display">
                  Future &amp; Spirits
                </h3>
                <p className="astral-card-desc-lg">
                  Peer into the celestial timeline. Understand the spiritual forces guiding your journey and anticipate the cosmic shifts ahead.
                </p>
              </div>
            </motion.div>

            {/* Career Path */}
            <motion.div
              className="glass-panel astral-card group cursor-pointer"
              whileHover="hover"
              variants={cardHover}
            >
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-[#4e2da6]/10 rounded-full blur-2xl group-hover:bg-[#4e2da6]/20 transition-colors" />
              <div className="astral-card-icon bg-[#4e2da6]/20 border border-[#cebdff]/20 shadow-[0_0_15px_rgba(206,189,255,0.1)]">
                <Briefcase size={24} className="text-[#cebdff]" />
              </div>
              <div className="relative z-10">
                <h3 className="astral-card-headline">
                  Career Path
                </h3>
                <p className="astral-card-desc">
                  Align your professional ambitions with your natal chart placements.
                </p>
              </div>
            </motion.div>

            {/* Love & Romance */}
            <motion.div
              className="glass-panel astral-card group cursor-pointer"
              whileHover="hover"
              variants={cardHover}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#93000a]/5 to-transparent opacity-50" />
              <div className="astral-card-icon bg-[#93000a]/20 border border-[#ffb4ab]/20 shadow-[0_0_15px_rgba(255,180,171,0.1)]">
                <Heart size={24} className="text-[#ffb4ab]" />
              </div>
              <div className="relative z-10">
                <h3 className="astral-card-headline">
                  Love &amp; Romance
                </h3>
                <p className="astral-card-desc">
                  Discover Venusian influences shaping your desires and attractions.
                </p>
              </div>
            </motion.div>

            {/* Relationships */}
            <motion.div
              className="glass-panel astral-card group cursor-pointer"
              whileHover="hover"
              variants={cardHover}
            >
              <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-[#e9c349]/5 rounded-full blur-2xl group-hover:bg-[#e9c349]/10 transition-colors" />
              <div className="astral-card-icon bg-[#100b00]/30 border border-[#e9c349]/20 shadow-[0_0_15px_rgba(233,195,73,0.1)]">
                <Users size={24} className="text-[#e9c349]" />
              </div>
              <div className="relative z-10">
                <h3 className="astral-card-headline">
                  Relationships
                </h3>
                <p className="astral-card-desc">
                  Navigate interpersonal dynamics through synastry and element compatibility.
                </p>
              </div>
            </motion.div>

            {/* Marriage & Union (Wide Card) */}
            <motion.div
              className="glass-panel astral-card astral-card-wide group cursor-pointer"
              whileHover="hover"
              variants={cardHover}
            >
              {/* Premium generated image background */}
              <div
                className="absolute inset-0 opacity-15 bg-cover bg-center"
                style={{
                  backgroundImage: "url('/marriage_union.png')",
                  mixBlendMode: 'screen'
                }}
              />
              <div className="w-16 h-16 shrink-0 rounded-full bg-[#050b1a] border border-[#c0c6db]/20 flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(192,198,219,0.1)] group-hover:scale-110 transition-transform">
                <HeartHandshake size={30} className="text-[#c0c6db]" />
              </div>
              <div className="relative z-10">
                <h3 className="astral-card-headline font-display" style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
                  Marriage &amp; Union
                </h3>
                <p className="astral-card-desc">
                  Explore long-term partnerships and seventh-house significations to build a foundation written in the stars.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Cosmic Signature Section */}
        <section id="birth-chart" className="astral-container astral-sig-section">
          <div className="relative">
            <div className="absolute left-1/2 -top-10 -translate-x-1/2 w-64 h-64 bg-[#e9c349]/10 blur-[100px] rounded-full pointer-events-none" />
            <h2 className="astral-sig-title font-display">
              Your Cosmic Signature
            </h2>
            <p className="astral-sig-desc">
              A glimpse into the celestial alignment at the moment of your arrival. Your birth chart is a unique map of the heavens, whispering the secrets of your soul&apos;s journey.
            </p>
          </div>

          <div className="sig-container mb-16">
            {/* Constellation lines SVG overlay (Desktop Only) */}
            <svg className="astral-svg-lines" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
              {/* Sun in Leo to Wheel */}
              <line stroke="rgba(233, 195, 73, 0.4)" strokeDasharray="4 4" strokeWidth="1" x1="150" y1="80" x2="300" y2="180" />
              {/* Moon in Scorpio to Wheel */}
              <line stroke="rgba(233, 195, 73, 0.4)" strokeDasharray="4 4" strokeWidth="1" x1="180" y1="490" x2="310" y2="390" />
              {/* Rising in Aquarius to Wheel */}
              <line stroke="rgba(233, 195, 73, 0.4)" strokeDasharray="4 4" strokeWidth="1" x1="740" y1="110" x2="590" y2="210" />
              {/* Venus in Libra to Wheel */}
              <line stroke="rgba(233, 195, 73, 0.4)" strokeDasharray="4 4" strokeWidth="1" x1="720" y1="450" x2="590" y2="380" />
            </svg>

            {/* Decorative alignment text & indicators */}
            <div className="sig-indicators">
              <div className="sig-indicator indicator-sun animate-pulse">
                <span className="font-label-caps text-[#e9c349] block drop-shadow-[0_0_5px_rgba(233,195,73,0.5)]">
                  Sun in Leo
                </span>
                <div className="sig-line-r" />
              </div>

              <div className="sig-indicator indicator-moon animate-pulse-slow">
                <span className="font-label-caps text-[#e9c349] block drop-shadow-[0_0_5px_rgba(233,195,73,0.5)]">
                  Moon in Scorpio
                </span>
                <div className="sig-line-r" style={{ width: '6rem' }} />
              </div>

              <div className="sig-indicator indicator-rising animate-pulse-slow">
                <span className="font-label-caps text-[#e9c349] block drop-shadow-[0_0_5px_rgba(233,195,73,0.5)]">
                  Rising in Aquarius
                </span>
                <div className="sig-line-l" />
              </div>

              <div className="sig-indicator indicator-venus animate-pulse">
                <span className="font-label-caps text-[#e9c349] block drop-shadow-[0_0_5px_rgba(233,195,73,0.5)]">
                  Venus in Libra
                </span>
                <div className="sig-line-l" style={{ width: '5rem' }} />
              </div>
            </div>

            {/* Central Birth Chart Wheel */}
            <div className="astral-wheel-image-container">
              <div className="absolute inset-0 rounded-full border border-[#e9c349]/10 animate-spin-slow-reverse" style={{ position: 'absolute' }} />
              <motion.img
                alt="Intricate gold and blue astrology birth chart wheel"
                className="w-full h-full object-contain rounded-full opacity-100 drop-shadow-[0_0_30px_rgba(233,195,73,0.3)]"
                src="/logo.png"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div>
            <Link href={userId ? "/chat" : "/sign-up"} className="no-underline">
              <button className="glow-button-primary cursor-pointer" style={{ padding: '1.25rem 2.5rem' }}>
                Generate Full Chart
              </button>
            </Link>
          </div>
        </section>

        {/* How It Works */}
        <section className="astral-steps-section">
          <div className="absolute inset-0 opacity-5 bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url('/future_spirits.png')", mixBlendMode: 'screen' }} />
          <div className="astral-container">
            <div className="text-center" style={{ marginBottom: '4rem' }}>
              <h2 className="astral-steps-title font-display">
                The Process of Discovery
              </h2>
              <p className="astral-steps-desc">
                Three steps to align yourself with cosmic wisdom.
              </p>
            </div>

            <div className="astral-steps-layout">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-[#e9c349]/40 to-transparent z-0 shadow-[0_0_10px_rgba(233,195,73,0.5)]" />

              {/* Step 1 */}
              <div className="astral-step-item">
                <div className="step-badge">
                  <span className="step-badge-text">01</span>
                </div>
                <h3 className="step-headline">
                  Provide Birth Data
                </h3>
                <p className="step-desc">
                  Enter your exact birth time, date, and location to generate an accurate celestial map.
                </p>
              </div>

              {/* Step 2 */}
              <div className="astral-step-item">
                <div className="step-badge">
                  <span className="step-badge-text">02</span>
                </div>
                <h3 className="step-headline">
                  Select a Medium
                </h3>
                <p className="step-desc">
                  Choose between instant live chat or a deep-dive voice consultation with our experts.
                </p>
              </div>

              {/* Step 3 */}
              <div className="astral-step-item">
                <div className="step-badge">
                  <span className="step-badge-text">03</span>
                </div>
                <h3 className="step-headline">
                  Receive Insight
                </h3>
                <p className="step-desc">
                  Gain profound clarity on your life&apos;s path, challenges, and upcoming opportunities.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer component */}
      <Footer />
    </div>
  );
}

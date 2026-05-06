"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserButton, useAuth } from '@clerk/nextjs';
import { Mic, Brain, Sparkles, ArrowRight, MessageSquare, Zap } from 'lucide-react';

export default function LandingPage() {
  const { userId } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link href="/" className="nav-brand">
            <Sparkles className="text-primary" size={24} />
            <span>Astro AI</span>
          </Link>
          <div className="nav-links">
            <Link href="#features">Features</Link>
            <Link href="#how-it-works">How it Works</Link>
            <Link href="/pricing">Pricing</Link>
          </div>
          <div className="nav-actions">
            {userId ? (
              <>
                <Link href="/dashboard" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Dashboard</Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link href="/sign-in" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Sign In</Link>
                <Link href="/sign-up" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="glow-orb glow-orb-1"></div>
          <div className="glow-orb glow-orb-2"></div>
          
          <div className="container relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="hero-title">
                Discover Your <span className="text-gradient font-serif italic">Cosmic Path</span>
              </h1>
              <p className="hero-subtitle">
                Talk to our advanced AI astrologer via text or voice. Unveil your horoscope, understand your past, and navigate your future with personalized, memory-augmented readings.
              </p>
              
              <div className="flex justify-center gap-4 flex-wrap mt-8">
                <Link href="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                  Start Free Reading <ArrowRight size={18} />
                </Link>
                <Link href="#features" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                  Explore Features
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative z-10 bg-black/40">
          <div className="container">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Next-Gen Astrological Insights</h2>
              <p className="text-muted mx-auto" style={{ maxWidth: '600px', fontSize: '1.1rem' }}>
                We've combined ancient wisdom with cutting-edge artificial intelligence to give you an experience unlike any other.
              </p>
            </motion.div>

            <div className="features-grid">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="glass-card"
              >
                <div className="feature-icon-wrapper">
                  <Mic size={28} />
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Realtime Voice Agent</h3>
                <p className="text-muted">Talk naturally. Our low-latency voice-enabled AI picks up your nuances and speaks back, making the astrological experience deeply personal.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="glass-card"
              >
                <div className="feature-icon-wrapper">
                  <Brain size={28} />
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Infinite Memory</h3>
                <p className="text-muted">Powered by Mem0, our AI remembers your past readings, zodiac traits, and personal milestones for continuous, evolving guidance.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="glass-card"
              >
                <div className="feature-icon-wrapper">
                  <Zap size={28} />
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Agentic Intelligence</h3>
                <p className="text-muted">Built with the Vercel AI SDK. Our AI acts autonomously to cross-reference planetary alignments and ephemeris data in real-time.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24">
          <div className="container">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>How It Works</h2>
              <p className="text-muted mx-auto" style={{ maxWidth: '600px', fontSize: '1.1rem' }}>
                Your journey to cosmic enlightenment is just a few steps away.
              </p>
            </motion.div>

            <div className="steps-container">
              {[
                { title: 'Create Your Profile', desc: 'Sign up and enter your birth details (date, time, and location) to generate your exact natal chart.' },
                { title: 'Choose Your Medium', desc: 'Select between our free interactive text chat or upgrade to a premium seamless voice session.' },
                { title: 'Receive Continuous Guidance', desc: 'Ask anything. The AI remembers past conversations and provides increasingly personalized advice over time.' }
              ].map((step, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.5 }}
                  className="step-item"
                >
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="cta-box glass-card text-center"
              style={{ padding: '4rem 2rem' }}
            >
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Ready to Read the Stars?</h2>
              <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem auto' }}>
                Join thousands of users discovering their destiny through the power of advanced AI astrology.
              </p>
              <Link href="/sign-up" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                Get Your First Reading Free
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Link href="/" className="nav-brand mb-6">
                <Sparkles className="text-primary" size={24} />
                <span>Astro AI</span>
              </Link>
              <p className="text-muted" style={{ maxWidth: '300px', lineHeight: '1.6' }}>
                Pioneering the future of astrological guidance with empathetic, memory-augmented artificial intelligence.
              </p>
            </div>
            
            <div>
              <h4 className="footer-heading">Platform</h4>
              <div className="footer-links">
                <Link href="/features">Features</Link>
                <Link href="/pricing">Pricing</Link>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/voice">Voice Agents</Link>
              </div>
            </div>
            
            <div>
              <h4 className="footer-heading">Resources</h4>
              <div className="footer-links">
                <Link href="#">Horoscopes</Link>
                <Link href="#">Astrology Blog</Link>
                <Link href="#">API Documentation</Link>
                <Link href="#">Help Center</Link>
              </div>
            </div>
            
            <div>
              <h4 className="footer-heading">Legal</h4>
              <div className="footer-links">
                <Link href="#">Privacy Policy</Link>
                <Link href="#">Terms of Service</Link>
                <Link href="#">Cookie Policy</Link>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Astro AI Inc. All rights reserved.</p>
            <div className="social-links">
              <Link href="#" aria-label="Twitter">Twitter</Link>
              <Link href="#" aria-label="GitHub">GitHub</Link>
              <Link href="#" aria-label="Discord">Discord</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mic, Heart, ArrowRight, Moon } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LandingPage() {

  return (
    <>
      <Navbar variant="landing" />

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
              <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1.1 }}>
                Find <span className="text-gradient font-serif italic" style={{ background: 'linear-gradient(135deg, #f1c40f, #e67e22)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Clarity.</span> Find <span className="text-gradient font-serif italic" style={{ background: 'linear-gradient(135deg, #9d4edd, #ff79c6)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Peace.</span>
              </h1>
              <p className="hero-subtitle" style={{ fontSize: '1.25rem', marginTop: '1.5rem', opacity: 0.9, maxWidth: '700px', margin: '1.5rem auto' }}>
                Life can feel overwhelming, but you don&apos;t have to navigate it alone. Speak with a deeply caring cosmic companion who listens to your heart, understands your stars, and guides you toward a brighter tomorrow—all for less than the cost of a coffee.
              </p>
              
              <div className="flex justify-center gap-4 flex-wrap mt-8">
                <Link href="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: 'linear-gradient(to right, #f39c12, #d35400)', border: 'none', color: 'white', boxShadow: '0 4px 20px rgba(243, 156, 18, 0.4)' }}>
                  Experience It Now <ArrowRight size={18} style={{ display: 'inline', marginLeft: '8px' }} />
                </Link>
                <Link href="#features" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.1rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                  See How We Care
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
              <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>A Space Where You Are Truly Understood</h2>
              <p className="text-muted mx-auto" style={{ maxWidth: '600px', fontSize: '1.1rem', lineHeight: 1.6 }}>
                We&apos;ve created a safe, judgment-free sanctuary. Whether you&apos;re seeking answers, healing, or just a friend to talk to, we are here for you.
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
                <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.2), rgba(211, 84, 0, 0.1))', color: '#f39c12', borderColor: 'rgba(243, 156, 18, 0.3)' }}>
                  <Mic size={28} />
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', fontWeight: 600 }}>A Voice of Comfort</h3>
                <p className="text-muted" style={{ lineHeight: 1.6 }}>Sometimes, you just need to hear a reassuring voice. Speak naturally about your day, your fears, or your dreams, and receive instant, loving guidance.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="glass-card"
              >
                <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.2), rgba(90, 24, 154, 0.1))', color: '#9d4edd', borderColor: 'rgba(157, 78, 221, 0.3)' }}>
                  <Heart size={28} />
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', fontWeight: 600 }}>Remembers Who You Are</h3>
                <p className="text-muted" style={{ lineHeight: 1.6 }}>You never have to start over. We remember your past joys, your struggles, and your journey, offering beautiful advice that grows with you over time.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="glass-card"
              >
                <div className="feature-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.2), rgba(0, 119, 182, 0.1))', color: '#00b4d8', borderColor: 'rgba(0, 180, 216, 0.3)' }}>
                  <Moon size={28} />
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', fontWeight: 600 }}>Profoundly Life-Changing</h3>
                <p className="text-muted" style={{ lineHeight: 1.6 }}>By aligning your unique birth chart with deep empathetic wisdom, you&apos;ll discover paths you never knew existed. Your beautiful future awaits.</p>
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
              <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Begin Your Journey of Healing</h2>
              <p className="text-muted mx-auto" style={{ maxWidth: '600px', fontSize: '1.1rem', lineHeight: 1.6 }}>
                Taking the first step toward self-discovery is beautiful and simple.
              </p>
            </motion.div>

            <div className="steps-container">
              {[
                { title: 'Share Your Story', desc: 'Tell us a little about when and where you were born. We use this to understand your unique soul blueprint.' },
                { title: 'Open Your Heart', desc: 'Choose to type or speak. Pour out your thoughts in a safe, completely private space.' },
                { title: 'Embrace The Light', desc: 'Receive deeply personalized, caring advice that helps you heal, grow, and step confidently into your future.' }
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
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 700 }}>You Deserve to Be Happy</h2>
              <p className="text-muted" style={{ fontSize: '1.2rem', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
                Give yourself the gift of clarity and peace of mind. Thousands have already found comfort in our sanctuary—and it costs less than your daily coffee.
              </p>
              <Link href="/sign-up" className="btn btn-primary pt-200" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem', background: 'linear-gradient(to right, #f39c12, #d35400)', border: 'none', color: 'white', boxShadow: '0 4px 20px rgba(243, 156, 18, 0.4)' }}>
                Start Your Healing Journey
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

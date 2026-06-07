"use client";

import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import '../astraeus.css';

export default function PrivacyPage() {
  useEffect(() => {
    document.body.classList.add('astraeus-active');
    return () => {
      document.body.classList.remove('astraeus-active');
    };
  }, []);

  return (
    <div className="theme-astraeus min-h-screen">
      <Navbar variant="legal" />
      <main className="container fade-in main-content" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
        <div className="glow-orb glow-orb-1" style={{ top: '20%', left: '10%' }}></div>
        <div className="glow-orb glow-orb-2" style={{ bottom: '20%', right: '10%' }}></div>

        <div className="glass-card" style={{ padding: 'clamp(1.5rem, 5vw, 3rem)', marginTop: '2rem' }}>
          <h1 className="hero-title text-gradient font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--on-bg-color) 20%, var(--tertiary) 80%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Privacy Policy
          </h1>
          
          <p className="text-on-surface-variant" style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2rem' }}>
            Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use Astraeus.
          </p>

          <hr style={{ border: '0', borderTop: '1px solid rgba(233,195,73,0.15)', margin: '2rem 0' }} />

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--tertiary)' }}>
            Information We Collect
          </h2>
          <ul className="text-on-surface-variant" style={{ paddingLeft: '1.25rem', marginBottom: '2rem', lineHeight: '1.8' }}>
            <li style={{ marginBottom: '0.5rem' }}>Personal data you provide when signing up, such as name and email address.</li>
            <li style={{ marginBottom: '0.5rem' }}>Interaction data from the AI chat and voice sessions stored securely for personalization.</li>
          </ul>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--tertiary)' }}>
            Data Security
          </h2>
          <p className="text-on-surface-variant" style={{ lineHeight: '1.7', marginBottom: '2rem' }}>
            We employ industry‑standard encryption, secure servers, and regular audits to protect your data. Access is limited to authorized personnel only.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--tertiary)' }}>
            Contact Us
          </h2>
          <p className="text-on-surface-variant" style={{ lineHeight: '1.7' }}>
            For any privacy‑related questions, please email us at{' '}
            <a href="mailto:karankumar8239@gmail.com" className="text-gradient font-semibold" style={{ textDecoration: 'underline', background: 'linear-gradient(135deg, var(--on-bg-color) 20%, var(--tertiary) 80%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              karankumar8239@gmail.com
            </a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

"use client";

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { MessageSquare } from 'lucide-react';

export default function Footer() {
  const { userId } = useAuth();

  return (
    <footer className="footer footer-custom">
      <div className="container footer-container">
        <div className="footer-grid">

          {/* Brand Block */}
          <div className="footer-brand-block">
            <div className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/logo.png" alt="Astraeus Logo" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
              <span>Astraeus</span>
            </div>
            <p className="footer-desc">
              Celestial Modernism for the seeking soul. Connect with the cosmos.
            </p>
            <div className="footer-copyright">
              © 2026 Astraeus Celestial Insights. Aligned with the Cosmos.
            </div>
          </div>

          {/* Column 2: Elements */}
          <div className="footer-links-block">
            <h4 className="footer-heading">The Elements</h4>
            <div className="footer-links">
              <Link href="#birth-chart">Fire Signs</Link>
              <Link href="#birth-chart">Earth Signs</Link>
              <Link href="#birth-chart">Air Signs</Link>
              <Link href="#birth-chart">Water Signs</Link>
            </div>
          </div>

          {/* Column 3: Legal */}
          <div className="footer-links-block">
            <h4 className="footer-heading">Legal</h4>
            <div className="footer-links">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms &amp; Conditions</Link>
              <Link href="/cancellation">Cancellation &amp; Refund Policy</Link>
              <a href="mailto:karankumar8239@gmail.com">Contact Us</a>
            </div>
          </div>

          {/* Column 4: Start Chat CTA */}
          <div className="footer-cta-block">
            <Link href={userId ? "/chat" : "/sign-up"} className="no-underline">
              <button className="glow-button-primary cursor-pointer">
                Start Chat
              </button>
            </Link>
          </div>

        </div>
      </div>

      {/* Faint constellation background */}
      <div className="footer-bg-glow">
        <img
          alt=""
          src="/logo.png"
        />
      </div>
    </footer>
  );
}

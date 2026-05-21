import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
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
            {/* Space left for alignment, mirroring original */}
          </div>
          
          <div>
            <h4 className="footer-heading">Platform</h4>
            <div className="footer-links">
              <Link href="/#features">Features</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/voice">Voice Agents</Link>
            </div>
          </div>
          
          <div>
            <h4 className="footer-heading">Legal</h4>
            <div className="footer-links">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms &amp; Conditions</Link>
              <Link href="/cancellation">Cancellation &amp; Refund Policy</Link>
              <a href="mailto:karankumar8239@gmail.com" className="text-muted" target="_blank" rel="noopener noreferrer">Contact Us</a>
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
  );
}

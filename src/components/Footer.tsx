"use client";

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

export default function Footer() {
  const { userId } = useAuth();

  return (
    <footer className="relative w-full border-t border-border bg-card py-16 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 relative z-10">

          {/* Brand Block */}
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xl font-bold text-foreground">
              <img src="/logo.png" alt="Astro AI Logo" className="w-6 h-6 object-contain" />
              <span>Astro AI</span>
            </div>
            <p className="text-sm text-foreground/50 leading-relaxed max-w-[280px]">
              Celestial Modernism for the seeking soul. Connect with the cosmos.
            </p>
            <div className="text-xs text-foreground/30 mt-2">
              © 2026 Astro AI.
            </div>
          </div>

          {/* Column 2: Explore */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-foreground/45">Explore</h4>
            <div className="flex flex-col gap-2">
              <Link href="/chat" className="text-sm text-foreground/60 hover:text-primary transition-colors">AI Chat</Link>
              <Link href="/chart" className="text-sm text-foreground/60 hover:text-primary transition-colors">Birth Chart</Link>
              <Link href="/voice" className="text-sm text-foreground/60 hover:text-primary transition-colors">Voice Reading</Link>
              <Link href="/pricing" className="text-sm text-foreground/60 hover:text-primary transition-colors">Pricing</Link>
            </div>
          </div>

          {/* Column 3: Legal */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-foreground/45">Legal</h4>
            <div className="flex flex-col gap-2">
              <Link href="/privacy" className="text-sm text-foreground/60 hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-foreground/60 hover:text-primary transition-colors">Terms &amp; Conditions</Link>
              <Link href="/cancellation" className="text-sm text-foreground/60 hover:text-primary transition-colors">Cancellation &amp; Refund</Link>
              <a href="mailto:karankumar8239@gmail.com" className="text-sm text-foreground/60 hover:text-primary transition-colors">Contact Us</a>
            </div>
          </div>

          {/* Column 4: CTA */}
          <div className="col-span-2 lg:col-span-1 flex items-start lg:justify-end">
            <Link href={userId ? "/chat" : "/sign-up"} className="inline-flex items-center justify-center py-3 px-6 bg-gradient-to-r from-primary to-[#b09038] text-white rounded-lg font-semibold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(200,150,44,0.3)] hover:shadow-[0_0_30px_rgba(200,150,44,0.5)] transition-all duration-300">
              Start Chat
            </Link>
          </div>

        </div>
      </div>

      {/* Faint constellation background */}
      <div className="absolute -bottom-20 -right-20 w-80 h-80 opacity-[0.04] select-none pointer-events-none">
        <img
          alt=""
          src="/logo.png"
          className="w-full h-full object-contain"
        />
      </div>
    </footer>
  );
}

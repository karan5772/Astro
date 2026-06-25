"use client";

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';

export default function Footer() {
  const { userId } = useAuth();

  return (
    <footer className="relative w-full border-t border-white/5 bg-[#0b0c10] py-16 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">

          {/* Brand Block */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xl font-bold text-white">
              <img src="/logo.png" alt="Astraeus Logo" className="w-6 h-6 object-contain" />
              <span>Astraeus</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-[280px]">
              Celestial Modernism for the seeking soul. Connect with the cosmos.
            </p>
            <div className="text-xs text-white/30 mt-4">
              © 2026 Astraeus Celestial Insights. Aligned with the Cosmos.
            </div>
          </div>

          {/* Column 2: Elements */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-primary">The Elements</h4>
            <div className="flex flex-col gap-2">
              <Link href="#birth-chart" className="text-sm text-white/60 hover:text-primary transition-colors">Fire Signs</Link>
              <Link href="#birth-chart" className="text-sm text-white/60 hover:text-primary transition-colors">Earth Signs</Link>
              <Link href="#birth-chart" className="text-sm text-white/60 hover:text-primary transition-colors">Air Signs</Link>
              <Link href="#birth-chart" className="text-sm text-white/60 hover:text-primary transition-colors">Water Signs</Link>
            </div>
          </div>

          {/* Column 3: Legal */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-primary">Legal</h4>
            <div className="flex flex-col gap-2">
              <Link href="/privacy" className="text-sm text-white/60 hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-sm text-white/60 hover:text-primary transition-colors">Terms &amp; Conditions</Link>
              <Link href="/cancellation" className="text-sm text-white/60 hover:text-primary transition-colors">Cancellation &amp; Refund Policy</Link>
              <a href="mailto:karankumar8239@gmail.com" className="text-sm text-white/60 hover:text-primary transition-colors">Contact Us</a>
            </div>
          </div>

          {/* Column 4: Start Chat CTA */}
          <div className="flex items-start md:justify-end">
            <Link href={userId ? "/chat" : "/sign-up"} className="inline-flex items-center justify-center py-3 px-6 bg-gradient-to-r from-primary to-[#4f46e5] text-white rounded-lg font-semibold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(109,93,251,0.3)] hover:shadow-[0_0_30px_rgba(109,93,251,0.5)] transition-all duration-300">
              Start Chat
            </Link>
          </div>

        </div>
      </div>

      {/* Faint constellation background */}
      <div className="absolute -bottom-20 -right-20 w-80 h-80 opacity-[0.03] select-none pointer-events-none">
        <img
          alt=""
          src="/logo.png"
          className="w-full h-full object-contain"
        />
      </div>
    </footer>
  );
}

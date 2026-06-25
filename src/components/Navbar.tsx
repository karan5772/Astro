"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserButton, useAuth } from '@clerk/nextjs';
import { Sparkles, Mic, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  variant?: 'landing' | 'dashboard' | 'pricing' | 'chat' | 'voice' | 'legal';
}

export default function Navbar({ variant = 'landing' }: NavbarProps) {
  const { userId } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (variant === 'landing') {
      const handleScroll = () => {
        setScrolled(window.scrollY > 50);
      };
      handleScroll();
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [variant]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isNavbarScrolled = variant === 'landing' ? scrolled : true;

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${isActive
        ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(109,93,251,0.15)]'
        : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
      }`;
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-500 ease-in-out ${isNavbarScrolled ? 'bg-[#050b1a]/85 backdrop-blur-md border-b border-[#e9c349]/15 shadow-2xl py-3 px-5 md:px-16' : 'bg-[#050b1a]/30 backdrop-blur-sm border-b border-white/5 py-4 px-5 md:px-16'}`}>
        <div className="w-full max-w-[1280px] flex justify-between items-center">
          <Link href="/" className="flex items-center text-2xl md:text-3xl font-extrabold tracking-tight text-white hover:text-primary transition-colors" onClick={closeMobileMenu}>
            <img src="/logo.png" alt="Astraeus Logo" className="w-8 h-8 object-contain mr-2" />
            <span>Astro.AI</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/chart" className={getLinkClass('/chart')}>Birth Chart</Link>
            <Link href="/chat" className={getLinkClass('/chat')}>Live Chat</Link>
            <Link href="/voice" className={getLinkClass('/voice')}>Voice</Link>
            <Link href="/pricing" className={getLinkClass('/pricing')}>Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            {(variant === 'chat' || variant === 'voice') && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-xs font-semibold text-primary" aria-label={variant === 'chat' ? 'Text reading' : 'Voice reading'}>
                {variant === 'chat' ? <Sparkles size={14} /> : <Mic size={14} />}
                <span>{variant === 'chat' ? 'Text' : 'Voice'}</span>
              </div>
            )}

            {userId ? (
              <Link href="/profile" className="hidden md:inline-flex items-center gap-2 border border-primary/30 bg-primary/10 hover:bg-primary/20 text-white rounded px-4 py-1.5 text-xs font-semibold transition-all shadow-[0_0_15px_rgba(109,93,251,0.2)]">
                <div className="mr-1">
                  <UserButton />
                </div>
                Profile
              </Link>
            ) : (
              <div className="flex items-center">
                <Link href="/sign-in" className="hidden md:block  border border-primary/30 bg-primary/10 hover:bg-primary/20 text-white rounded px-4 py-1.5 text-xs font-semibold transition-all shadow-[0_0_15px_rgba(109,93,251,0.2)]">
                  Sign In
                </Link>
              </div>
            )}
            <button className="md:hidden text-white/80 hover:text-white focus:outline-none" onClick={toggleMobileMenu} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown with slide transition */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[60px] left-0 right-0 bg-[#0c0d12]/98 border-b border-card-border p-6 flex flex-col gap-6 z-40 md:hidden shadow-2xl backdrop-blur-lg"
          >
            <div className="flex flex-col gap-4 text-center">
              <Link href="/chart" className="text-lg font-medium text-white/80 hover:text-primary transition-colors" onClick={closeMobileMenu}>Birth Chart</Link>
              <Link href="/chat" className="text-lg font-medium text-white/80 hover:text-primary transition-colors" onClick={closeMobileMenu}>Live Chat</Link>
              <Link href="/voice" className="text-lg font-medium text-white/80 hover:text-primary transition-colors" onClick={closeMobileMenu}>Voice</Link>
              <Link href="/pricing" className="text-lg font-medium text-white/80 hover:text-primary transition-colors" onClick={closeMobileMenu}>Pricing</Link>
              {userId && <Link href="/profile" className="text-lg font-medium text-white/80 hover:text-primary transition-colors" onClick={closeMobileMenu}>Profile</Link>}
            </div>

            <div className="flex flex-col gap-3 mt-2">
              {userId ? (
                <Link href="/profile" className="w-full text-center py-3 bg-gradient-to-r from-primary to-[#4f46e5] text-white rounded-lg font-semibold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(109,93,251,0.3)] hover:shadow-[0_0_30px_rgba(109,93,251,0.5)] transition-all duration-300" onClick={closeMobileMenu}>
                  Profile Settings
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="w-full text-center py-3 bg-secondary/80 border border-card-border hover:border-white/20 text-white rounded-lg font-semibold text-sm uppercase tracking-wider transition-all" onClick={closeMobileMenu}>
                    Sign In
                  </Link>
                  <Link href="/sign-up" className="w-full text-center py-3 bg-gradient-to-r from-primary to-[#4f46e5] text-white rounded-lg font-semibold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(109,93,251,0.3)] hover:shadow-[0_0_30px_rgba(109,93,251,0.5)] transition-all duration-300" onClick={closeMobileMenu}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

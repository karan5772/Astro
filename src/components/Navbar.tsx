"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserButton, useAuth } from '@clerk/nextjs';
import { Sparkles, Mic, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  variant?: 'landing' | 'dashboard' | 'pricing' | 'chat' | 'voice' | 'legal';
}

export default function Navbar({ variant = 'landing' }: NavbarProps) {
  const { userId } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <>
      <nav className={`navbar ${isNavbarScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link href="/" className="nav-brand" onClick={closeMobileMenu}>
            <img src="/logo.png" alt="Astraeus Logo" className="nav-brand-logo" />
            <span className="nav-logo">Astro.AI</span>
          </Link>

          <div className="nav-links">
            <Link href="/chart">Birth Chart</Link>
            <Link href="/chat">Live Chat</Link>
            <Link href="/voice">Voice</Link>
            <Link href="/pricing">Pricing</Link>
          </div>

          <div className="nav-actions">
            {(variant === 'chat' || variant === 'voice') && (
              <div className="nav-context-pill" aria-label={variant === 'chat' ? 'Text reading' : 'Voice reading'}>
                {variant === 'chat' ? <Sparkles size={14} /> : <Mic size={14} />}
                <span>{variant === 'chat' ? 'Text reading' : 'Voice reading'}</span>
              </div>
            )}

            {userId ? (
              <>
                <Link href="/chat" className="glow-button-nav">
                  Consult Stars
                </Link>
                <div className="nav-user-slot">
                  <UserButton />
                </div>
              </>
            ) : (
              <div className="nav-auth-links">
                <Link href="/sign-in" className="nav-signin-link desktop-only">
                  Sign In
                </Link>
                <Link href="/sign-up" className="glow-button-nav">
                  Consult Stars
                </Link>
              </div>
            )}

            <button className="menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
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
            className="mobile-menu open"
          >
            <div className="mobile-menu-links">
              <Link href="/chart" onClick={closeMobileMenu}>Birth Chart</Link>
              <Link href="/chat" onClick={closeMobileMenu}>Live Chat</Link>
              <Link href="/voice" onClick={closeMobileMenu}>Voice</Link>
              <Link href="/pricing" onClick={closeMobileMenu}>Pricing</Link>
            </div>

            <div className="mobile-menu-actions">
              {userId ? (
                <Link href="/chat" className="glow-button-primary mobile-cta" onClick={closeMobileMenu}>
                  Consult Stars
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="glow-button-secondary mobile-cta" onClick={closeMobileMenu}>
                    Sign In
                  </Link>
                  <Link href="/sign-up" className="glow-button-primary mobile-cta" onClick={closeMobileMenu}>
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

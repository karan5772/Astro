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
          <Link href="/" className="nav-brand" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <img src="/logo.png" alt="Astraeus Logo" style={{ height: '36px', width: '36px', objectFit: 'contain' }} />
            <span className="nav-logo">Astro.AI</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-links">
            <Link href="/chart">Birth Chart</Link>
            <Link href="/chat">Live Chat</Link>
            <Link href="/voice">Voice</Link>
            <Link href="/pricing">Pricing</Link>
          </div>

          {/* Right actions (Desktop and Mobile) */}
          <div className="nav-actions">
            {variant === 'chat' && (
              <div className="flex items-center gap-2" style={{ marginRight: '0.5rem' }}>
                <Sparkles className="text-primary" size={20} style={{ color: 'var(--tertiary)' }} />
                <span className="font-semibold text-sm-custom" style={{ color: 'var(--tertiary)' }}>Text Reading</span>
              </div>
            )}

            {variant === 'voice' && (
              <div className="flex items-center gap-2" style={{ marginRight: '0.5rem' }}>
                <Mic size={20} style={{ color: 'var(--tertiary)' }} />
                <span className="font-semibold text-sm-custom" style={{ color: 'var(--tertiary)' }}>
                  PRO TIER
                </span>
              </div>
            )}

            {userId ? (
              <>
                <Link
                  href="/chat"
                  className="glow-button-nav"
                  style={{ textDecoration: 'none' }}
                >
                  Consult Stars
                </Link>
                <div className="flex items-center">
                  <UserButton />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <Link
                    href="/sign-in"
                    className="text-on-surface-variant hover:text-tertiary transition-colors font-label-caps desktop-only"
                    style={{ textDecoration: 'none', fontSize: '12px' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="glow-button-nav"
                    style={{ textDecoration: 'none' }}
                  >
                    Consult Stars
                  </Link>
                </div>
              </>
            )}

            <button
              className="menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
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
                <Link
                  href="/chat"
                  className="btn btn-primary"
                  onClick={closeMobileMenu}
                  style={{
                    display: 'flex',
                    width: '100%',
                    background: 'linear-gradient(135deg, var(--tertiary), #b89a38)',
                    color: 'var(--on-tertiary)',
                    border: 'none',
                    justifyContent: 'center',
                    fontWeight: 600
                  }}
                >
                  Consult Stars
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="btn btn-outline" onClick={closeMobileMenu} style={{ display: 'flex', width: '100%' }}>
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="btn btn-primary"
                    onClick={closeMobileMenu}
                    style={{
                      display: 'flex',
                      width: '100%',
                      background: 'linear-gradient(135deg, var(--tertiary), #b89a38)',
                      color: 'var(--on-tertiary)',
                      border: 'none',
                      justifyContent: 'center',
                      fontWeight: 600
                    }}
                  >
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

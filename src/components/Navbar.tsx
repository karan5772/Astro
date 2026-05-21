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

  const isBackVariant = variant === 'chat' || variant === 'voice';
  const isNavbarScrolled = variant === 'landing' ? scrolled : true;

  return (
    <>
      <nav className={`navbar ${isNavbarScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          {isBackVariant ? (
            <Link href="/dashboard" className="nav-brand text-muted" style={{ fontSize: '1rem', fontWeight: '500' }}>
              &larr; Back to Dashboard
            </Link>
          ) : (
            <Link href="/" className="nav-brand" onClick={closeMobileMenu}>
              <Sparkles className="text-primary" size={24} />
              <span>Astro AI</span>
            </Link>
          )}

          {/* Desktop Nav Links */}
          {variant === 'landing' && (
            <div className="nav-links">
              <Link href="#features">Features</Link>
              <Link href="#how-it-works">How it Works</Link>
              <Link href="/pricing">Pricing</Link>
            </div>
          )}

          {variant === 'pricing' && (
            <div className="nav-links">
              <Link href="/dashboard">Dashboard</Link>
            </div>
          )}

          {variant === 'legal' && (
            <div className="nav-links">
              <Link href="/">Home</Link>
              <Link href="/pricing">Pricing</Link>
              {userId && <Link href="/dashboard">Dashboard</Link>}
            </div>
          )}

          {/* Right actions (Desktop and Mobile) */}
          <div className="nav-actions">
            {variant === 'chat' && (
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary" size={20} />
                <span className="font-semibold text-sm md:text-base">Text Reading</span>
              </div>
            )}

            {variant === 'voice' && (
              <div className="flex items-center gap-2">
                <Mic className="text-yellow-500" size={20} />
                <span className="font-semibold text-yellow-500 text-sm md:text-base" style={{ color: "#f39c12" }}>
                  PRO TIER
                </span>
              </div>
            )}

            {!isBackVariant && (
              <>
                {userId ? (
                  <>
                    {variant === 'landing' && (
                      <Link href="/dashboard" className="btn btn-outline desktop-only" style={{ padding: '0.5rem 1rem' }}>
                        Dashboard
                      </Link>
                    )}
                    {variant === 'legal' && (
                      <Link href="/dashboard" className="btn btn-outline desktop-only" style={{ padding: '0.5rem 1rem' }}>
                        Dashboard
                      </Link>
                    )}
                    <div className="flex items-center">
                      <UserButton />
                    </div>
                  </>
                ) : (
                  <>
                    {(variant === 'landing' || variant === 'legal') && (
                      <div className="flex gap-2 desktop-only">
                        <Link href="/sign-in" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Sign In</Link>
                        <Link href="/sign-up" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Get Started</Link>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {(variant === 'landing' || variant === 'legal') && (
              <button 
                className="menu-toggle" 
                onClick={toggleMobileMenu} 
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
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
              {variant === 'landing' && (
                <>
                  <Link href="#features" onClick={closeMobileMenu}>Features</Link>
                  <Link href="#how-it-works" onClick={closeMobileMenu}>How it Works</Link>
                  <Link href="/pricing" onClick={closeMobileMenu}>Pricing</Link>
                </>
              )}
              {variant === 'legal' && (
                <>
                  <Link href="/" onClick={closeMobileMenu}>Home</Link>
                  <Link href="/pricing" onClick={closeMobileMenu}>Pricing</Link>
                </>
              )}
            </div>

            <div className="mobile-menu-actions">
              {userId ? (
                <Link href="/dashboard" className="btn btn-outline" onClick={closeMobileMenu} style={{ display: 'flex', width: '100%' }}>
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="btn btn-outline" onClick={closeMobileMenu} style={{ display: 'flex', width: '100%' }}>
                    Sign In
                  </Link>
                  <Link href="/sign-up" className="btn btn-primary" onClick={closeMobileMenu} style={{ display: 'flex', width: '100%' }}>
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

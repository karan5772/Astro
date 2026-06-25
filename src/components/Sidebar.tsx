"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import {
  BarChart3,
  MessageCircle,
  Mic,
  CreditCard,
  Home,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chart', label: 'Birth Chart', icon: BarChart3 },
  { href: '/chat', label: 'Live Chat', icon: MessageCircle },
  { href: '/voice', label: 'Voice', icon: Mic },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
  { href: '/profile', label: 'Profile', icon: User },
];

type SidebarMode = 'home' | 'chart' | 'chat' | 'voice' | 'pricing' | 'profile' | 'other';

const MODE_META: Record<SidebarMode, {
  label: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}> = {
  home: {
    label: 'Explore',
    description: 'Jump between the main product surfaces or open a reading.',
    primaryHref: '/chat',
    primaryLabel: 'Open Chat',
    secondaryHref: '/chart',
    secondaryLabel: 'View Chart',
  },
  chart: {
    label: 'Chart Mode',
    description: 'Dial in birth data, then generate and review the natal chart.',
    primaryHref: '#chart-workbench',
    primaryLabel: 'Chart Dock',
    secondaryHref: '/chat',
    secondaryLabel: 'Ask About It',
  },
  chat: {
    label: 'Chat Mode',
    description: 'Use the text console for quick questions and deeper follow-ups.',
    primaryHref: '#chat-composer',
    primaryLabel: 'Compose',
    secondaryHref: '/pricing',
    secondaryLabel: 'Unlock Voice',
  },
  voice: {
    label: 'Voice Mode',
    description: 'Start a live session and keep the audio console focused.',
    primaryHref: '#voice-control',
    primaryLabel: 'Session Dock',
    secondaryHref: '/pricing',
    secondaryLabel: 'Check Plans',
  },
  pricing: {
    label: 'Billing',
    description: 'Choose the pass that matches how deep you want to go.',
    primaryHref: '/chat',
    primaryLabel: 'Open Chat',
    secondaryHref: '/voice',
    secondaryLabel: 'Voice Room',
  },
  profile: {
    label: 'Profile',
    description: 'Manage birth details, view predictions, and check subscription.',
    primaryHref: '/chart',
    primaryLabel: 'View Chart',
    secondaryHref: '/chat',
    secondaryLabel: 'Ask AI',
  },
  other: {
    label: 'Astro AI',
    description: 'Navigate the product and open the most useful surface.',
    primaryHref: '/chat',
    primaryLabel: 'Open Chat',
  },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { userId } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const mode: SidebarMode = pathname === '/'
    ? 'home'
    : pathname.startsWith('/chart')
      ? 'chart'
      : pathname.startsWith('/chat')
        ? 'chat'
        : pathname.startsWith('/voice')
          ? 'voice'
          : pathname.startsWith('/pricing')
            ? 'pricing'
            : pathname.startsWith('/profile')
              ? 'profile'
              : 'other';

  const modeMeta = MODE_META[mode];
  const withAnchor = (href: string) => (href.startsWith('#') ? `${pathname}${href}` : href);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="sidebar-mobile-bar">
        <Link href="/" className="sidebar-mobile-brand">
          <img src="/logo.png" alt="Astraeus Logo" className="sidebar-mobile-logo" />
          <span className="nav-logo">Astro.AI</span>
        </Link>
        <button
          className="sidebar-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle sidebar"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <Link href="/" className="sidebar-brand-link">
            <img src="/logo.png" alt="Astraeus Logo" className="sidebar-logo-img" />
            {!collapsed && (
              <motion.span
                className="sidebar-brand-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                Astro.AI
              </motion.span>
            )}
          </Link>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="sidebar-mode-card">
          <span className="sidebar-mode-label">{modeMeta.label}</span>
          {!collapsed && <p className="sidebar-mode-copy">{modeMeta.description}</p>}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="sidebar-nav-list">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`sidebar-nav-link ${active ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="sidebar-nav-icon">
                      <Icon size={20} />
                    </span>
                    {!collapsed && (
                      <span className="sidebar-nav-label">{item.label}</span>
                    )}
                    {active && !collapsed && (
                      <motion.span
                        className="sidebar-active-dot"
                        layoutId="sidebar-active"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="sidebar-bottom">
          {!collapsed && (
            <div className="sidebar-quick-actions">
              <Link href={withAnchor(modeMeta.primaryHref)} className="sidebar-quick-action">
                {modeMeta.primaryLabel}
              </Link>
              {modeMeta.secondaryHref && modeMeta.secondaryLabel && (
                <Link href={withAnchor(modeMeta.secondaryHref)} className="sidebar-quick-action secondary">
                  {modeMeta.secondaryLabel}
                </Link>
              )}
            </div>
          )}

          {userId ? (
            <Link href="/profile" className="sidebar-user-section" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', textDecoration: 'none', color: 'var(--on-surface)' }}>

              {!collapsed && (
                <motion.span
                  className="sidebar-user-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <div style={{ marginRight: '0.5rem' }}>
                    <UserButton />
                  </div>
                  Profile
                </motion.span>
              )}
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="sidebar-cta-btn"
              title={collapsed ? 'Consult Stars' : undefined}
            >
              <Sparkles size={18} />
              {!collapsed && <span>Consult Stars</span>}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

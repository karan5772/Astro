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
];

type SidebarMode = 'home' | 'chart' | 'chat' | 'voice' | 'pricing' | 'other';

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
            : 'other';

  const modeMeta = MODE_META[mode];
  const withAnchor = (href: string) => (href.startsWith('#') ? `${pathname}${href}` : href);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex lg:hidden items-center justify-between px-6 py-4 bg-[#0a0c10] border-b border-card-border fixed top-0 left-0 right-0 z-40 h-[64px]">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <img src="/logo.png" alt="Astraeus Logo" className="w-6 h-6 object-contain" />
          <span className="font-bold">Astro.AI</span>
        </Link>
        <button
          className="text-white/80 hover:text-white focus:outline-none"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0f1115]/98 border-r border-card-border backdrop-blur-md transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[280px]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} h-full pt-16 lg:pt-0`}>
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 text-lg font-bold text-white">
            <img src="/logo.png" alt="Astraeus Logo" className="w-7 h-7 object-contain" />
            {!collapsed && (
              <motion.span
                className="text-lg font-extrabold tracking-tight"
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
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md bg-[#18181b] border border-card-border text-white/60 hover:text-white hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="mx-4 my-4 p-4 rounded-lg bg-[#18181b]/50 border border-card-border">
          <span className="text-xs uppercase tracking-wider font-semibold text-primary block mb-1">{modeMeta.label}</span>
          {!collapsed && <p className="text-xs text-white/50 leading-relaxed">{modeMeta.description}</p>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all relative ${active ? 'bg-primary/10 text-primary hover:text-primary hover:bg-primary/15' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="flex items-center justify-center w-5 h-5">
                      <Icon size={20} />
                    </span>
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                    {active && !collapsed && (
                      <motion.span
                        className="absolute right-4 w-1.5 h-1.5 rounded-full bg-primary"
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
        <div className="p-4 border-t border-white/5 flex flex-col gap-4 bg-[#0f1115]/98">
          {!collapsed && (
            <div className="flex flex-col gap-2">
              <Link href={withAnchor(modeMeta.primaryHref)} className="w-full text-center py-2 px-3 bg-gradient-to-r from-primary to-[#4f46e5] text-white rounded-lg font-semibold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(109,93,251,0.2)] hover:shadow-[0_0_25px_rgba(109,93,251,0.4)] transition-all duration-300">
                {modeMeta.primaryLabel}
              </Link>
              {modeMeta.secondaryHref && modeMeta.secondaryLabel && (
                <Link href={withAnchor(modeMeta.secondaryHref)} className="w-full text-center py-2 px-3 bg-[#18181b] border border-card-border hover:border-white/10 text-white rounded-lg font-semibold text-xs uppercase tracking-wider transition-all">
                  {modeMeta.secondaryLabel}
                </Link>
              )}
            </div>
          )}

          {userId ? (
            <Link href="/profile" className="flex items-center gap-3 p-3 rounded-lg bg-[#18181b]/50 border border-card-border hover:border-primary/30 transition-all text-white/90 hover:text-white" style={{ textDecoration: 'none' }}>
              <div className="flex items-center gap-2">
                <UserButton />
                {!collapsed && (
                  <motion.span
                    className="text-sm font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    Profile
                  </motion.span>
                )}
              </div>
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-sm font-bold transition-all shadow-[0_0_15px_rgba(109,93,251,0.1)]"
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

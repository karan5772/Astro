"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import {
  Home,
  BarChart3,
  MessageCircle,
  Mic,
  CreditCard,
  Search,
  Sparkles,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const MAIN_NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chart', label: 'Birth Chart', icon: BarChart3 },
  { href: '/chat', label: 'Live Chat', icon: MessageCircle },
  { href: '/voice', label: 'Voice', icon: Mic },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userId } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Fetch plan tier and payments
  useEffect(() => {
    if (userId) {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => setDbUser(data))
        .catch(err => console.error("Error fetching user plan details:", err));
    }
  }, [userId]);

  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(newState));
      window.dispatchEvent(new Event('sidebar-collapse-change'));
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const getPlanLabel = () => {
    if (!dbUser) return 'Free Plan';
    if (dbUser.isPro) return 'Pro Member';
    if (dbUser.payments && dbUser.payments.length > 0) {
      const latestPass = dbUser.payments[0];
      return `${latestPass.durationInMinutes}m Pass`;
    }
    return 'Free Tier';
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex lg:hidden items-center justify-between px-6 py-4 bg-white dark:bg-[#0c0d12] border-b border-gray-200 dark:border-white/5 fixed top-0 left-0 right-0 z-40 h-[64px]">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-black dark:text-white">
          <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          <span className="font-bold">Astro.AI</span>
        </Link>
        <button
          className="text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white focus:outline-none"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle sidebar"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-[#0c0d12] border-r border-gray-200 dark:border-white/5 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'
          } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} h-full pt-16 lg:pt-0`}
      >
        {/* Brand Header - Centers expand button when collapsed, hides logo */}
        <div className={`flex items-center border-b border-gray-100 dark:border-white/5 px-5 py-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <Link href="/" className="flex items-center gap-2">
                <div className=" rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <img src="/logo.png" alt="Astraeus Logo" className="w-7 h-7 object-contain" />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                  Astro AI
                </span>
              </Link>

              {userId && (
                <div className="scale-75 origin-left">
                  <UserButton />
                </div>
              )}
            </div>
          ) : null}

          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle collapse"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-grow px-2.5 overflow-y-auto py-4">
          <ul className="flex flex-col gap-1 list-none p-0 m-0">
            {MAIN_NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${active
                      ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium'
                      : 'text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className={active ? 'text-primary' : 'text-gray-400 dark:text-white/40'} />
                    {!collapsed && <span className="text-xs">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Profile & Plan details */}
        {userId && (
          <div className="p-4  border-gray-100 dark:border-white/5">
            <Link
              href="/profile"
              className={`flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-[#18181b]/50 border border-gray-150 dark:border-white/5 hover:border-primary/30 transition-all text-gray-800 dark:text-white/90 hover:text-gray-900 dark:hover:text-white ${collapsed ? 'justify-center' : ''
                }`}
              style={{ textDecoration: 'none' }}
            >
              <div className="flex items-center gap-2">
                <UserButton />
                {!collapsed && (
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold">Profile</span>
                    <span className="text-[9px] text-gray-400 dark:text-white/45 font-medium mt-0.5 leading-none">
                      {getPlanLabel()}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

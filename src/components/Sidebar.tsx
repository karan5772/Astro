"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';
import {
  Home,
  BarChart3,
  MessageCircle,
  Mic,
  CreditCard,
  Sparkles,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { chatStorage, type ConversationMeta } from '@/lib/chat-storage';
import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

const MAIN_NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chart', label: 'Birth Chart', icon: BarChart3 },
  { href: '/chat', label: 'Live Chat', icon: MessageCircle },
  { href: '/voice', label: 'Voice', icon: Mic },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
];

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userId } = useAuth();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);

  // Conversation list (only used on /chat)
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const isOnChat = pathname.startsWith('/chat');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    }
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (userId) {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => setDbUser(data))
        .catch(err => console.error('Error fetching user plan details:', err));
    }
  }, [userId]);

  // Load conversations on all pages
  useEffect(() => {
    chatStorage.listConversations().then(setConversations);
  }, []);

  // Re-read list when chat page signals a change
  useEffect(() => {
    const handler = (e: Event) => {
      chatStorage.listConversations().then(setConversations);
      const detail = (e as CustomEvent).detail;
      if (detail?.activeId !== undefined) setActiveConvId(detail.activeId);
    };
    window.addEventListener('chat:list-changed', handler);
    return () => window.removeEventListener('chat:list-changed', handler);
  }, []);

  // Sync active conversation from chat page
  useEffect(() => {
    const handler = (e: Event) => setActiveConvId((e as CustomEvent).detail?.id ?? null);
    window.addEventListener('chat:active-changed', handler);
    return () => window.removeEventListener('chat:active-changed', handler);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(next));
      window.dispatchEvent(new Event('sidebar-collapse-change'));
    }
  };

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  const getPlanLabel = () => {
    if (!dbUser) return 'Free Plan';
    if (dbUser.isPro) return 'Pro Member';
    if (dbUser.payments?.length > 0) return `${dbUser.payments[0].durationInMinutes}m Pass`;
    return 'Free Tier';
  };

  const handleNewConversation = () => {
    if (!isOnChat) {
      router.push('/chat');
      return;
    }
    setActiveConvId(null);
    window.dispatchEvent(new CustomEvent('sidebar:new'));
  };

  const handleSwitchConversation = (id: string) => {
    setActiveConvId(id);
    if (!isOnChat) {
      localStorage.setItem('sidebar:pending-conv', id);
      router.push('/chat');
      setMobileOpen(false);
      return;
    }
    window.dispatchEvent(new CustomEvent('sidebar:switch', { detail: { id } }));
    setMobileOpen(false);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await chatStorage.deleteConversation(id);
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    if (activeConvId === id) {
      const next = updated[0] ?? null;
      setActiveConvId(next?.id ?? null);
      window.dispatchEvent(new CustomEvent('sidebar:switch', { detail: { id: next?.id ?? null } }));
    }
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex lg:hidden items-center justify-between px-6 py-4 bg-sidebar border-b border-sidebar-border fixed top-0 left-0 right-0 z-40 h-[64px]">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          <span className="font-bold">Astro.AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-border text-foreground/55 hover:text-foreground hover:bg-foreground/8 transition-all cursor-pointer"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            className="text-foreground/80 hover:text-foreground focus:outline-none"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle sidebar"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} h-full pt-16 lg:pt-0`}
      >
        {/* Brand Header */}
        <div className={`flex items-center border-b border-sidebar-border px-5 py-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <img src="/logo.png" alt="Astraeus Logo" className="w-7 h-7 object-contain" />
              </div>
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight">Astro AI</span>
            </Link>
          )}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md bg-sidebar-accent/60 border border-sidebar-border text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors cursor-pointer"
            aria-label="Toggle collapse"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-2.5 py-4 shrink-0">
          <ul className="flex flex-col gap-1 list-none p-0 m-0">
            {MAIN_NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      active
                        ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className={active ? 'text-primary' : 'text-sidebar-foreground/40'} />
                    {!collapsed && <span className="text-xs">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Readings section ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 border-t border-sidebar-border">
            {/* Section header + New button */}
            <div className={`flex items-center px-3 pt-3 pb-2 shrink-0 ${collapsed ? 'justify-center' : 'justify-between'}`}>
              {!collapsed && (
                <span className="text-[10px] uppercase tracking-widest font-bold text-sidebar-foreground/25">
                  Readings
                </span>
              )}
              <button
                onClick={handleNewConversation}
                title="New Reading"
                className="flex items-center justify-center w-6 h-6 rounded-md bg-sidebar-accent border border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all cursor-pointer"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {conversations.length === 0 ? (
                !collapsed && (
                  <p className="text-[11px] text-sidebar-foreground/25 text-center mt-4 px-2">
                    No readings yet
                  </p>
                )
              ) : (
                conversations.map(conv => {
                  const active = activeConvId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSwitchConversation(conv.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSwitchConversation(conv.id)}
                      title={collapsed ? conv.title : undefined}
                      className={`group w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 transition-all relative cursor-pointer ${
                        active
                          ? 'bg-primary/10 dark:bg-primary/12'
                          : 'hover:bg-sidebar-accent/60'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" />
                      )}

                      <MessageSquare
                        size={13}
                        className={`shrink-0 ${active ? 'text-primary' : 'text-sidebar-foreground/25'}`}
                      />

                      {!collapsed && (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[12px] font-medium truncate ${active ? 'text-primary' : 'text-sidebar-foreground/80'}`}>
                              {conv.title}
                            </p>
                            <p className="text-[10px] text-sidebar-foreground/25 mt-0.5 leading-none">
                              {relativeTime(conv.updatedAt)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-400 text-sidebar-foreground/30 cursor-pointer shrink-0"
                          >
                            <Trash2 size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        {/* ──────────────────────────────────────────────────────────────── */}

        {/* Theme toggle row */}
        <div className={`px-4 py-2.5 border-t border-border shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={toggle}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-foreground/50 hover:text-foreground hover:bg-foreground/[0.05] transition-all cursor-pointer w-full ${collapsed ? 'justify-center w-auto' : ''}`}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={collapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
          >
            {theme === 'dark' ? <Sun size={15} className="shrink-0" /> : <Moon size={15} className="shrink-0" />}
            {!collapsed && (
              <span className="text-xs font-medium">
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </span>
            )}
          </button>
        </div>

        {/* Bottom Profile */}
        {userId && (
          <div className="p-4 border-t border-border shrink-0">
            <Link
              href="/profile"
              className={`flex items-center gap-3 p-2.5 rounded-xl bg-sidebar-accent/50 border border-sidebar-border hover:border-primary/30 transition-all text-sidebar-foreground/90 hover:text-sidebar-foreground ${
                collapsed ? 'justify-center' : ''
              }`}
              style={{ textDecoration: 'none' }}
            >
              <div className="flex items-center gap-2">
                <UserButton />
                {!collapsed && (
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold">Profile</span>
                    <span className="text-[9px] text-sidebar-foreground/40 font-medium mt-0.5 leading-none">
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

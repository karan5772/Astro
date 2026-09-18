'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Users, Crown, UserPlus, MessageCircle, Sparkles, Mic, IndianRupee,
  AlertTriangle, CheckCircle2, Search, RefreshCw, ArrowLeft,
} from 'lucide-react';

/**
 * Charts here use a single data hue rather than a categorical palette: every
 * series answers "how many", so identity never needs encoding by colour. The
 * hue is the brand gold re-stepped to #c8822f, which sits inside the dark-mode
 * lightness band and clears 3:1 against the page surface. Status colours stay
 * reserved for good/bad and always ship with a word beside them.
 */
const DATA_HUE = '#c8822f';
const GOOD = '#4ade80';
const BAD = '#f87171';

// ── Types mirroring the admin API ────────────────────────────────────────────

type Stats = {
  totalUsers: number; proUsers: number; newTodayUsers: number;
  totalMessages: number; birthChartsGenerated: number;
  trialLimitHits: number; voiceSessions: number;
  totalRevenueUsd: number; totalRevenueInr: number;
};
type Funnel = {
  signedUp: number; enteredBirthDetails: number; sentAMessage: number;
  usedAllFree: number; paid: number;
};
type Checkout = { ordersCreated: number; paymentsCompleted: number; completionRate: number | null };
type AdminUser = {
  _id: string; email: string; firstName?: string; lastName?: string; isPro: boolean;
  messageCount: number; totalChatMessages: number; voiceBalanceInSeconds: number;
  voiceSessionCount: number; lastActiveAt: string | null; createdAt: string | null;
};
type AdminPayment = {
  _id: string; clerkId: string; paymentId: string; plan?: string;
  amount?: number; amountInr?: number; durationInMinutes?: number;
  messagesGranted?: number; source?: string; createdAt: string | null;
};
type AdminEvent = {
  _id: string; clerkId: string; type: string;
  metadata?: Record<string, unknown>; createdAt: string | null;
};
type StatsResponse = {
  stats: Stats; funnel: Funnel; checkout: Checkout; freeMessageLimit: number;
  eventCounts: Record<string, number>;
  recentUsers: AdminUser[]; recentPayments: AdminPayment[]; recentEvents: AdminEvent[];
};
type Point = {
  date: string; signups: number; payments: number;
  revenueUsd: number; messages: number; orders: number;
};

// ── Formatting ───────────────────────────────────────────────────────────────

const nf = new Intl.NumberFormat('en-IN');
const dayLabel = (iso: string) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function ago(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '—';
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString('en-GB');
}

// ── Pieces ───────────────────────────────────────────────────────────────────

function Tile({
  icon: Icon, label, value, sub, tone,
}: {
  icon: typeof Users; label: string; value: string; sub?: string;
  tone?: 'good' | 'bad';
}) {
  const toneColor = tone === 'good' ? GOOD : tone === 'bad' ? BAD : undefined;
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} className="text-foreground/35" />
        <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-semibold">{label}</p>
      </div>
      <p className="text-2xl font-semibold tabular-nums" style={toneColor ? { color: toneColor } : undefined}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-foreground/40 mt-1 leading-snug">{sub}</p>}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[11px] uppercase tracking-widest font-semibold text-foreground/45">{title}</h2>
        {hint && <p className="text-[11px] text-foreground/30">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Daily bars. One series, so no legend — the section title names it. Only the
 * peak and the last day are labelled; a number on every bar is noise.
 */
function DailyBars({ points, field, unit }: { points: Point[]; field: keyof Point; unit: string }) {
  const values = points.map(p => Number(p[field]) || 0);
  const peak = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);
  const peakIndex = values.indexOf(Math.max(...values));

  if (total === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <p className="text-sm text-foreground/40">No {unit} in this window yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-end gap-[2px] h-[120px]" role="img"
           aria-label={`${unit} per day, peak ${peak} on ${dayLabel(points[peakIndex].date)}`}>
        {points.map((p, i) => {
          const v = values[i];
          // A zero day still needs a visible baseline tick, or the axis lies.
          const h = v === 0 ? 2 : Math.max(4, Math.round((v / peak) * 118));
          const isPeak = i === peakIndex && v > 0;
          return (
            <div key={p.date} className="flex-1 min-w-0 flex items-end group relative">
              <div
                className="w-full rounded-t-[3px] transition-opacity group-hover:opacity-100"
                style={{
                  height: h,
                  background: v === 0 ? 'rgba(237,237,237,0.10)' : DATA_HUE,
                  opacity: v === 0 ? 1 : isPeak ? 1 : 0.72,
                }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-background border border-border rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
                  <p className="text-[11px] font-semibold tabular-nums">{nf.format(v)} {unit}</p>
                  <p className="text-[10px] text-foreground/45">{dayLabel(p.date)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-foreground/30 tabular-nums">
        <span>{dayLabel(points[0].date)}</span>
        <span>peak {nf.format(peak)} · {nf.format(total)} total</span>
        <span>{dayLabel(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}

/** Funnel as horizontal bars, each labelled with its count and drop-off. */
function FunnelBars({ funnel, freeLimit }: { funnel: Funnel; freeLimit: number }) {
  const steps = [
    { label: 'Signed up', value: funnel.signedUp },
    { label: 'Entered birth details', value: funnel.enteredBirthDetails },
    { label: 'Sent a message', value: funnel.sentAMessage },
    { label: `Used all ${freeLimit} free`, value: funnel.usedAllFree },
    { label: 'Paid', value: funnel.paid },
  ];
  const top = Math.max(funnel.signedUp, 1);

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
      {steps.map((s, i) => {
        const pct = (s.value / top) * 100;
        const prev = i === 0 ? null : steps[i - 1].value;
        const dropped = prev !== null && prev > 0 ? prev - s.value : 0;
        return (
          <div key={s.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[12px] text-foreground/70">{s.label}</span>
              <span className="text-[12px] font-semibold tabular-nums">
                {nf.format(s.value)}
                <span className="text-foreground/35 font-normal"> · {pct.toFixed(0)}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-foreground/[0.06] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 1)}%`, background: DATA_HUE }} />
            </div>
            {dropped > 0 && (
              <p className="text-[10px] text-foreground/30">
                {nf.format(dropped)} dropped off here
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Event-type counts, biggest first. */
function EventBreakdown({ counts }: { counts: Record<string, number> }) {
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) {
    return <div className="bg-card border border-border rounded-xl p-6 text-center text-sm text-foreground/40">No events yet.</div>;
  }
  const top = rows[0][1] || 1;
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2.5">
      {rows.map(([type, n]) => (
        <div key={type} className="flex items-center gap-3">
          <span className="text-[11px] text-foreground/60 w-[180px] shrink-0 truncate font-mono">{type}</span>
          <div className="flex-1 h-2 rounded-full bg-foreground/[0.06] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.max((n / top) * 100, 1)}%`, background: DATA_HUE }} />
          </div>
          <span className="text-[11px] font-semibold tabular-nums w-14 text-right">{nf.format(n)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [points, setPoints] = useState<Point[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Loading is derived: whatever window we last finished loading versus the one
  // currently selected. Nothing has to be written at the top of the effect.
  const [loadedDays, setLoadedDays] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/admin/stats').then(r => (r.ok ? r.json() : Promise.reject(new Error(`stats ${r.status}`)))),
      fetch(`/api/admin/stats/timeseries?days=${days}`).then(r => (r.ok ? r.json() : Promise.reject(new Error(`timeseries ${r.status}`)))),
    ])
      .then(([stats, ts]) => {
        if (cancelled) return;
        setData(stats);
        setPoints(ts.series);
        setError(null);
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoadedDays(days); });
    return () => { cancelled = true; };
  }, [days]);

  const users = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.recentUsers;
    return data.recentUsers.filter(u =>
      [u.email, u.firstName, u.lastName].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [data, query]);

  const loading = loadedDays !== days;

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <RefreshCw size={22} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <div className="max-w-sm text-center flex flex-col items-center gap-4">
          <AlertTriangle size={26} className="text-foreground/40" />
          <p className="text-sm text-foreground/60">Could not load the dashboard.</p>
          <p className="text-[11px] font-mono text-foreground/30">{error}</p>
          <button onClick={() => location.reload()}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium cursor-pointer">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { stats, funnel, checkout, eventCounts, recentPayments, recentEvents, freeMessageLimit } = data;
  const completion = checkout.completionRate;
  const checkoutLooksBroken = completion !== null && checkout.ordersCreated >= 5 && completion < 0.35;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-[1180px] mx-auto px-5 py-8 flex flex-col gap-10">

        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/" className="text-[11px] text-foreground/35 hover:text-foreground/60 inline-flex items-center gap-1.5 mb-2 transition-colors">
              <ArrowLeft size={11} /> Back to app
            </Link>
            <h1 className="text-xl font-semibold tracking-tight">Astro AI admin</h1>
          </div>
          <div className="flex items-center gap-2">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors cursor-pointer ${
                  days === d ? 'bg-foreground/[0.08] border-border text-foreground'
                             : 'border-transparent text-foreground/40 hover:text-foreground/70'}`}>
                {d}d
              </button>
            ))}
          </div>
        </header>

        {/* Checkout health leads, because a broken one makes every other number moot. */}
        {completion !== null && (
          <div className={`rounded-xl border p-4 flex flex-wrap items-center gap-x-6 gap-y-3 ${
            checkoutLooksBroken ? 'border-[#f87171]/35 bg-[#f87171]/[0.06]' : 'border-border bg-card'}`}>
            {checkoutLooksBroken
              ? <AlertTriangle size={16} style={{ color: BAD }} className="shrink-0" />
              : <CheckCircle2 size={16} style={{ color: GOOD }} className="shrink-0" />}
            <div className="flex-1 min-w-[220px]">
              <p className="text-[11px] uppercase tracking-widest text-foreground/40 font-semibold mb-1">Checkout health</p>
              <p className="text-sm text-foreground/70">
                <b className="text-foreground tabular-nums">{nf.format(checkout.ordersCreated)}</b> orders opened,{' '}
                <b className="text-foreground tabular-nums">{nf.format(checkout.paymentsCompleted)}</b> completed
                {checkoutLooksBroken && ' — most people who tried to pay could not.'}
              </p>
            </div>
            <p className="text-2xl font-semibold tabular-nums"
               style={{ color: checkoutLooksBroken ? BAD : GOOD }}>
              {(completion * 100).toFixed(0)}%
            </p>
          </div>
        )}

        <Section title="At a glance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile icon={Users} label="Users" value={nf.format(stats.totalUsers)} sub={`${nf.format(stats.newTodayUsers)} today`} />
            <Tile icon={Crown} label="With balance" value={nf.format(stats.proUsers)} />
            <Tile icon={Sparkles} label="Charts built" value={nf.format(stats.birthChartsGenerated)} />
            <Tile icon={MessageCircle} label="Messages" value={nf.format(stats.totalMessages)} />
            <Tile icon={UserPlus} label="Hit free limit" value={nf.format(stats.trialLimitHits)} sub={`cap is ${freeMessageLimit}`} />
            <Tile icon={Mic} label="Voice sessions" value={nf.format(stats.voiceSessions)} />
            <Tile icon={IndianRupee} label="Revenue" value={`$${nf.format(stats.totalRevenueUsd)}`} sub={stats.totalRevenueInr ? `₹${nf.format(Math.round(stats.totalRevenueInr))} charged` : 'USD list price'} />
            <Tile icon={CheckCircle2} label="Paying users" value={nf.format(funnel.paid)} tone={funnel.paid > 0 ? 'good' : undefined} />
          </div>
        </Section>

        <div className="grid lg:grid-cols-2 gap-8">
          <Section title={`Signups per day`} hint={`last ${days} days, UTC`}>
            {points && <DailyBars points={points} field="signups" unit="signups" />}
          </Section>
          <Section title="Messages per day" hint={`last ${days} days, UTC`}>
            {points && <DailyBars points={points} field="messages" unit="messages" />}
          </Section>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Section title="Funnel" hint="all time">
            <FunnelBars funnel={funnel} freeLimit={freeMessageLimit} />
          </Section>
          <Section title="Events by type" hint="all time">
            <EventBreakdown counts={eventCounts} />
          </Section>
        </div>

        <Section title="Recent users" hint="last 25 by signup">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
            <input
              id="admin-user-search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Filter by email or name…"
              className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary/40 transition-colors"
            />
          </div>
          <div className="bg-card border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-[12px] min-w-[620px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-foreground/35">
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Msgs</th>
                  <th className="px-4 py-3 font-semibold">Voice</th>
                  <th className="px-4 py-3 font-semibold">Last seen</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <span className="text-foreground/85">{u.email}</span>
                      {u.isPro && <span className="ml-2 text-[9px] uppercase tracking-wider font-bold text-primary">pro</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-foreground/55">
                      {nf.format(Math.max(u.messageCount ?? 0, u.totalChatMessages ?? 0))}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-foreground/55">
                      {Math.round((u.voiceBalanceInSeconds ?? 0) / 60)}m left
                    </td>
                    <td className="px-4 py-3 text-foreground/45">{ago(u.lastActiveAt)}</td>
                    <td className="px-4 py-3 text-foreground/45">{ago(u.createdAt)}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-foreground/40">No users match “{query}”.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Recent payments" hint="last 25">
          <div className="bg-card border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-[12px] min-w-[620px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-foreground/35">
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Granted</th>
                  <th className="px-4 py-3 font-semibold">Via</th>
                  <th className="px-4 py-3 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map(p => (
                  <tr key={p._id} className="border-t border-border">
                    <td className="px-4 py-3 capitalize text-foreground/85">{p.plan || '—'}</td>
                    <td className="px-4 py-3 tabular-nums text-foreground/55">
                      ${nf.format(p.amount ?? 0)}
                      {p.amountInr ? <span className="text-foreground/30"> · ₹{nf.format(Math.round(p.amountInr))}</span> : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-foreground/55">
                      {nf.format(p.messagesGranted ?? 0)} msg · {nf.format(p.durationInMinutes ?? 0)}m
                    </td>
                    <td className="px-4 py-3 text-foreground/45">{p.source || 'checkout'}</td>
                    <td className="px-4 py-3 text-foreground/45">{ago(p.createdAt)}</td>
                  </tr>
                ))}
                {recentPayments.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-foreground/40">No payments yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Event feed" hint="last 60">
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {recentEvents.map(e => (
              <div key={e._id} className="px-4 py-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-[11px] text-primary shrink-0">{e.type}</span>
                <span className="text-[11px] text-foreground/30 font-mono truncate max-w-[180px]">{e.clerkId}</span>
                <span className="text-[11px] text-foreground/35 ml-auto shrink-0">{ago(e.createdAt)}</span>
                {e.metadata && Object.keys(e.metadata).length > 0 && (
                  <p className="basis-full text-[10px] text-foreground/30 font-mono truncate">
                    {JSON.stringify(e.metadata)}
                  </p>
                )}
              </div>
            ))}
            {recentEvents.length === 0 && (
              <p className="px-4 py-6 text-center text-foreground/40 text-sm">No events yet.</p>
            )}
          </div>
        </Section>

      </main>
    </div>
  );
}

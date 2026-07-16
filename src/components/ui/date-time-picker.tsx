'use client';

import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon, ClockIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function calendarGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─────────────────────────────────────────────────────────────────────────────
// DatePicker
// value: 'YYYY-MM-DD' | ''   onChange: (v: string) => void
// ─────────────────────────────────────────────────────────────────────────────

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

type DateView = 'days' | 'months' | 'years';

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<DateView>('days');

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;
  const validSelected = selected && isValid(selected) ? selected : null;

  const today = new Date();
  const [viewYear, setViewYear] = React.useState(validSelected?.getFullYear() ?? 2000);
  const [viewMonth, setViewMonth] = React.useState(validSelected?.getMonth() ?? 0);

  // Year grid: show 12-year block
  const yearBlockStart = Math.floor(viewYear / 12) * 12;

  const displayValue = validSelected ? format(validSelected, 'dd MMM yyyy') : null;

  const selectDay = (day: Date) => {
    if (day > today) return;
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
    setView('days');
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    const limit = today;
    if (viewYear > limit.getFullYear()) return;
    if (viewYear === limit.getFullYear() && viewMonth >= limit.getMonth()) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells = calendarGrid(viewYear, viewMonth);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setView('days');
      }}
    >
      <PopoverTrigger
        className={cn(
          'w-full px-4 py-3.5 bg-foreground/[0.04] border border-border rounded-xl text-sm text-left outline-none',
          'focus:border-primary/40 hover:border-primary/30 transition-colors',
          'flex items-center justify-between gap-2',
          open && 'border-primary/40',
          className,
        )}
      >
        <span className={displayValue ? 'text-foreground' : 'text-foreground/30'}>
          {displayValue ?? placeholder}
        </span>
        <CalendarIcon size={14} className="text-foreground/30 shrink-0" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        className="w-[280px] p-0 bg-popover border-border shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* ── Day view ── */}
        {view === 'days' && (
          <div className="p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-foreground/[0.06] text-foreground/50 hover:text-foreground transition-colors"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => setView('months')}
                  className="px-2 py-0.5 rounded-md hover:bg-foreground/[0.06] text-foreground transition-colors"
                >
                  {MONTHS[viewMonth]}
                </button>
                <button
                  type="button"
                  onClick={() => setView('years')}
                  className="px-2 py-0.5 rounded-md hover:bg-foreground/[0.06] text-foreground transition-colors"
                >
                  {viewYear}
                </button>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-foreground/[0.06] text-foreground/50 hover:text-foreground transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Day-of-week labels */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-medium text-foreground/30 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const isToday = day.toDateString() === today.toDateString();
                const isSelected = validSelected?.toDateString() === day.toDateString();
                const isFuture = day > today;
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={isFuture}
                    onClick={() => selectDay(day)}
                    className={cn(
                      'h-8 w-full rounded-lg text-xs font-medium transition-colors',
                      isSelected && 'bg-primary text-background font-semibold',
                      !isSelected && isToday && 'bg-primary/10 text-primary',
                      !isSelected && !isToday && !isFuture && 'text-foreground/75 hover:bg-foreground/[0.06] hover:text-foreground',
                      isFuture && 'text-foreground/20 cursor-not-allowed',
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Month view ── */}
        {view === 'months' && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewYear(y => y - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-foreground/[0.06] text-foreground/50 hover:text-foreground transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setView('years')}
                className="px-2 py-0.5 rounded-md hover:bg-foreground/[0.06] text-sm font-medium text-foreground transition-colors"
              >
                {viewYear}
              </button>
              <button
                type="button"
                onClick={() => setViewYear(y => Math.min(y + 1, today.getFullYear()))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-foreground/[0.06] text-foreground/50 hover:text-foreground transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {MONTHS.map((name, idx) => {
                const isFuture =
                  viewYear > today.getFullYear() ||
                  (viewYear === today.getFullYear() && idx > today.getMonth());
                const isCurrent = idx === viewMonth;
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={isFuture}
                    onClick={() => { setViewMonth(idx); setView('days'); }}
                    className={cn(
                      'py-2 rounded-lg text-xs font-medium transition-colors',
                      isCurrent && 'bg-primary/15 text-primary',
                      !isCurrent && !isFuture && 'text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground',
                      isFuture && 'text-foreground/20 cursor-not-allowed',
                    )}
                  >
                    {name.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Year view ── */}
        {view === 'years' && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewYear(yearBlockStart - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-foreground/[0.06] text-foreground/50 hover:text-foreground transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-medium text-foreground/60">
                {yearBlockStart}–{yearBlockStart + 11}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (yearBlockStart + 12 <= today.getFullYear())
                    setViewYear(yearBlockStart + 12);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-foreground/[0.06] text-foreground/50 hover:text-foreground transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: 12 }, (_, i) => yearBlockStart + i).map(yr => {
                const isFuture = yr > today.getFullYear();
                const isCurrent = yr === viewYear;
                return (
                  <button
                    key={yr}
                    type="button"
                    disabled={isFuture}
                    onClick={() => { setViewYear(yr); setView('months'); }}
                    className={cn(
                      'py-2 rounded-lg text-xs font-medium transition-colors',
                      isCurrent && 'bg-primary/15 text-primary',
                      !isCurrent && !isFuture && 'text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground',
                      isFuture && 'text-foreground/20 cursor-not-allowed',
                    )}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TimePicker
// value: 'HH:MM' (24-h)   onChange: (v: string) => void
// ─────────────────────────────────────────────────────────────────────────────

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = 'Pick a time',
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const parse24 = (v: string) => {
    if (!v) return { h12: 12, min: 0, ampm: 'AM' as 'AM' | 'PM' };
    const [hh, mm] = v.split(':').map(Number);
    const ampm: 'AM' | 'PM' = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    return { h12, min: mm ?? 0, ampm };
  };

  const { h12, min, ampm } = parse24(value);
  const pad = (n: number) => String(n).padStart(2, '0');

  const emit = (newH12: number, newMin: number, newAmpm: 'AM' | 'PM') => {
    let h24 = newH12 % 12;
    if (newAmpm === 'PM') h24 += 12;
    onChange(`${pad(h24)}:${pad(newMin)}`);
  };

  const displayValue = value ? `${pad(h12)}:${pad(min)} ${ampm}` : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'w-full px-4 py-3.5 bg-foreground/[0.04] border border-border rounded-xl text-sm text-left outline-none',
          'focus:border-primary/40 hover:border-primary/30 transition-colors',
          'flex items-center justify-between gap-2',
          open && 'border-primary/40',
          className,
        )}
      >
        <span className={displayValue ? 'text-foreground' : 'text-foreground/30'}>
          {displayValue ?? placeholder}
        </span>
        <ClockIcon size={14} className="text-foreground/30 shrink-0" />
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        className="w-auto p-3 bg-popover border-border shadow-2xl rounded-2xl"
      >
        <p className="text-[9px] uppercase tracking-widest text-foreground/30 mb-3 px-1 font-medium">
          Select time
        </p>

        <div className="flex items-stretch gap-1.5">
          <ScrollColumn
            items={Array.from({ length: 12 }, (_, i) => i + 1)}
            selected={h12}
            onSelect={(v) => emit(v, min, ampm)}
            format={pad}
            label="HH"
          />
          <div className="flex items-center pb-1 text-foreground/30 font-bold text-lg select-none">:</div>
          <ScrollColumn
            items={Array.from({ length: 60 }, (_, i) => i)}
            selected={min}
            onSelect={(v) => emit(h12, v, ampm)}
            format={pad}
            label="MM"
          />
          <AmPmColumn value={ampm} onChange={(v) => emit(h12, min, v)} />
        </div>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-3 w-full py-2 rounded-lg bg-primary/90 hover:bg-primary text-background text-xs font-semibold transition-colors"
        >
          Confirm
        </button>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scroll column (hours / minutes)
// ─────────────────────────────────────────────────────────────────────────────

function ScrollColumn({
  items,
  selected,
  onSelect,
  format: fmt,
  label,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  format: (v: number) => string;
  label: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const ITEM_H = 36;

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = items.indexOf(selected);
    if (idx !== -1) el.scrollTop = idx * ITEM_H - ITEM_H * 2;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] uppercase tracking-widest text-foreground/25 font-medium mb-0.5">
        {label}
      </span>
      <div
        ref={containerRef}
        className="h-[180px] overflow-y-auto scroll-smooth no-scrollbar"
        style={{ width: 48 }}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {items.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onSelect(v)}
            className={cn(
              'w-full flex items-center justify-center rounded-lg text-sm font-mono transition-colors',
              selected === v
                ? 'bg-primary/20 text-primary font-semibold'
                : 'text-foreground/40 hover:text-foreground/75 hover:bg-foreground/[0.04]',
            )}
            style={{ height: ITEM_H }}
          >
            {fmt(v)}
          </button>
        ))}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AM / PM column
// ─────────────────────────────────────────────────────────────────────────────

function AmPmColumn({
  value,
  onChange,
}: {
  value: 'AM' | 'PM';
  onChange: (v: 'AM' | 'PM') => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 ml-0.5">
      <span className="text-[9px] uppercase tracking-widest text-foreground/25 font-medium mb-0.5">
        &nbsp;
      </span>
      <div className="flex flex-col gap-2 justify-center" style={{ height: 180 }}>
        {(['AM', 'PM'] as const).map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => onChange(period)}
            className={cn(
              'w-12 h-9 rounded-lg text-xs font-semibold transition-all',
              value === period
                ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                : 'text-foreground/35 hover:text-foreground/70 hover:bg-foreground/[0.04]',
            )}
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  );
}

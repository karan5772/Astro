'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// ── DatePicker ────────────────────────────────────────────────────────────────
// value: 'YYYY-MM-DD' | ''   onChange: (v: string) => void

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: Date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = value ? new Date(value + 'T00:00:00') : undefined;

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
        <span className={date ? 'text-foreground' : 'text-foreground/30'}>
          {date ? format(date, 'd MMMM yyyy') : placeholder}
        </span>
        <CalendarIcon size={14} className="text-foreground/30 shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-auto p-0 bg-popover border-border shadow-2xl"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, 'yyyy-MM-dd'));
              setOpen(false);
            }
          }}
          captionLayout="dropdown"
          startMonth={new Date(1920, 0, 1)}
          endMonth={new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}

// ── TimePicker ────────────────────────────────────────────────────────────────
// value: 'HH:MM' | ''   onChange: (v: string) => void

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TimePicker({ value, onChange, placeholder = 'Pick a time', className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const hours = value ? parseInt(value.split(':')[0], 10) : null;
  const minutes = value ? parseInt(value.split(':')[1], 10) : null;

  const pad = (n: number) => String(n).padStart(2, '0');

  const setH = (h: number) => {
    const m = minutes ?? 0;
    onChange(`${pad(h)}:${pad(m)}`);
  };

  const setM = (m: number) => {
    const h = hours ?? 0;
    onChange(`${pad(h)}:${pad(m)}`);
  };

  const displayValue = value
    ? (() => {
        const h = hours ?? 0;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${pad(h12)}:${pad(minutes ?? 0)} ${ampm}`;
      })()
    : placeholder;

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
        <span className={value ? 'text-foreground' : 'text-foreground/30'}>{displayValue}</span>
        <ClockIcon size={14} className="text-foreground/30 shrink-0" />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-auto p-3 bg-popover border-border shadow-2xl"
      >
        <p className="text-[9px] uppercase tracking-widest text-foreground/30 mb-3 px-1 font-medium">Select time</p>

        <div className="flex items-stretch gap-2">
          {/* Hours column */}
          <ScrollColumn
            items={Array.from({ length: 24 }, (_, i) => i)}
            selected={hours ?? 0}
            onSelect={setH}
            format={(h) => pad(h)}
            label="HH"
          />
          <div className="flex items-center pb-1 text-foreground/30 font-bold text-lg select-none">:</div>
          {/* Minutes column */}
          <ScrollColumn
            items={Array.from({ length: 60 }, (_, i) => i)}
            selected={minutes ?? 0}
            onSelect={setM}
            format={(m) => pad(m)}
            label="MM"
          />
        </div>

        <button
          onClick={() => setOpen(false)}
          className="mt-3 w-full py-2 rounded-lg bg-primary/90 hover:bg-primary text-white text-xs font-semibold transition-colors"
        >
          Confirm
        </button>
      </PopoverContent>
    </Popover>
  );
}

// ── Scroll column (used inside TimePicker) ────────────────────────────────────

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
    el.scrollTop = selected * ITEM_H - ITEM_H * 2;
  }, [selected]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] uppercase tracking-widest text-foreground/25 font-medium mb-0.5">{label}</span>
      <div
        ref={containerRef}
        className="h-[180px] overflow-y-auto scroll-smooth no-scrollbar relative"
        style={{ width: 52 }}
      >
        {/* top padding */}
        <div style={{ height: ITEM_H * 2 }} />
        {items.map((v) => (
          <button
            key={v}
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
        {/* bottom padding */}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}

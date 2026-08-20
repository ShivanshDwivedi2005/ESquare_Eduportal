import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedCard, AnimatedCounter } from '@/components/motion';

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  icon?: React.ElementType;
  hint?: string;
}

/** Splits values like "87%", "₹8,42,000" or "8.6" so the numeric part can animate. */
function parseValue(value: string | number) {
  if (typeof value === 'number') return { prefix: '', num: value, suffix: '', decimals: Number.isInteger(value) ? 0 : 1 };
  const match = value.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const num = Number(match[2].replace(/,/g, ''));
  if (Number.isNaN(num)) return null;
  const decimals = match[2].includes('.') ? match[2].split('.')[1].length : 0;
  return { prefix: match[1], num, suffix: match[3], decimals };
}

export function StatCard({ label, value, delta, trend = 'flat', icon: Icon, hint }: Props) {
  const parsed = parseValue(value);

  return (
    <AnimatedCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary transition-transform duration-150 group-hover:scale-105">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight">
        {parsed
          ? <AnimatedCounter value={parsed.num} decimals={parsed.decimals} prefix={parsed.prefix} suffix={parsed.suffix} />
          : value}
      </p>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {delta && (
          <span className={cn('inline-flex items-center gap-0.5 font-medium',
            trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground')}>
            {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : trend === 'down' ? <ArrowDownRight className="h-3 w-3" /> : null}
            {delta}
          </span>
        )}
        {hint && <span className="truncate text-muted-foreground">{hint}</span>}
      </div>
    </AnimatedCard>
  );
}

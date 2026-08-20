import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Shimmering skeleton block — the base of every loading state. */
export function Shimmer({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-md bg-muted/70', className)} />;
}

/** Indeterminate spinner. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
    />
  );
}

/** Three-dot pulsing loader for inline/pending copy. */
export function DotsLoader({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <span className={cn('inline-flex items-center gap-1', className)} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-current"
          animate={reduced ? undefined : { opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

/** Thin top progress bar for route/data loading. */
export function TopLoadingBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent">
      <motion.div
        className="h-full bg-primary"
        initial={{ width: '0%' }}
        animate={{ width: ['0%', '65%', '85%'] }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="surface-card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-8 w-8 rounded-lg" />
      </div>
      <Shimmer className="h-7 w-20" />
      <Shimmer className="h-3 w-32" />
    </div>
  );
}

export function SkeletonChartCard({ className }: { className?: string }) {
  return (
    <div className={cn('surface-card space-y-4 p-5', className)}>
      <Shimmer className="h-4 w-40" />
      <div className="flex h-40 items-end gap-2">
        {['h-1/2', 'h-3/4', 'h-2/5', 'h-5/6', 'h-3/5', 'h-full', 'h-1/3', 'h-2/3'].map((h, i) => (
          <Shimmer key={i} className={cn('flex-1 rounded-t-md', h)} />
        ))}
      </div>
      <Shimmer className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonListCard({ rows = 4 }: { rows?: number }) {
  return (
    <div className="surface-card space-y-4 p-5">
      <Shimmer className="h-4 w-36" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Shimmer className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-3 w-1/2" />
            <Shimmer className="h-3 w-1/3" />
          </div>
          <Shimmer className="h-6 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPostCard() {
  return (
    <div className="surface-card space-y-4 p-5">
      <div className="flex items-center gap-3">
        <Shimmer className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Shimmer className="h-3 w-40" />
          <Shimmer className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Shimmer className="h-3 w-full" />
        <Shimmer className="h-3 w-11/12" />
        <Shimmer className="h-3 w-2/3" />
      </div>
      <Shimmer className="h-40 w-full rounded-lg" />
      <div className="flex gap-3">
        <Shimmer className="h-7 w-16 rounded-full" />
        <Shimmer className="h-7 w-16 rounded-full" />
        <Shimmer className="h-7 w-16 rounded-full" />
      </div>
    </div>
  );
}

/** Full dashboard skeleton. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Shimmer className="h-6 w-64" />
        <Shimmer className="h-3 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonChartCard className="lg:col-span-2" />
        <SkeletonListCard />
      </div>
    </div>
  );
}

/** Simulates async fetch latency so loading states are visible until the API layer lands. */
export function useSimulatedLoading(ms = 700) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), ms);
    return () => window.clearTimeout(t);
  }, [ms]);
  return loading;
}

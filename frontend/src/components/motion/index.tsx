import { forwardRef, useEffect, useRef, useState } from 'react';
import {
  HTMLMotionProps, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  cardHover, duration, ease, fadeUp, pageTransition, scaleIn, staggerContainer, staggerItem,
} from '@/lib/motion';

/* ------------------------------- AnimatedPage ------------------------------ */

export function AnimatedPage({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduced ? { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } } : pageTransition}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

/* ----------------------------- Stagger primitives -------------------------- */

export function StaggerContainer({
  children, className, stagger = 0.055, delay = 0.02,
}: { children: React.ReactNode; className?: string; stagger?: number; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={staggerContainer(reduced ? 0 : stagger, reduced ? 0 : delay)}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...rest }: HTMLMotionProps<'div'>) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduced ? { hidden: { opacity: 0 }, show: { opacity: 1 } } : staggerItem}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------- AnimatedCard ----------------------------- */

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  interactive?: boolean;
  layoutIdKey?: string;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, interactive = true, layoutIdKey, ...rest }, ref) => {
    const reduced = useReducedMotion();
    const hover = interactive && !reduced ? cardHover : {};
    return (
      <motion.div
        ref={ref}
        layoutId={layoutIdKey}
        className={cn('surface-card', interactive && 'transition-shadow hover:shadow-lg', className)}
        {...hover}
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);
AnimatedCard.displayName = 'AnimatedCard';

/* ------------------------------ AnimatedCounter ---------------------------- */

interface CounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ value, decimals = 0, prefix = '', suffix = '', className }: CounterProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(reduced ? value : 0);
  const spring = useSpring(mv, { stiffness: 90, damping: 22, mass: 0.7 });
  const text = useTransform(spring, (v) =>
    `${prefix}${v.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`,
  );

  useEffect(() => {
    if (inView || reduced) mv.set(value);
  }, [inView, value, mv, reduced]);

  return <motion.span ref={ref} className={className}>{text}</motion.span>;
}

/* ----------------------------- AnimatedProgress ---------------------------- */

export function AnimatedProgress({
  value, className, barClassName,
}: { value: number; className?: string; barClassName?: string }) {
  const reduced = useReducedMotion();
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-secondary', className)}>
      <motion.div
        className={cn('h-full rounded-full bg-primary', barClassName)}
        initial={{ width: reduced ? `${value}%` : 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: reduced ? 0 : 0.6, ease: ease.out }}
      />
    </div>
  );
}

/* -------------------------------- AnimatedTabs ----------------------------- */

interface TabsProps {
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  layoutId?: string;
  className?: string;
}

export function AnimatedTabs({ tabs, value, onChange, layoutId = 'tab-indicator', className }: TabsProps) {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg border border-border bg-surface-muted p-1', className)}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-md bg-background shadow-sm"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- AnimatedList ----------------------------- */

export function AnimatedList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <StaggerContainer className={className} stagger={0.04}>
      {children}
    </StaggerContainer>
  );
}

/* --------------------------- Reveal on scroll (light) ---------------------- */

export function Reveal({
  children, className, delay = 0,
}: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: duration.large, ease: ease.out, delay }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------- Action button with states ---------------------- */

export function ActionStateButton({
  idleLabel, pendingLabel, doneLabel, onAction, className, disabled,
}: {
  idleLabel: string; pendingLabel: string; doneLabel: string;
  onAction?: () => void; className?: string; disabled?: boolean;
}) {
  const [state, setState] = useState<'idle' | 'pending' | 'done'>('idle');
  const label = state === 'idle' ? idleLabel : state === 'pending' ? pendingLabel : doneLabel;

  return (
    <motion.button
      type="button"
      disabled={disabled || state !== 'idle'}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        if (state !== 'idle') return;
        setState('pending');
        onAction?.();
        window.setTimeout(() => setState('done'), 700);
      }}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-colors',
        state === 'done' ? 'bg-success/15 text-success' : 'bg-primary text-primary-foreground hover:bg-primary/90',
        className,
      )}
    >
      <motion.span
        key={state}
        variants={scaleIn}
        initial="hidden"
        animate="show"
        className="inline-flex items-center gap-1.5"
      >
        {state === 'pending' && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {state === 'done' && <span aria-hidden>✓</span>}
        {label}
      </motion.span>
    </motion.button>
  );
}

export { fadeUp };

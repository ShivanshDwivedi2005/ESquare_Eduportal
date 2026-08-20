import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ------------------------------ AnimatedGrid ------------------------------ */

export function AnimatedGridPattern({
  width = 44,
  height = 44,
  className,
  squares = 26,
}: { width?: number; height?: number; className?: string; squares?: number }) {
  const id = useId();
  const reduced = useReducedMotion();
  const cells = useMemo(
    () =>
      Array.from({ length: squares }, (_, i) => ({
        id: i,
        x: Math.floor(Math.random() * 26),
        y: Math.floor(Math.random() * 14),
        delay: Math.random() * 5,
      })),
    [squares],
  );

  return (
    <svg
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 h-full w-full fill-primary/[0.06] stroke-border/70', className)}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse">
          <path d={`M.5 ${height}V.5H${width}`} fill="none" strokeDasharray="0" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      {!reduced && (
        <svg x={0} y={0} className="overflow-visible">
          {cells.map((c) => (
            <motion.rect
              key={c.id}
              width={width - 1}
              height={height - 1}
              x={c.x * width + 1}
              y={c.y * height + 1}
              rx={3}
              strokeWidth={0}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: c.delay, repeatDelay: 2, ease: 'easeInOut' }}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

/* --------------------------------- DotGrid -------------------------------- */

export function DotPattern({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg aria-hidden className={cn('pointer-events-none absolute inset-0 h-full w-full fill-muted-foreground/25', className)}>
      <defs>
        <pattern id={id} width={20} height={20} patternUnits="userSpaceOnUse">
          <circle cx={1} cy={1} r={1} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} strokeWidth={0} />
    </svg>
  );
}

/* -------------------------------- BorderBeam ------------------------------ */

export function BorderBeam({
  duration = 8,
  delay = 0,
  className,
}: { duration?: number; delay?: number; className?: string }) {
  return (
    <span
      style={{ ['--beam-duration' as string]: `${duration}s`, ['--beam-delay' as string]: `${delay}s` }}
      className={cn('border-beam pointer-events-none absolute inset-0 rounded-[inherit]', className)}
      aria-hidden
    />
  );
}

/* ---------------------------- AnimatedGradientText ------------------------ */

export function AnimatedGradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('animated-gradient-text', className)}>{children}</span>;
}

/* ------------------------------- ShimmerButton ---------------------------- */

export function ShimmerButton({
  children, className, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        'shimmer-btn group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-full',
        'bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-md)]',
        'transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]',
        className,
      )}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

/* --------------------------------- BlurFade ------------------------------- */

export function BlurFade({
  children, className, delay = 0, y = 12, once = true,
}: { children: React.ReactNode; className?: string; delay?: number; y?: number; once?: boolean }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y, filter: 'blur(8px)' }}
      animate={inView ? (reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }) : undefined}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------- NumberTicker ---------------------------- */

export function NumberTicker({
  value, decimals = 0, prefix = '', suffix = '', className,
}: { value: number; decimals?: number; prefix?: string; suffix?: string; className?: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const mv = useMotionValue(reduced ? value : 0);
  const spring = useSpring(mv, { stiffness: 80, damping: 24, mass: 0.8 });
  const text = useTransform(spring, (v) =>
    `${prefix}${v.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`);

  useEffect(() => { if (inView || reduced) mv.set(value); }, [inView, value, mv, reduced]);

  return <motion.span ref={ref} className={className}>{text}</motion.span>;
}

/* ---------------------------------- Marquee ------------------------------- */

export function Marquee({
  children, className, reverse, speed = 32, pauseOnHover = true,
}: { children: React.ReactNode; className?: string; reverse?: boolean; speed?: number; pauseOnHover?: boolean }) {
  return (
    <div className={cn('group flex w-full overflow-hidden [--marquee-gap:1rem]', className)}>
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          style={{ animationDuration: `${speed}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
          className={cn(
            'flex shrink-0 items-stretch gap-[var(--marquee-gap)] pr-[var(--marquee-gap)] marquee-track',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- Spotlight ------------------------------ */

export function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 0, on: false });

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, on: true });
      }}
      onMouseLeave={() => setPos((p) => ({ ...p, on: false }))}
      className={cn('relative overflow-hidden', className)}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: pos.on ? 1 : 0,
          background: `radial-gradient(300px circle at ${pos.x}% ${pos.y}%, hsl(var(--primary) / 0.12), transparent 70%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

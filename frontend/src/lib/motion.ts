import type { Transition, Variants } from 'framer-motion';

/* ------------------------------------------------------------------
 * ESQUARE motion tokens
 * One shared motion language: subtle, fast, intentional.
 * ------------------------------------------------------------------ */

export const duration = {
  micro: 0.14,   // buttons, icons, toggles
  ui: 0.22,      // dropdowns, tabs, cards, filters
  large: 0.32,   // modals, drawers, page transitions
} as const;

type Cubic = [number, number, number, number];

export const ease: Record<'out' | 'in' | 'inOut', Cubic> = {
  out: [0.16, 1, 0.3, 1],      // entering
  in: [0.7, 0, 0.84, 0],       // leaving
  inOut: [0.65, 0, 0.35, 1],   // state change
};

export const spring: Transition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 };
export const softSpring: Transition = { type: 'spring', stiffness: 260, damping: 30 };

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const t = (d: number, e: Cubic = ease.out): Transition => ({ duration: d, ease: e });

/* -------------------------------- variants ------------------------------- */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: t(duration.ui) },
  exit: { opacity: 0, transition: t(duration.micro, ease.in) },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: t(duration.ui) },
  exit: { opacity: 0, y: -6, transition: t(duration.micro, ease.in) },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: t(duration.ui) },
  exit: { opacity: 0, y: -6, transition: t(duration.micro, ease.in) },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: t(duration.ui) },
  exit: { opacity: 0, scale: 0.98, transition: t(duration.micro, ease.in) },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: t(duration.ui) },
  exit: { opacity: 0, x: -8, transition: t(duration.micro, ease.in) },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: t(duration.ui) },
  exit: { opacity: 0, x: 8, transition: t(duration.micro, ease.in) },
};

export const staggerContainer = (stagger = 0.055, delay = 0.02): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  exit: {},
});

export const staggerItem: Variants = fadeUp;

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: t(duration.large) },
  exit: { opacity: 0, y: -4, transition: t(duration.micro, ease.in) },
};

export const modalEnter: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: t(duration.large) },
  exit: { opacity: 0, scale: 0.985, y: 4, transition: t(duration.ui, ease.in) },
};

export const drawerEnter: Variants = {
  hidden: { opacity: 0, x: '100%' },
  show: { opacity: 1, x: 0, transition: softSpring },
  exit: { opacity: 0, x: '100%', transition: t(duration.ui, ease.in) },
};

export const dropdownEnter: Variants = {
  hidden: { opacity: 0, y: -5, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: t(duration.micro) },
  exit: { opacity: 0, y: -4, scale: 0.99, transition: t(duration.micro, ease.in) },
};

export const notificationEnter: Variants = {
  hidden: { opacity: 0, y: -8, height: 'auto' },
  show: { opacity: 1, y: 0, transition: t(duration.ui) },
  exit: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, transition: t(duration.ui, ease.in) },
};

/** Standard hover/tap feedback for interactive cards. */
export const cardHover = {
  whileHover: { y: -3, transition: { duration: duration.micro, ease: ease.out } },
  whileTap: { scale: 0.995 },
};

/** Standard tap feedback for buttons. */
export const tapFeedback = { whileTap: { scale: 0.98 }, transition: spring };

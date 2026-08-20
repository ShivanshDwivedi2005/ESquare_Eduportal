import { motion, useReducedMotion } from 'framer-motion';
import { duration, ease } from '@/lib/motion';

interface Props {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}

export function PageHeader({ title, description, actions, eyebrow }: Props) {
  const reduced = useReducedMotion();
  const enter = (delay: number) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: duration.ui, ease: ease.out, delay: reduced ? 0 : delay },
  });

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <motion.p {...enter(0)} className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </motion.p>
        )}
        <motion.h1 {...enter(0.04)} className="text-2xl font-bold md:text-[28px]">{title}</motion.h1>
        {description && (
          <motion.p {...enter(0.08)} className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</motion.p>
        )}
      </div>
      {actions && (
        <motion.div {...enter(0.1)} className="flex flex-wrap items-center gap-2">{actions}</motion.div>
      )}
    </div>
  );
}

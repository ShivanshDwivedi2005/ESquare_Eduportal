import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { duration, ease } from '@/lib/motion';

interface Props {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  interactive?: boolean;
  children: React.ReactNode;
}

export function SectionCard({
  title, description, action, className, bodyClassName, interactive = false, children,
}: Props) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      layout={!reduced}
      transition={{ duration: duration.ui, ease: ease.out }}
      whileHover={interactive && !reduced ? { y: -3 } : undefined}
      className={cn('surface-card transition-shadow duration-200 hover:shadow-lg', className)}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="font-display text-sm font-semibold">{title}</h2>}
            {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </motion.section>
  );
}

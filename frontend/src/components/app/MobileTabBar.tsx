import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { mobileNavByRole } from '@/lib/roles';
import { cn } from '@/lib/utils';

export function MobileTabBar() {
  const { user } = useAuthStore();
  const { pathname } = useLocation();
  if (!user) return null;
  const items = mobileNavByRole[user.role] ?? [];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="flex items-stretch">
        {items.map((item) => {
          const active = item.end ? pathname === item.url : pathname.startsWith(item.url);
          return (
            <li key={item.url + item.title} className="flex-1">
              <NavLink
                to={item.url}
                className={cn(
                  'relative flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-tab-indicator"
                    transition={{ type: 'spring', stiffness: 430, damping: 36 }}
                    className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary"
                  />
                )}
                <motion.span whileTap={{ scale: 0.9 }} className="flex flex-col items-center gap-1">
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </motion.span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

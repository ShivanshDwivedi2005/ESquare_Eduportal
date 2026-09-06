import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, LogOut, Moon, Plus, Search, Settings, Sun, User as UserIcon } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { notifications } from '@/mock-data';
import { initials } from '@/lib/format';
import { roleLabel } from '@/lib/roles';
import { useTheme } from '@/components/app/ThemeProvider';

export function TopBar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { user, logout } = useAuthStore();
  const readIds = useAppStore((s) => s.readNotifications);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const reduced = useReducedMotion();
  if (!user) return null;

  const unread = notifications.filter((n) => !n.read && !readIds.includes(n.id)).length;

  return (
    <motion.header
      initial={reduced ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-3 backdrop-blur-md md:px-6"
    >
      <SidebarTrigger className="shrink-0" />

      <motion.button
        onClick={onOpenSearch}
        whileHover={reduced ? undefined : { scale: 1.006 }}
        whileTap={reduced ? undefined : { scale: 0.995 }}
        className="group flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 text-left text-sm text-muted-foreground transition-colors hover:border-ring/40 md:max-w-md"
      >
        <Search className="h-4 w-4" />
        <span className="truncate">Search ESQUARE…</span>
        <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] md:inline">⌘K</kbd>
      </motion.button>

      <div className="ml-auto flex items-center gap-1.5">
        <Button size="sm" className="hidden gap-1.5 md:inline-flex" onClick={() => navigate('/app/feed?compose=1')}>
          <Plus className="h-4 w-4" /> Create
        </Button>
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative" onClick={() => navigate('/app/notifications')}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <motion.span
              initial={reduced ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 480, damping: 28 }}
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
            >
              {unread}
            </motion.span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              aria-label="Account menu"
              whileHover={reduced ? undefined : { scale: 1.05 }}
              whileTap={reduced ? undefined : { scale: 0.96 }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary"
            >
              {initials(user.name)}
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{roleLabel[user.role]} • {user.publicId}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/app/profile')}>
              <UserIcon className="mr-2 h-4 w-4" /> View profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { void logout().finally(() => navigate('/')); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}

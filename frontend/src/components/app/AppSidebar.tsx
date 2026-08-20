import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/stores/authStore';
import { navByRole, roleLabel } from '@/lib/roles';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';
import { GraduationCap } from 'lucide-react';

export function AppSidebar() {
  const { user } = useAuthStore();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();
  if (!user) return null;

  const groups = navByRole[user.role] ?? [];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-16 justify-center px-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4.5 w-4.5" strokeWidth={2.2} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-extrabold tracking-tight">ESQUARE</p>
              <p className="truncate text-[11px] text-muted-foreground">{roleLabel[user.role]} workspace</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = item.end ? pathname === item.url : pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={`${group.label}-${item.url}-${item.title}`}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <NavLink to={item.url} className="relative gap-2.5">
                          {active && (
                            <motion.span
                              layoutId="sidebar-active-indicator"
                              transition={{ type: 'spring', stiffness: 430, damping: 36 }}
                              className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-sidebar-primary"
                            />
                          )}
                          <item.icon className={cn('h-4 w-4 transition-colors duration-150', active && 'text-sidebar-primary')} />
                          <motion.span
                            initial={false}
                            animate={{ opacity: collapsed ? 0 : 1 }}
                            transition={{ duration: 0.15 }}
                          >
                            {item.title}
                          </motion.span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}

              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
            {initials(user.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{user.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user.publicId}</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

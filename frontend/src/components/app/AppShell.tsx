import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app/AppSidebar';
import { TopBar } from '@/components/app/TopBar';
import { MobileTabBar } from '@/components/app/MobileTabBar';
import { CommandPalette } from '@/components/app/CommandPalette';
import { AnimatedPage } from '@/components/motion';
import { useAuthStore } from '@/stores/authStore';

export default function AppShell() {
  const { isAuthenticated, user } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  if (!isAuthenticated || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenSearch={() => setSearchOpen(true)} />
          <main className="flex-1 pb-20 md:pb-10">
            <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 lg:px-8">
              <AnimatePresence mode="wait" initial={false}>
                <AnimatedPage key={location.pathname}>
                  <Outlet />
                </AnimatedPage>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
      <MobileTabBar />
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}


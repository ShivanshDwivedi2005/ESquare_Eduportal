import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { notifications } from '@/mock-data';
import { useAppStore } from '@/stores/appStore';
import type { NotificationCategory } from '@/types';
import { cn } from '@/lib/utils';
import { BellRing } from 'lucide-react';

const tabs: (NotificationCategory | 'All')[] = ['All', 'Academic', 'Social', 'Opportunities', 'Requests', 'Administrative'];

export default function Notifications() {
  const [tab, setTab] = useState<NotificationCategory | 'All'>('All');
  const { readNotifications, markAllRead } = useAppStore();

  const visible = notifications.filter((n) => tab === 'All' || n.category === tab);

  return (
    <>
      <PageHeader
        eyebrow="You"
        title="Notifications"
        description="Academic updates, requests and opportunity alerts."
        actions={<Button variant="outline" size="sm" onClick={() => markAllRead(notifications.map((n) => n.id))}>Mark all read</Button>}
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              tab === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground')}
          >
            {t}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Nothing here yet" icon={BellRing} description="New notifications in this category will appear here." />
      ) : (
        <div className="space-y-2">
          {visible.map((n) => {
            const unread = !n.read && !readNotifications.includes(n.id);
            return (
              <article key={n.id} className={cn('surface-card flex items-start gap-3 p-4', unread && 'border-primary/40 bg-primary-soft/40')}>
                <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', unread ? 'bg-primary' : 'bg-border')} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                    <span className="text-xs text-muted-foreground">{n.at}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                </div>
                {n.action && (
                  <Button variant="outline" size="sm" asChild><Link to={n.action.to}>{n.action.label}</Link></Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

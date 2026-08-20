import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { conversations as seed } from '@/mock-data';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ArrowLeft, Search, Send } from 'lucide-react';

export default function Messages() {
  const [threads, setThreads] = useState(seed);
  const [activeId, setActiveId] = useState(seed[0].id);
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const active = threads.find((t) => t.id === activeId)!;
  const visible = threads.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, lastMessage: draft, lastAt: 'now', messages: [...t.messages, { id: `m-${Date.now()}`, senderName: 'You', self: true, content: draft, at: 'now' }] }
          : t,
      ),
    );
    setDraft('');
  };

  return (
    <>
      <PageHeader eyebrow="You" title="Messages" description="Direct, group, class and organization conversations." />

      <div className="surface-card grid h-[calc(100vh-260px)] min-h-[480px] grid-cols-1 overflow-hidden md:grid-cols-[300px_minmax(0,1fr)]">
        <aside className={cn('flex flex-col border-r border-border', mobileOpen && 'hidden md:flex')}>
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations" className="h-9 pl-9" />
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto scrollbar-thin">
            {visible.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => { setActiveId(t.id); setMobileOpen(true); }}
                  className={cn('flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors hover:bg-surface-muted',
                    t.id === activeId && 'bg-surface-muted')}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {initials(t.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.lastMessage}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[10px] text-muted-foreground">{t.lastAt}</span>
                    {t.unread > 0 && <Badge className="h-4 min-w-4 justify-center px-1 text-[10px]">{t.unread}</Badge>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className={cn('flex flex-col', !mobileOpen && 'hidden md:flex')}>
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Back to conversations" onClick={() => setMobileOpen(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
              {initials(active.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{active.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{active.kind} · @{active.handle}</p>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
            {active.messages.map((m) => (
              <div key={m.id} className={cn('flex', m.self ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                  m.self ? 'bg-primary text-primary-foreground' : 'bg-surface-muted')}>
                  {!m.self && <p className="mb-0.5 text-[11px] font-medium text-muted-foreground">{m.senderName}</p>}
                  <p>{m.content}</p>
                  <p className={cn('mt-1 text-[10px]', m.self ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{m.at}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" />
            <Button type="submit" size="icon" aria-label="Send message"><Send className="h-4 w-4" /></Button>
          </form>
        </section>
      </div>
    </>
  );
}

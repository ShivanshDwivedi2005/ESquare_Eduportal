import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calendarEvents, todaySchedule } from '@/mock-data';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const categoryColor: Record<string, string> = {
  Exam: 'bg-destructive/15 text-destructive',
  Assignment: 'bg-warning/15 text-warning',
  Hackathon: 'bg-primary-soft text-primary',
  Event: 'bg-info/15 text-info',
  Deadline: 'bg-destructive/15 text-destructive',
  Meeting: 'bg-muted text-muted-foreground',
  Class: 'bg-muted text-muted-foreground',
};

export default function CalendarPage() {
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const daysInMonth = 31;
  const startOffset = 5; // 01 Aug 2026 is a Saturday
  const eventsByDay = calendarEvents.reduce<Record<number, typeof calendarEvents>>((acc, e) => {
    const day = Number(e.date.slice(-2));
    if (e.date.startsWith('2026-08')) (acc[day] ??= []).push(e);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Calendar"
        description="Classes, exams, deadlines and events in one timeline."
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            {(['month', 'agenda'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn('rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {view === 'month' ? (
          <SectionCard
            title="August 2026"
            action={
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            }
            bodyClassName="p-4"
          >
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="pb-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOffset }).map((_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                <div key={day} className="min-h-[84px] rounded-lg border border-border p-1.5 text-left">
                  <span className="text-[11px] font-medium text-muted-foreground">{day}</span>
                  <div className="mt-1 space-y-1">
                    {(eventsByDay[day] ?? []).map((e) => (
                      <p key={e.id} className={cn('truncate rounded px-1 py-0.5 text-[10px] font-medium', categoryColor[e.category])}>
                        {e.title}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="Agenda" bodyClassName="p-4 space-y-2.5">
            {calendarEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="w-24 shrink-0 text-xs text-muted-foreground">{e.date}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.time}</p>
                </div>
                <Badge variant="outline">{e.category}</Badge>
              </div>
            ))}
          </SectionCard>
        )}

        <SectionCard title="Today" bodyClassName="p-3 space-y-1.5">
          {todaySchedule.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-muted">
              <span className="w-12 shrink-0 text-xs font-medium text-muted-foreground">{c.start}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.subject}</p>
                <p className="truncate text-xs text-muted-foreground">{c.room}</p>
              </div>
            </div>
          ))}
        </SectionCard>
      </div>
    </>
  );
}

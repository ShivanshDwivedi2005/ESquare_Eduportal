import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hackathons } from '@/mock-data';
import { CalendarDays, MapPin, Search, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const filters = ['All', 'Registration Open', 'Upcoming', 'Completed'];

export default function Hackathons() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');

  const visible = hackathons.filter(
    (h) => (status === 'All' || h.status === status) &&
      (h.title.toLowerCase().includes(q.toLowerCase()) || h.organizer.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <>
      <PageHeader eyebrow="Network" title="Hackathons & events" description="School and corporate hackathons open to verified students." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search hackathons…" className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                status === f ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground')}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No hackathons found" icon={Trophy} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((h) => (
            <Link key={h.id} to={`/app/hackathons/${h.id}`} className="surface-card hover-lift flex flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={h.registrationOpen ? 'default' : 'secondary'}>{h.status}</Badge>
                <span className="text-xs text-muted-foreground">{h.host}-hosted</span>
              </div>
              <h2 className="mt-3 font-display text-base font-semibold">{h.title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{h.organizer}</p>
              <div className="mt-3 flex-1 space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {h.startDate} – {h.endDate}</p>
                <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {h.location} · {h.mode}</p>
                <p className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> {h.prize}</p>
                <p className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Teams of {h.teamSize} · {h.participants} registered</p>
              </div>
              <Button size="sm" className="mt-4 w-full" variant={h.registrationOpen ? 'default' : 'outline'}>
                {h.registrationOpen ? 'View & register' : 'View details'}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

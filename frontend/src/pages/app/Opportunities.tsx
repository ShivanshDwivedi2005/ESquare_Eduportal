import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { opportunities } from '@/mock-data';
import { useAppStore } from '@/stores/appStore';
import type { OpportunityType } from '@/types';
import { Bookmark, MapPin, Search, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const types: (OpportunityType | 'All')[] = ['All', 'Internship', 'Job', 'Freelance', 'Workshop', 'Competition', 'Scholarship', 'Research'];
const modes = ['All', 'Remote', 'On-site', 'Hybrid'];

export default function Opportunities() {
  const [q, setQ] = useState('');
  const [type, setType] = useState<OpportunityType | 'All'>('All');
  const [mode, setMode] = useState('All');
  const [paidOnly, setPaidOnly] = useState(false);
  const { savedOpportunities, toggle } = useAppStore();

  const visible = opportunities.filter(
    (o) =>
      (type === 'All' || o.type === type) &&
      (mode === 'All' || o.mode === mode) &&
      (!paidOnly || o.paid) &&
      (o.title.toLowerCase().includes(q.toLowerCase()) || o.organization.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <>
      <PageHeader eyebrow="Network" title="Opportunities" description="Internships, jobs, freelance work, fellowships and scholarships." />

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <SectionCard title="Filters" bodyClassName="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="opp-type">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as OpportunityType | 'All')}>
                <SelectTrigger id="opp-type"><SelectValue /></SelectTrigger>
                <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="opp-mode">Work mode</label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger id="opp-mode"><SelectValue /></SelectTrigger>
                <SelectContent>{modes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <button
              onClick={() => setPaidOnly((v) => !v)}
              className={cn('w-full rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                paidOnly ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted-foreground')}
            >
              Paid opportunities only
            </button>
          </SectionCard>

          <SectionCard title="Saved" bodyClassName="p-4">
            <p className="text-sm text-muted-foreground">{savedOpportunities.length} saved opportunities</p>
          </SectionCard>
        </aside>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search roles and organizations…" className="pl-9" />
          </div>

          {visible.length === 0 ? (
            <EmptyState title="No opportunities match" description="Broaden your filters to see more results." />
          ) : visible.map((o) => {
            const saved = savedOpportunities.includes(o.id);
            return (
              <article key={o.id} className="surface-card hover-lift p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/app/opportunities/${o.id}`} className="font-display text-base font-semibold hover:text-primary">
                      {o.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">{o.organization}</p>
                  </div>
                  <Button
                    variant="ghost" size="icon" aria-label="Save opportunity"
                    className={cn(saved && 'text-primary')} onClick={() => toggle('savedOpportunities', o.id)}
                  >
                    <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
                  </Button>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{o.overview}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <Badge variant="secondary">{o.type}</Badge>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {o.location} · {o.mode}</span>
                  <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> {o.stipend}</span>
                  <span>Closes {o.deadline}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                  {o.skills.map((s) => <Badge key={s} variant="outline" className="text-[11px] font-normal">{s}</Badge>)}
                  <Button size="sm" className="ml-auto" asChild><Link to={`/app/opportunities/${o.id}`}>View details</Link></Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}

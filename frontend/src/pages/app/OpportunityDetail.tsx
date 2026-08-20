import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { opportunities, organizations } from '@/mock-data';
import { useAppStore } from '@/stores/appStore';
import { ArrowLeft, Bookmark, CalendarClock, MapPin, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function OpportunityDetail() {
  const { id } = useParams();
  const opp = opportunities.find((o) => o.id === id);
  const { savedOpportunities, appliedOpportunities, toggle, add } = useAppStore();

  if (!opp) return <EmptyState title="Opportunity not found" description="This listing may have closed." />;

  const org = organizations.find((o) => o.id === opp.organizationId);
  const saved = savedOpportunities.includes(opp.id);
  const applied = appliedOpportunities.includes(opp.id);

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5" asChild>
        <Link to="/app/opportunities"><ArrowLeft className="h-4 w-4" /> All opportunities</Link>
      </Button>

      <PageHeader
        eyebrow={opp.type}
        title={opp.title}
        description={`${opp.organization} · ${opp.location} · ${opp.mode}`}
        actions={
          <>
            <Button variant="outline" size="sm" className={cn('gap-1.5', saved && 'text-primary')} onClick={() => toggle('savedOpportunities', opp.id)}>
              <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} /> {saved ? 'Saved' : 'Save'}
            </Button>
            <Button size="sm" disabled={applied} onClick={() => { add('appliedOpportunities', opp.id); toast.success('Application submitted'); }}>
              {applied ? 'Applied' : 'Apply now'}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <SectionCard title="Overview">
            <p className="text-sm leading-relaxed text-muted-foreground">{opp.overview}</p>
          </SectionCard>
          <SectionCard title="Requirements" bodyClassName="p-5">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {opp.requirements.map((r) => <li key={r} className="flex gap-2"><span className="text-primary">•</span>{r}</li>)}
            </ul>
          </SectionCard>
          <SectionCard title="Eligibility" bodyClassName="p-5">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {opp.eligibility.map((r) => <li key={r} className="flex gap-2"><span className="text-primary">•</span>{r}</li>)}
            </ul>
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <SectionCard title="At a glance" bodyClassName="p-5 space-y-3 text-sm">
            <p className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> {opp.stipend}</p>
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {opp.location}</p>
            <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" /> Closes {opp.deadline}</p>
            <p className="text-muted-foreground">Duration: {opp.duration}</p>
            <p className="text-muted-foreground">Experience: {opp.experience}</p>
          </SectionCard>

          <SectionCard title="Skills" bodyClassName="p-5">
            <div className="flex flex-wrap gap-1.5">
              {opp.skills.length ? opp.skills.map((s) => <Badge key={s} variant="outline" className="font-normal">{s}</Badge>)
                : <p className="text-sm text-muted-foreground">No specific skills required.</p>}
            </div>
          </SectionCard>

          {org && (
            <SectionCard title="About the organization" bodyClassName="p-5">
              <p className="font-medium">{org.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{org.description}</p>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link to={`/app/organizations/${org.slug}`}>View profile</Link>
              </Button>
            </SectionCard>
          )}
        </aside>
      </div>
    </>
  );
}

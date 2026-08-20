import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hackathons } from '@/mock-data';
import { useAppStore } from '@/stores/appStore';
import { ArrowLeft, CalendarDays, MapPin, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function HackathonDetail() {
  const { id } = useParams();
  const h = hackathons.find((x) => x.id === id);
  const { registeredHackathons, add } = useAppStore();

  if (!h) return <EmptyState title="Hackathon not found" icon={Trophy} />;
  const registered = registeredHackathons.includes(h.id);

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5" asChild>
        <Link to="/app/hackathons"><ArrowLeft className="h-4 w-4" /> All hackathons</Link>
      </Button>

      <PageHeader
        eyebrow={h.status}
        title={h.title}
        description={`${h.organizer} · ${h.mode} · ${h.location}`}
        actions={
          <Button
            disabled={!h.registrationOpen || registered}
            onClick={() => { add('registeredHackathons', h.id); toast.success('Registered — check messages for team formation'); }}
          >
            {registered ? 'Registered' : h.registrationOpen ? 'Register now' : 'Registration closed'}
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: CalendarDays, label: 'Dates', value: `${h.startDate} – ${h.endDate}` },
          { icon: Trophy, label: 'Prize pool', value: h.prize },
          { icon: Users, label: 'Team size', value: h.teamSize },
          { icon: MapPin, label: 'Participants', value: `${h.participants} registered` },
        ].map((s) => (
          <div key={s.label} className="surface-card flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary"><s.icon className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="truncate text-sm font-semibold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="about">
        <TabsList className="flex-wrap">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="prizes">Prizes</TabsTrigger>
          <TabsTrigger value="rules">Rules & judging</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-4 space-y-4">
          <SectionCard title="Overview">
            <p className="text-sm leading-relaxed text-muted-foreground">{h.about}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {h.tracks.map((t) => <Badge key={t} variant="secondary" className="font-normal">{t}</Badge>)}
            </div>
          </SectionCard>
          <SectionCard title="Sponsors" bodyClassName="p-5">
            <div className="flex flex-wrap gap-2">
              {h.sponsors.map((s) => <Badge key={s} variant="outline" className="font-normal">{s}</Badge>)}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <SectionCard bodyClassName="p-5 space-y-4">
            {h.timeline.map((t) => (
              <div key={t.label} className="flex items-center gap-4 border-l-2 border-primary pl-4">
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{t.label}</p></div>
                <span className="text-xs text-muted-foreground">{t.date}</span>
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        <TabsContent value="prizes" className="mt-4">
          <SectionCard bodyClassName="p-5 space-y-3">
            {h.prizes.map((p) => (
              <div key={p.place} className="flex items-center justify-between rounded-lg border border-border p-4">
                <p className="text-sm font-medium">{p.place}</p>
                <p className="text-sm text-muted-foreground">{p.reward}</p>
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        <TabsContent value="rules" className="mt-4 grid gap-4 md:grid-cols-2">
          <SectionCard title="Rules" bodyClassName="p-5">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {h.rules.map((r) => <li key={r} className="flex gap-2"><span className="text-primary">•</span>{r}</li>)}
            </ul>
          </SectionCard>
          <SectionCard title="Judging criteria" bodyClassName="p-5">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {h.judging.map((r) => <li key={r} className="flex gap-2"><span className="text-primary">•</span>{r}</li>)}
            </ul>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </>
  );
}

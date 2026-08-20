import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hackathons, institutions, opportunities, organizations, projects, suggestedPeople } from '@/mock-data';
import { compact, initials } from '@/lib/format';
import { Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Explore() {
  const [q, setQ] = useState('');
  const match = (s: string) => s.toLowerCase().includes(q.toLowerCase());

  const inst = institutions.filter((i) => match(i.name) || match(i.city));
  const orgs = organizations.filter((o) => match(o.name) || match(o.industry));
  const people = suggestedPeople.filter((p) => match(p.name) || match(p.headline));
  const projs = projects.filter((p) => match(p.title) || p.tags.some(match));
  const opps = opportunities.filter((o) => match(o.title) || match(o.organization));
  const hacks = hackathons.filter((h) => match(h.title) || match(h.organizer));

  return (
    <>
      <PageHeader eyebrow="Network" title="Explore" description="Institutions, organizations, people, projects and opportunities." />

      <div className="relative mb-5 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the network…" className="pl-9" />
      </div>

      <Tabs defaultValue="institutions">
        <TabsList className="flex-wrap">
          <TabsTrigger value="institutions">Institutions</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="hackathons">Hackathons</TabsTrigger>
        </TabsList>

        <TabsContent value="institutions" className="mt-4">
          {inst.length === 0 ? <EmptyState title="No institutions found" /> : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {inst.map((i) => (
                <Link key={i.id} to={`/app/institutions/${i.slug}`} className="surface-card hover-lift p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft font-display text-sm font-bold text-primary">
                      {initials(i.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate font-display font-semibold">
                        {i.name} {i.verified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{i.type} · {i.city}</p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{i.description}</p>
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span>{compact(i.students)} students</span>
                    <span>{compact(i.followers)} followers</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="organizations" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {orgs.map((o) => (
              <Link key={o.id} to={`/app/organizations/${o.slug}`} className="surface-card hover-lift p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft font-display text-sm font-bold text-primary">
                    {initials(o.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold">{o.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{o.type} · {o.location}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
                <Badge variant="secondary" className="mt-3">{o.industry}</Badge>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="people" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {people.map((p) => (
              <div key={p.handle} className="surface-card flex items-center gap-3 p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                  {initials(p.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.headline}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => toast.success(`Following ${p.name}`)}>Follow</Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projs.map((p) => (
              <Link key={p.id} to={`/app/projects/${p.id}`} className="surface-card hover-lift p-5">
                <Badge variant="secondary">{p.status}</Badge>
                <p className="mt-2.5 font-display font-semibold">{p.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.summary}</p>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {opps.map((o) => (
              <Link key={o.id} to={`/app/opportunities/${o.id}`} className="surface-card hover-lift p-5">
                <Badge variant="secondary">{o.type}</Badge>
                <p className="mt-2.5 font-display font-semibold">{o.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{o.organization} · {o.mode}</p>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="hackathons" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hacks.map((h) => (
              <Link key={h.id} to={`/app/hackathons/${h.id}`} className="surface-card hover-lift p-5">
                <Badge variant={h.registrationOpen ? 'default' : 'secondary'}>{h.status}</Badge>
                <p className="mt-2.5 font-display font-semibold">{h.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{h.organizer} · {h.startDate}</p>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

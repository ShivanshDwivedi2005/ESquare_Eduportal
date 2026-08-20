import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { hackathons, opportunities, organizations } from '@/mock-data';
import { compact } from '@/lib/format';
import { Briefcase, Eye, Trophy, Users } from 'lucide-react';

const applicationTrend = [
  { week: 'W1', applications: 42 }, { week: 'W2', applications: 68 }, { week: 'W3', applications: 91 },
  { week: 'W4', applications: 124 }, { week: 'W5', applications: 158 }, { week: 'W6', applications: 203 },
];

export default function OrgDashboard() {
  const org = organizations[0];
  const orgOpps = opportunities.filter((o) => o.organizationId === org.id);

  return (
    <>
      <PageHeader eyebrow="Organization" title={org.name} description={`${org.industry} · ${org.location} · ${org.publicId}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active listings" value={orgOpps.length} icon={Briefcase} hint="Open for applications" />
        <StatCard label="Applications" value={203} delta="+28%" trend="up" icon={Users} hint="Last 6 weeks" />
        <StatCard label="Profile views" value={compact(org.followers)} delta="+9%" trend="up" icon={Eye} />
        <StatCard label="Hackathons hosted" value={hackathons.filter((h) => h.organizerId === org.id).length} icon={Trophy} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Application volume" description="Weekly, across all listings" bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={applicationTrend}>
              <defs>
                <linearGradient id="apps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="applications" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#apps)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard
          title="Your listings"
          action={<Button variant="ghost" size="sm" asChild><Link to="/organization/opportunities">Manage</Link></Button>}
          bodyClassName="p-4 space-y-2.5"
        >
          {orgOpps.map((o) => (
            <div key={o.id} className="rounded-lg border border-border p-3">
              <p className="truncate text-sm font-medium">{o.title}</p>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Closes {o.deadline}</p>
                <Badge variant="secondary" className="text-[10px]">{o.type}</Badge>
              </div>
            </div>
          ))}
        </SectionCard>
      </div>
    </>
  );
}

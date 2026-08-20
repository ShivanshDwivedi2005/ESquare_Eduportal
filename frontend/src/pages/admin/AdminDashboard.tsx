import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  admissionApplications, departmentPerformance, employees, institutionEnrolment, institutions,
  revenueSeries, transactions,
} from '@/mock-data';
import { compact, inr } from '@/lib/format';
import { GraduationCap, School, Users, Wallet } from 'lucide-react';

const tooltipStyle = { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 };

export default function AdminDashboard() {
  const inst = institutions[0];
  const revenue = revenueSeries.at(-1)!;

  return (
    <>
      <PageHeader eyebrow="Institution" title={inst.name} description={`${inst.type} · ${inst.city} · ESQUARE ID ${inst.publicId}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enrolled students" value={compact(inst.students)} delta="+0.8%" trend="up" icon={GraduationCap} hint="vs last month" />
        <StatCard label="Staff on roll" value={employees.length * 34} delta="+6" trend="up" icon={Users} hint="Faculty and support" />
        <StatCard label="Open applications" value={admissionApplications.filter((a) => a.status === 'Applications').length} icon={School} hint="Awaiting review" />
        <StatCard label="August revenue" value={inr(revenue.revenue)} delta="+17%" trend="up" icon={Wallet} hint="Fees and grants" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Revenue vs expense" description="Last six months" bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => `${v / 100000}L`} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => inr(v)} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Enrolment growth" bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={institutionEnrolment}>
              <defs>
                <linearGradient id="enrol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[5600, 6400]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={42} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#enrol)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Department performance" bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={departmentPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="department" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="average" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard
          title="Recent transactions"
          action={<Button variant="ghost" size="sm" asChild><Link to="/admin/finance">View all</Link></Button>}
          bodyClassName="p-4 space-y-3"
        >
          {transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.date} · {t.category}</p>
              </div>
              <span className={t.direction === 'in' ? 'text-sm font-semibold text-success' : 'text-sm font-semibold text-destructive'}>
                {t.direction === 'in' ? '+' : '−'}{inr(t.amount)}
              </span>
            </div>
          ))}
        </SectionCard>
      </div>

      <SectionCard
        className="mt-4"
        title="Latest applications"
        action={<Button variant="ghost" size="sm" asChild><Link to="/admin/admissions">Open pipeline</Link></Button>}
        bodyClassName="p-4 space-y-3"
      >
        {admissionApplications.slice(0, 4).map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.applicant}</p>
              <p className="truncate text-xs text-muted-foreground">{a.program} · applied {a.appliedOn}</p>
            </div>
            <Badge variant="secondary">{a.status}</Badge>
          </div>
        ))}
      </SectionCard>
    </>
  );
}

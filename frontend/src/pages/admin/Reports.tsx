import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/ui/button';
import { departmentPerformance, institutionEnrolment } from '@/mock-data';
import { Download, FileBarChart } from 'lucide-react';
import { toast } from 'sonner';

const reports = [
  { title: 'Term attendance summary', desc: 'Department-wise attendance for Term 6', period: 'Aug 2026' },
  { title: 'Assessment performance report', desc: 'Internal and external assessment distribution', period: 'Aug 2026' },
  { title: 'Admissions funnel report', desc: 'Applications, approvals and enrolment conversion', period: 'Jul – Aug 2026' },
  { title: 'Payroll and expense statement', desc: 'Monthly payroll run with expense breakdown', period: 'Aug 2026' },
  { title: 'Placement and internship report', desc: 'Student placements by organization and package', period: '2025 – 2026' },
];

export default function AdminReports() {
  return (
    <>
      <PageHeader eyebrow="Institution" title="Reports" description="Generate and download institutional reports." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reports generated" value={128} hint="This academic year" />
        <StatCard label="Average attendance" value="83%" delta="-1.1%" trend="down" />
        <StatCard label="Average score" value="71%" delta="+2.4%" trend="up" />
        <StatCard label="Enrolment" value="6,200" delta="+0.8%" trend="up" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Enrolment trend" bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={institutionEnrolment}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[5600, 6400]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={42} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Department averages" bodyClassName="p-5 space-y-3">
          {departmentPerformance.map((d) => (
            <div key={d.department} className="flex items-center justify-between border-b border-border pb-2.5 last:border-0">
              <p className="text-sm font-medium">{d.department}</p>
              <p className="text-sm text-muted-foreground">{d.attendance}% attendance · {d.average}% average</p>
            </div>
          ))}
        </SectionCard>
      </div>

      <SectionCard className="mt-4" title="Available reports" bodyClassName="p-4 space-y-2">
        {reports.map((r) => (
          <div key={r.title} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3.5">
            <FileBarChart className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.title}</p>
              <p className="truncate text-xs text-muted-foreground">{r.desc} · {r.period}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success('Report download started')}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        ))}
      </SectionCard>
    </>
  );
}

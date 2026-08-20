import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { marksTrend, studentProfile, subjects } from '@/mock-data';
import { Download } from 'lucide-react';

const tooltipStyle = { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 };

export default function Marks() {
  const perSubject = subjects.map((s) => ({
    name: s.code,
    total: s.marks.internal + s.marks.external + s.marks.assignment + s.marks.practical,
  }));
  const best = [...subjects].sort((a, b) => b.marks.external - a.marks.external)[0];

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Marks & performance"
        description="Assessment breakdown for the current term with historical GPA."
        actions={<Button variant="outline" size="sm" className="gap-1.5"><Download className="h-4 w-4" /> Export report</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall average" value={`${studentProfile.cgpa}%`} delta="+2.4%" trend="up" />
        <StatCard label="Term average" value={`${studentProfile.termGpa}%`} delta="+2.0%" trend="up" />
        <StatCard label="Best subject" value={best.code} hint={best.name} />
        <StatCard label="Periods per week" value={subjects.reduce((a, s) => a + s.periods, 0)} hint="This term" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="GPA progression" bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={marksTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="sem" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[60, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="gpa" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Marks by subject" bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={perSubject}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      <SectionCard className="mt-4" title="Detailed marksheet" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Internal</TableHead>
                <TableHead className="text-right">External</TableHead>
                <TableHead className="text-right">Assignment</TableHead>
                <TableHead className="text-right">Practical</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s) => {
                const total = s.marks.internal + s.marks.external + s.marks.assignment + s.marks.practical;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.code}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className="text-right">{s.marks.internal}</TableCell>
                    <TableCell className="text-right">{s.marks.external}</TableCell>
                    <TableCell className="text-right">{s.marks.assignment}</TableCell>
                    <TableCell className="text-right">{s.marks.practical}</TableCell>
                    <TableCell className="text-right font-semibold">{total}</TableCell>
                    <TableCell className="text-right"><Badge variant="secondary">{s.marks.grade}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </>
  );
}

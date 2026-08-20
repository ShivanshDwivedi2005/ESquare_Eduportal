import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { attendanceCalendar, attendanceTrend, classRoster, subjects, teacherClasses } from '@/mock-data';
import { useAuthStore } from '@/stores/authStore';
import { pct } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusClass: Record<string, string> = {
  present: 'bg-success/15 text-success border-success/30',
  absent: 'bg-destructive/15 text-destructive border-destructive/30',
  late: 'bg-warning/15 text-warning border-warning/30',
  holiday: 'bg-muted text-muted-foreground border-border',
};

function StudentAttendance() {
  const attended = subjects.reduce((a, s) => a + s.attendance.attended, 0);
  const total = subjects.reduce((a, s) => a + s.attendance.total, 0);
  const overall = pct(attended, total);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall" value={`${overall}%`} delta="+1.4%" trend="up" hint="Requirement: 75%" />
        <StatCard label="Classes attended" value={attended} hint={`of ${total} held`} />
        <StatCard label="Absences" value={total - attended} trend="down" />
        <StatCard label="Subjects below 75%" value={subjects.filter((s) => pct(s.attendance.attended, s.attendance.total) < 75).length} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Monthly trend" bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={attendanceTrend}>
              <defs>
                <linearGradient id="attx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[60, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#attx)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="August 2026" description="Daily record" bodyClassName="p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {attendanceCalendar.map((d) => (
              <div
                key={d.date}
                title={`${d.date} · ${d.status}`}
                className={cn('flex aspect-square items-center justify-center rounded-md border text-[11px] font-medium', statusClass[d.status])}
              >
                {Number(d.date.slice(-2))}
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {['present', 'absent', 'late', 'holiday'].map((s) => (
              <span key={s} className="flex items-center gap-1.5 capitalize">
                <span className={cn('h-2.5 w-2.5 rounded-sm border', statusClass[s])} />{s}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="mt-4" title="Subject-wise attendance" bodyClassName="p-5 space-y-4">
        {subjects.map((s) => {
          const p = pct(s.attendance.attended, s.attendance.total);
          return (
            <div key={s.id}>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{s.code} · {s.name}</span>
                <span className="text-muted-foreground">
                  {s.attendance.attended}/{s.attendance.total} ·{' '}
                  <span className={p < 75 ? 'font-semibold text-destructive' : 'font-semibold text-foreground'}>{p}%</span>
                </span>
              </div>
              <Progress value={p} className="h-1.5" />
            </div>
          );
        })}
      </SectionCard>
    </>
  );
}

function TeacherAttendance() {
  const [selected, setSelected] = useState(teacherClasses[0].id);
  const [marks, setMarks] = useState<Record<string, 'present' | 'absent'>>(
    Object.fromEntries(classRoster.map((s) => [s.id, 'present'])),
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {teacherClasses.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={cn(
              'rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors',
              selected === c.id ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {c.subject} · {c.section}
          </button>
        ))}
      </div>

      <SectionCard
        title="Mark attendance"
        description={teacherClasses.find((c) => c.id === selected)?.time}
        action={<Button size="sm" onClick={() => toast.success('Attendance submitted')}>Submit</Button>}
        bodyClassName="p-0"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead className="hidden sm:table-cell">ID</TableHead>
              <TableHead className="hidden sm:table-cell">Term attendance</TableHead>
              <TableHead className="text-right">Today</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classRoster.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{s.publicId}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={s.attendance < 75 ? 'destructive' : 'secondary'}>{s.attendance}%</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex gap-1">
                    {(['present', 'absent'] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setMarks((m) => ({ ...m, [s.id]: v }))}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                          marks[s.id] === v
                            ? v === 'present' ? 'border-success bg-success/15 text-success' : 'border-destructive bg-destructive/15 text-destructive'
                            : 'border-border text-muted-foreground',
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </>
  );
}

export default function Attendance() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'teacher';
  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Attendance"
        description={isTeacher ? 'Mark and review attendance for your sections.' : 'Your attendance record across all subjects.'}
      />
      {isTeacher ? <TeacherAttendance /> : <StudentAttendance />}
    </>
  );
}

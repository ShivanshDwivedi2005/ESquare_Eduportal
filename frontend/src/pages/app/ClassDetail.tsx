import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { subjects } from '@/mock-data';
import { pct } from '@/lib/format';
import { ArrowLeft, Download, FileText } from 'lucide-react';

export default function ClassDetail() {
  const { id } = useParams();
  const subject = subjects.find((s) => s.id === id);

  if (!subject) {
    return <EmptyState title="Class not found" description="This subject is not part of your current term." />;
  }

  const attendance = pct(subject.attendance.attended, subject.attendance.total);
  const total = subject.marks.internal + subject.marks.external + subject.marks.assignment + subject.marks.practical;

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5" asChild>
        <Link to="/app/classes"><ArrowLeft className="h-4 w-4" /> All classes</Link>
      </Button>

      <PageHeader
        eyebrow={subject.code}
        title={subject.name}
        description={`${subject.faculty} · ${subject.periods} periods/week · ${subject.room}`}
        actions={<Badge variant="secondary">Grade {subject.marks.grade}</Badge>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance" value={`${attendance}%`} hint={`${subject.attendance.attended}/${subject.attendance.total} classes`} />
        <StatCard label="Total marks" value={total} hint="Across all components" />
        <StatCard label="Assignments due" value={subject.assignments.filter((a) => a.status === 'Pending').length} />
        <StatCard label="Classmates" value={subject.classmates} />
      </div>

      <Tabs defaultValue="materials">
        <TabsList>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="marks">Marks</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-4">
          <SectionCard bodyClassName="p-3 space-y-1">
            {subject.materials.map((m) => (
              <div key={m.title} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-muted">
                <FileText className="h-4 w-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.type} · {m.date}</p>
                </div>
                <Button variant="ghost" size="icon" aria-label={`Download ${m.title}`}><Download className="h-4 w-4" /></Button>
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <SectionCard bodyClassName="p-3 space-y-1">
            {subject.assignments.map((a) => (
              <div key={a.title} className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-surface-muted">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">Due {a.due}{a.score ? ` · Scored ${a.score}` : ''}</p>
                </div>
                <Badge variant={a.status === 'Pending' ? 'destructive' : a.status === 'Graded' ? 'secondary' : 'outline'}>{a.status}</Badge>
                {a.status === 'Pending' && <Button size="sm">Submit</Button>}
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        <TabsContent value="marks" className="mt-4">
          <SectionCard bodyClassName="p-5">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Internal', subject.marks.internal, 30], ['External', subject.marks.external, 70],
                ['Assignment', subject.marks.assignment, 20], ['Practical', subject.marks.practical, 30],
              ].map(([label, value, max]) => (
                <div key={label as string} className="rounded-lg border border-border p-4">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-1.5 font-display text-xl font-bold">{value}<span className="text-sm font-normal text-muted-foreground"> / {max}</span></dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </TabsContent>

        <TabsContent value="announcements" className="mt-4">
          <SectionCard bodyClassName="p-5 space-y-4">
            {subject.announcements.map((a) => (
              <div key={a.title} className="border-l-2 border-primary pl-4">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.date}</p>
              </div>
            ))}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </>
  );
}

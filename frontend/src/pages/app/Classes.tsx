import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { subjects } from '@/mock-data';
import { pct } from '@/lib/format';
import { Users } from 'lucide-react';

export default function Classes() {
  return (
    <>
      <PageHeader title="My classes" description="Subjects, teacher, materials and assessment for this term." eyebrow="Academics" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {subjects.map((s) => {
          const p = pct(s.attendance.attended, s.attendance.total);
          return (
            <Link key={s.id} to={`/app/classes/${s.id}`} className="surface-card hover-lift block p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{s.code}</p>
                  <h2 className="mt-0.5 truncate font-display text-base font-semibold">{s.name}</h2>
                </div>
                <Badge variant={p < 75 ? 'destructive' : 'secondary'}>{s.marks.grade}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.faculty}</p>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">Attendance</span>
                  <span className={p < 75 ? 'font-medium text-destructive' : 'font-medium'}>{p}%</span>
                </div>
                <Progress value={p} className="h-1.5" />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>{s.periods} periods/week · {s.room}</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {s.classmates}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

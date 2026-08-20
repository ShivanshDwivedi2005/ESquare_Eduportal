import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { departmentPerformance, institutions } from '@/mock-data';
import { Plus } from 'lucide-react';

export default function AdminDepartments() {
  const inst = institutions[0];

  return (
    <>
      <PageHeader
        eyebrow="Institution"
        title="Departments"
        description="Academic units, programmes and performance."
        actions={<Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New department</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {inst.departments.map((d, i) => {
          const perf = departmentPerformance[i % departmentPerformance.length];
          return (
            <SectionCard key={d} title={d} description={`${120 + i * 37} students · ${8 + i} teacher`} bodyClassName="p-5 space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">Attendance</span><span className="font-medium">{perf.attendance}%</span></div>
                <Progress value={perf.attendance} className="h-1.5" />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">Average score</span><span className="font-medium">{perf.average}%</span></div>
                <Progress value={perf.average} className="h-1.5" />
              </div>
              <Button variant="outline" size="sm" className="w-full">Manage department</Button>
            </SectionCard>
          );
        })}
      </div>
    </>
  );
}

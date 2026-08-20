import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { employees } from '@/mock-data';
import { Search, UserPlus } from 'lucide-react';

export default function AdminTeachers() {
  const [q, setQ] = useState('');
  const faculty = employees.filter((e) => e.kind === 'Faculty' && e.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader
        eyebrow="Institution"
        title="Teachers"
        description="Teacher directory, departments and teaching load."
        actions={<Button size="sm" className="gap-1.5"><UserPlus className="h-4 w-4" /> Add teacher</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Teaching staff" value={318} delta="+4" trend="up" />
        <StatCard label="Average attendance" value="93%" />
        <StatCard label="On leave" value={employees.filter((e) => e.status === 'On leave').length} />
        <StatCard label="Student–teacher ratio" value="19:1" />
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search teacher…" className="pl-9" />
      </div>

      <SectionCard bodyClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Attendance</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faculty.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="text-muted-foreground">{e.publicId}</TableCell>
                  <TableCell>{e.role}</TableCell>
                  <TableCell className="text-muted-foreground">{e.department}</TableCell>
                  <TableCell className="text-right">{e.attendance}%</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={e.status === 'Active' ? 'secondary' : 'outline'}>{e.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </>
  );
}

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { classRoster, institutions } from '@/mock-data';
import { Download, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const departments = ['All', ...institutions[0].departments];

export default function AdminStudents() {
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('All');

  const rows = classRoster.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.publicId.includes(q));

  return (
    <>
      <PageHeader
        eyebrow="Institution"
        title="Students"
        description="Enrolled student directory with attendance and assessment signal."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success('Export queued')}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button size="sm" className="gap-1.5"><UserPlus className="h-4 w-4" /> Add student</Button>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total enrolled" value="6,200" delta="+48" trend="up" />
        <StatCard label="Average attendance" value="84%" delta="-1.2%" trend="down" />
        <StatCard label="Below 75% attendance" value={classRoster.filter((s) => s.attendance < 75).length} />
        <StatCard label="Departments" value={institutions[0].departments.length} />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or enrolment ID…" className="pl-9" />
        </div>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <SectionCard bodyClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Enrolment ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Attendance</TableHead>
                <TableHead className="text-right">Last assessment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.publicId}</TableCell>
                  <TableCell className="text-muted-foreground">Computer Science</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={s.attendance < 75 ? 'destructive' : 'secondary'}>{s.attendance}%</Badge>
                  </TableCell>
                  <TableCell className="text-right">{s.lastScore}/20</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
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

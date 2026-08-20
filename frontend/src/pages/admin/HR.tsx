import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { employees } from '@/mock-data';
import { inr } from '@/lib/format';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const leaveRequests = [
  { id: 'lv-1', name: 'Dr. Neha Bansal', type: 'Medical leave', period: '19 Aug – 26 Aug', status: 'Pending' },
  { id: 'lv-2', name: 'Prof. Rohit Kulkarni', type: 'Conference travel', period: '02 Sep – 05 Sep', status: 'Pending' },
  { id: 'lv-3', name: 'Lakshmi Pillai', type: 'Casual leave', period: '28 Aug', status: 'Approved' },
];

export default function AdminHR() {
  return (
    <>
      <PageHeader
        eyebrow="Institution"
        title="Human resources"
        description="Employee records, leave approvals and payroll cycles."
        actions={<Button size="sm" className="gap-1.5"><UserPlus className="h-4 w-4" /> Add employee</Button>}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total employees" value={412} delta="+6" trend="up" />
        <StatCard label="Pending leave requests" value={leaveRequests.filter((l) => l.status === 'Pending').length} />
        <StatCard label="Monthly payroll" value={inr(3140000)} hint="August run" />
        <StatCard label="Attrition (12m)" value="4.2%" delta="-0.6%" trend="up" />
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="leave">Leave requests</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="mt-4">
          <SectionCard bodyClassName="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Staff ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell className="text-muted-foreground">{e.publicId}</TableCell>
                      <TableCell>{e.role}</TableCell>
                      <TableCell className="text-muted-foreground">{e.department}</TableCell>
                      <TableCell className="text-muted-foreground">{e.joined}</TableCell>
                      <TableCell className="text-right"><Badge variant={e.status === 'Active' ? 'secondary' : 'outline'}>{e.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="leave" className="mt-4">
          <SectionCard bodyClassName="p-4 space-y-3">
            {leaveRequests.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.type} · {l.period}</p>
                </div>
                {l.status === 'Pending' ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toast.success('Leave declined')}>Decline</Button>
                    <Button size="sm" onClick={() => toast.success('Leave approved')}>Approve</Button>
                  </div>
                ) : <Badge variant="secondary">{l.status}</Badge>}
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          <SectionCard title="August payroll run" description="Processed 01 Aug 2026" bodyClassName="p-5 space-y-3">
            {[['Faculty salaries', 2280000], ['Support staff salaries', 640000], ['Allowances', 220000]].map(([label, amount]) => (
              <div key={label as string} className="flex items-center justify-between border-b border-border pb-2.5 last:border-0">
                <p className="text-sm">{label}</p>
                <p className="text-sm font-semibold">{inr(amount as number)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <p className="font-display font-semibold">Total</p>
              <p className="font-display font-bold">{inr(3140000)}</p>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </>
  );
}

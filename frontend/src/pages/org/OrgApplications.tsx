import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Status = 'New' | 'Shortlisted' | 'Interview' | 'Offered' | 'Rejected';

const seed = [
  { id: 'ap-1', name: 'Rahul Verma', role: 'Software Engineering Intern', institution: 'Greenwood International School', cgpa: 8.62, skills: ['React', 'TypeScript'], status: 'New' as Status },
  { id: 'ap-2', name: 'Sneha Pillai', role: 'Software Engineering Intern', institution: 'Riverdale Public School', cgpa: 9.04, skills: ['Python', 'PyTorch'], status: 'Shortlisted' as Status },
  { id: 'ap-3', name: 'Arjun Mehta', role: 'Frontend Engineer (Fresher)', institution: 'Greenwood International School', cgpa: 8.11, skills: ['React', 'CSS'], status: 'Interview' as Status },
  { id: 'ap-4', name: 'Divya Menon', role: 'Freelance React Developer', institution: 'Greenwood International School', cgpa: 8.45, skills: ['React', 'Charts'], status: 'Offered' as Status },
  { id: 'ap-5', name: 'Imran Qureshi', role: 'Software Engineering Intern', institution: 'Riverdale Public School', cgpa: 7.35, skills: ['Java'], status: 'Rejected' as Status },
];

const stages: (Status | 'All')[] = ['All', 'New', 'Shortlisted', 'Interview', 'Offered', 'Rejected'];

export default function OrgApplications() {
  const [rows, setRows] = useState(seed);
  const [stage, setStage] = useState<Status | 'All'>('All');

  const visible = rows.filter((r) => stage === 'All' || r.status === stage);
  const move = (id: string, status: Status) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    toast.success(`Candidate moved to ${status}`);
  };

  return (
    <>
      <PageHeader eyebrow="Organization" title="Applications" description="Review and progress candidates across your listings." />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applications" value={203} delta="+28%" trend="up" />
        <StatCard label="Shortlisted" value={38} />
        <StatCard label="In interview" value={14} />
        <StatCard label="Offers extended" value={6} />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {stages.map((s) => (
          <button
            key={s}
            onClick={() => setStage(s)}
            className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              stage === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground')}
          >
            {s}
          </button>
        ))}
      </div>

      <SectionCard bodyClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Applied for</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead className="text-right">Overall %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.skills.join(' · ')}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.role}</TableCell>
                  <TableCell className="text-muted-foreground">{r.institution}</TableCell>
                  <TableCell className="text-right">{r.cgpa}</TableCell>
                  <TableCell><Badge variant={r.status === 'Rejected' ? 'destructive' : 'secondary'}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => move(r.id, 'Shortlisted')}>Shortlist</Button>
                      <Button size="sm" variant="ghost" onClick={() => move(r.id, 'Rejected')}>Reject</Button>
                    </div>
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

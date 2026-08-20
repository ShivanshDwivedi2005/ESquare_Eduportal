import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { opportunities, organizations } from '@/mock-data';
import type { Opportunity, OpportunityType } from '@/types';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const types: OpportunityType[] = ['Internship', 'Job', 'Freelance', 'Workshop', 'Competition', 'Scholarship', 'Research'];

export default function OrgOpportunities() {
  const org = organizations[0];
  const [items, setItems] = useState<Opportunity[]>(opportunities.filter((o) => o.organizationId === org.id));
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<OpportunityType>('Internship');
  const [overview, setOverview] = useState('');

  const create = () => {
    if (!title.trim()) return;
    setItems((prev) => [
      {
        id: `o-${Date.now()}`, title, organization: org.name, organizationId: org.id, type, mode: 'Remote',
        location: org.location, duration: '3 months', stipend: 'To be discussed', paid: true, experience: 'Fresher',
        skills: [], deadline: '30 Sep 2026', overview, requirements: [], eligibility: [],
      },
      ...prev,
    ]);
    setTitle(''); setOverview(''); setOpen(false);
    toast.success('Listing published');
  };

  return (
    <>
      <PageHeader
        eyebrow="Organization"
        title="Opportunities"
        description="Create and manage listings visible to verified students."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-1.5"><Plus className="h-4 w-4" /> New listing</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Publish an opportunity</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label htmlFor="o-title">Title</Label><Input id="o-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label htmlFor="o-type">Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as OpportunityType)}>
                    <SelectTrigger id="o-type"><SelectValue /></SelectTrigger>
                    <SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label htmlFor="o-overview">Overview</Label><Textarea id="o-overview" value={overview} onChange={(e) => setOverview(e.target.value)} /></div>
              </div>
              <DialogFooter><Button onClick={create}>Publish</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <SectionCard bodyClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-right">Applications</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((o, i) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.title}</TableCell>
                  <TableCell><Badge variant="secondary">{o.type}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{o.mode}</TableCell>
                  <TableCell className="text-muted-foreground">{o.deadline}</TableCell>
                  <TableCell className="text-right">{[86, 54, 63][i] ?? 12}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm">Edit</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </>
  );
}

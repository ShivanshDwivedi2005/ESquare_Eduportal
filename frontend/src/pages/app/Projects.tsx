import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { projects as seed } from '@/mock-data';
import type { Project, ProjectStatus } from '@/types';
import { Plus, Search, Users } from 'lucide-react';
import { toast } from 'sonner';

const statuses: (ProjectStatus | 'All')[] = ['All', 'Idea', 'Recruiting', 'In Development', 'Completed'];

export default function Projects() {
  const [items, setItems] = useState<Project[]>(seed);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<ProjectStatus | 'All'>('All');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const visible = items.filter(
    (p) => (status === 'All' || p.status === status) &&
      (p.title.toLowerCase().includes(q.toLowerCase()) || p.tags.some((t) => t.includes(q.toLowerCase()))),
  );

  const create = () => {
    if (!title.trim()) return;
    setItems((prev) => [
      {
        id: `pr-${Date.now()}`, title, summary, description: summary, status: 'Idea', stack: [], tags: [],
        institution: 'Greenwood International School', creatorId: 'u-stu-1', creatorName: 'Rahul Verma',
        team: [{ name: 'Rahul Verma', role: 'Creator' }], teamSize: 4, openRoles: [], updates: [],
      },
      ...prev,
    ]);
    setTitle(''); setSummary(''); setOpen(false);
    toast.success('Project created');
  };

  return (
    <>
      <PageHeader
        eyebrow="Network"
        title="Projects"
        description="Student and faculty projects — publish your work or join a team."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-1.5"><Plus className="h-4 w-4" /> New project</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a project</DialogTitle>
                <DialogDescription>Publish an idea and start recruiting collaborators.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="p-title">Title</Label>
                  <Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Smart attendance kiosk" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-summary">Summary</Label>
                  <Textarea id="p-summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What are you building and why?" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={create}>Create project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects and tags…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus | 'All')}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No projects match your filters" description="Try a different status or search term." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <Link key={p.id} to={`/app/projects/${p.id}`} className="surface-card hover-lift flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <Badge variant={p.status === 'Recruiting' ? 'default' : 'secondary'}>{p.status}</Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {p.team.length}/{p.teamSize}
                </span>
              </div>
              <h2 className="mt-3 font-display text-base font-semibold">{p.title}</h2>
              <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted-foreground">{p.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.stack.slice(0, 4).map((s) => <Badge key={s} variant="outline" className="text-[11px] font-normal">{s}</Badge>)}
              </div>
              {p.openRoles.length > 0 && (
                <p className="mt-3 border-t border-border pt-3 text-xs text-primary">Open roles: {p.openRoles.join(', ')}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

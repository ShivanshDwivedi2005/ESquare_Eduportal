import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { projects } from '@/mock-data';
import { useAppStore } from '@/stores/appStore';
import { initials } from '@/lib/format';
import { ArrowLeft, ExternalLink, Github } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectDetail() {
  const { id } = useParams();
  const project = projects.find((p) => p.id === id);
  const { joinRequests, add } = useAppStore();

  if (!project) return <EmptyState title="Project not found" description="It may have been archived by its creator." />;
  const requested = joinRequests.includes(project.id);

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-1.5" asChild>
        <Link to="/app/projects"><ArrowLeft className="h-4 w-4" /> All projects</Link>
      </Button>

      <PageHeader
        eyebrow={project.status}
        title={project.title}
        description={`${project.creatorName} · ${project.institution}`}
        actions={
          <>
            {project.repoUrl && (
              <Button variant="outline" size="sm" className="gap-1.5"><Github className="h-4 w-4" /> Repository</Button>
            )}
            {project.demoUrl && (
              <Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="h-4 w-4" /> Live demo</Button>
            )}
            <Button
              size="sm"
              disabled={requested || project.openRoles.length === 0}
              onClick={() => { add('joinRequests', project.id); toast.success('Join request sent to the project lead'); }}
            >
              {requested ? 'Request sent' : project.openRoles.length ? 'Request to join' : 'Team full'}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <SectionCard title="About this project">
            <p className="text-sm leading-relaxed text-muted-foreground">{project.description}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.tags.map((t) => <Badge key={t} variant="secondary" className="font-normal">#{t}</Badge>)}
            </div>
          </SectionCard>

          <SectionCard title="Progress updates" bodyClassName="p-5 space-y-4">
            {project.updates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No updates published yet.</p>
            ) : project.updates.map((u) => (
              <div key={u.date} className="border-l-2 border-primary pl-4">
                <p className="text-xs font-medium text-muted-foreground">{u.date}</p>
                <p className="text-sm">{u.text}</p>
              </div>
            ))}
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <SectionCard title="Tech stack" bodyClassName="p-5">
            <div className="flex flex-wrap gap-1.5">
              {project.stack.map((s) => <Badge key={s} variant="outline" className="font-normal">{s}</Badge>)}
            </div>
          </SectionCard>

          <SectionCard title={`Team (${project.team.length}/${project.teamSize})`} bodyClassName="p-4 space-y-3">
            {project.team.map((m) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                  {initials(m.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.role}</p>
                </div>
              </div>
            ))}
          </SectionCard>

          {project.openRoles.length > 0 && (
            <SectionCard title="Open roles" bodyClassName="p-4 space-y-2">
              {project.openRoles.map((r) => (
                <div key={r} className="rounded-lg border border-border px-3 py-2 text-sm">{r}</div>
              ))}
            </SectionCard>
          )}
        </aside>
      </div>
    </>
  );
}

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { admissionApplications } from '@/mock-data';
import type { AdmissionApplication } from '@/types';
import { toast } from 'sonner';

const stages: AdmissionApplication['status'][] = ['Applications', 'Approved', 'Waitlisted', 'Rejected', 'Enrolled'];

export default function AdminAdmissions() {
  const [apps, setApps] = useState(admissionApplications);
  const [selected, setSelected] = useState<AdmissionApplication | null>(null);

  const move = (id: string, status: AdmissionApplication['status']) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setSelected(null);
    toast.success(`Application moved to ${status}`);
  };

  return (
    <>
      <PageHeader eyebrow="Institution" title="Admissions" description="Application pipeline from enquiry to enrolment." />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applications" value={apps.length * 68} delta="+112" trend="up" />
        <StatCard label="Approved" value={apps.filter((a) => a.status === 'Approved').length * 41} />
        <StatCard label="Enrolled" value={apps.filter((a) => a.status === 'Enrolled').length * 39} />
        <StatCard label="Conversion" value="46%" delta="+3.1%" trend="up" />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {stages.map((stage) => (
          <section key={stage} className="rounded-xl border border-border bg-surface-muted p-3">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold uppercase tracking-wide">{stage}</h2>
              <Badge variant="secondary" className="text-[10px]">{apps.filter((a) => a.status === stage).length}</Badge>
            </header>
            <div className="space-y-2">
              {apps.filter((a) => a.status === stage).map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-ring/40"
                >
                  <p className="truncate text-sm font-medium">{a.applicant}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.program}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{a.score}</p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.applicant}</SheetTitle>
                <SheetDescription>{selected.program} · applied {selected.appliedOn}</SheetDescription>
              </SheetHeader>
              <dl className="mt-6 space-y-4 text-sm">
                {[
                  ['Email', selected.email], ['Phone', selected.phone], ['Entrance score', selected.score],
                  ['Reviewer', selected.reviewer], ['Notes', selected.notes],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5">{v}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Documents</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {selected.documents.map((d) => <Badge key={d} variant="outline" className="font-normal">{d}</Badge>)}
                  </dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => move(selected.id, 'Approved')}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => move(selected.id, 'Waitlisted')}>Waitlist</Button>
                <Button size="sm" variant="destructive" onClick={() => move(selected.id, 'Rejected')}>Reject</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

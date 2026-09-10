import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, Clock3, FileCheck2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/common/Loading';
import { apiErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/stores/authStore';
import {
  institutionRequestsApi,
  type BoardOption,
  type CreateInstitutionRequestInput,
  type InstitutionRegistrationRequest,
  type InstitutionType,
  type RegistrationRequestStatus,
} from '@/services/institutionRequests';

const institutionTypes: Array<{ value: InstitutionType; label: string }> = [
  { value: 'SCHOOL', label: 'School' },
  { value: 'COLLEGE', label: 'College' },
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'COACHING', label: 'Coaching institute' },
  { value: 'OTHER', label: 'Other institution' },
];

const statusPresentation: Record<RegistrationRequestStatus, { label: string; className: string }> = {
  PENDING: { label: 'Submitted', className: 'border-amber-300 bg-amber-50 text-amber-800' },
  UNDER_REVIEW: { label: 'Under review', className: 'border-blue-300 bg-blue-50 text-blue-800' },
  APPROVED: { label: 'Approved', className: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  REJECTED: { label: 'Needs a new application', className: 'border-red-300 bg-red-50 text-red-800' },
  CANCELLED: { label: 'Cancelled', className: 'border-border bg-muted text-muted-foreground' },
};

const initialForm: CreateInstitutionRequestInput = {
  institutionName: '',
  institutionType: 'SCHOOL',
  registrationNumber: '',
  officialEmail: '',
  officialPhone: '+91',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
};

function RequestSummary({ request }: { request: InstitutionRegistrationRequest }) {
  const status = statusPresentation[request.status];
  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-lg">{request.institutionName}</CardTitle>
          <CardDescription className="mt-1">
            Submitted {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(request.createdAt))}
          </CardDescription>
        </div>
        <Badge variant="outline" className={status.className}>{status.label}</Badge>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <p><span className="text-muted-foreground">Official email:</span> {request.officialEmail}</p>
        <p><span className="text-muted-foreground">Location:</span> {request.city}, {request.state}</p>
        {request.registrationNumber && <p><span className="text-muted-foreground">Registration number:</span> {request.registrationNumber}</p>}
        {request.rejectionReason && (
          <Alert variant="destructive" className="sm:col-span-2">
            <AlertTitle>Review feedback</AlertTitle>
            <AlertDescription>{request.rejectionReason}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default function SchoolRegistration() {
  const user = useAuthStore((state) => state.user);
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [requests, setRequests] = useState<InstitutionRegistrationRequest[]>([]);
  const [form, setForm] = useState<CreateInstitutionRequestInput>(() => ({
    ...initialForm,
    officialEmail: user?.email ?? '',
  }));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const activeRequest = useMemo(
    () => requests.find((request) => request.status === 'PENDING' || request.status === 'UNDER_REVIEW'),
    [requests],
  );

  useEffect(() => {
    let cancelled = false;
    void Promise.all([institutionRequestsApi.listBoards(), institutionRequestsApi.listMine()])
      .then(([boardItems, requestItems]) => {
        if (cancelled) return;
        setBoards(boardItems);
        setRequests(requestItems);
      })
      .catch((error) => {
        if (!cancelled) toast.error(apiErrorMessage(error, 'School registration could not be loaded.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const update = <K extends keyof CreateInstitutionRequestInput,>(
    key: K,
    value: CreateInstitutionRequestInput[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || activeRequest) return;
    if (!/^\+[1-9]\d{7,14}$/.test(form.officialPhone)) {
      toast.error('Enter the official phone number with country code, for example +919876543210.');
      return;
    }

    setSubmitting(true);
    try {
      const request = await institutionRequestsApi.create({
        ...form,
        institutionName: form.institutionName.trim(),
        officialEmail: form.officialEmail.trim().toLowerCase(),
        officialPhone: form.officialPhone.replace(/[\s()-]/g, ''),
        registrationNumber: form.registrationNumber?.trim() || undefined,
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2?.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim().toUpperCase(),
        boardId: form.boardId || undefined,
      });
      setRequests((current) => [request, ...current]);
      toast.success('School registration submitted for review.');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'School registration could not be submitted.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[420px] items-center justify-center gap-2 text-sm text-muted-foreground"><Spinner />Loading school registration…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Institution onboarding</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Register your school</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Submit the school’s official details. ESQUARE will review them before creating the institution workspace and assigning you as its root administrator.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Manual verification</Badge>
      </div>

      {activeRequest && (
        <Alert>
          <Clock3 className="h-4 w-4" />
          <AlertTitle>Your application is already in progress</AlertTitle>
          <AlertDescription>You can track it below. A new application can be submitted after the current review is completed.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Building2 className="h-5 w-5 text-primary" />School details</CardTitle>
            <CardDescription>Use information exactly as it appears on the institution’s official records.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="institution-name">Institution name</Label>
                <Input id="institution-name" value={form.institutionName} onChange={(event) => update('institutionName', event.target.value)} maxLength={250} required disabled={Boolean(activeRequest)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution-type">Institution type</Label>
                <Select value={form.institutionType} onValueChange={(value) => update('institutionType', value as InstitutionType)} disabled={Boolean(activeRequest)}>
                  <SelectTrigger id="institution-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{institutionTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="board">Education board</Label>
                <Select value={form.boardId ?? 'not-listed'} onValueChange={(value) => update('boardId', value === 'not-listed' ? undefined : value)} disabled={Boolean(activeRequest)}>
                  <SelectTrigger id="board"><SelectValue placeholder="Select a board" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-listed">Not listed / not applicable</SelectItem>
                    {boards.map((board) => <SelectItem key={board.boardId} value={board.boardId}>{board.boardCode} — {board.displayName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="registration-number">Government registration or affiliation number <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="registration-number" value={form.registrationNumber ?? ''} onChange={(event) => update('registrationNumber', event.target.value)} maxLength={100} disabled={Boolean(activeRequest)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="official-email">Official email</Label>
                <Input id="official-email" type="email" value={form.officialEmail} onChange={(event) => update('officialEmail', event.target.value)} maxLength={254} required disabled={Boolean(activeRequest)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="official-phone">Official phone</Label>
                <Input id="official-phone" type="tel" value={form.officialPhone} onChange={(event) => update('officialPhone', event.target.value)} placeholder="+919876543210" required disabled={Boolean(activeRequest)} />
                <p className="text-xs text-muted-foreground">Include the country code without spaces.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address-line-1">Address</Label>
                <Input id="address-line-1" value={form.addressLine1} onChange={(event) => update('addressLine1', event.target.value)} maxLength={250} required disabled={Boolean(activeRequest)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address-line-2">Address line 2 <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="address-line-2" value={form.addressLine2 ?? ''} onChange={(event) => update('addressLine2', event.target.value)} maxLength={250} disabled={Boolean(activeRequest)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(event) => update('city', event.target.value)} maxLength={100} required disabled={Boolean(activeRequest)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={form.state} onChange={(event) => update('state', event.target.value)} maxLength={100} required disabled={Boolean(activeRequest)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal-code">Postal code</Label>
                <Input id="postal-code" value={form.postalCode} onChange={(event) => update('postalCode', event.target.value)} maxLength={20} required disabled={Boolean(activeRequest)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country code</Label>
                <Input id="country" value={form.country} onChange={(event) => update('country', event.target.value.toUpperCase().slice(0, 2))} pattern="[A-Za-z]{2}" maxLength={2} required disabled={Boolean(activeRequest)} />
                <p className="text-xs text-muted-foreground">Two-letter code, such as IN.</p>
              </div>
              <Button type="submit" size="lg" className="gap-2 sm:col-span-2" disabled={submitting || Boolean(activeRequest)}>
                {submitting && <Spinner />}{submitting ? 'Submitting…' : activeRequest ? 'Application already submitted' : 'Submit for verification'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">What happens next</CardTitle></CardHeader>
            <CardContent className="space-y-5 text-sm">
              {[
                ['1', 'Application review', 'The platform team checks the official details.'],
                ['2', 'Institution approval', 'An institution workspace and code are created.'],
                ['3', 'Administrator access', 'You receive the root administrator role for the school.'],
              ].map(([step, title, description]) => (
                <div key={step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{step}</span>
                  <div><p className="font-medium">{title}</p><p className="mt-1 leading-5 text-muted-foreground">{description}</p></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Alert>
            <FileCheck2 className="h-4 w-4" />
            <AlertTitle>Keep proof ready</AlertTitle>
            <AlertDescription>The review team may request registration, affiliation, or authorization documents.</AlertDescription>
          </Alert>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Email already verified</AlertTitle>
            <AlertDescription>Your ESQUARE account identity is used as the application owner.</AlertDescription>
          </Alert>
        </div>
      </div>

      {requests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Your applications</h2>
          {requests.map((request) => <RequestSummary key={request.requestId} request={request} />)}
        </section>
      )}
    </div>
  );
}

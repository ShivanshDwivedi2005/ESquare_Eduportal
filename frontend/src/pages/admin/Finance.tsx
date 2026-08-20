import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { revenueSeries, transactions } from '@/mock-data';
import { inr } from '@/lib/format';
import { Download } from 'lucide-react';

export default function AdminFinance() {
  const income = transactions.filter((t) => t.direction === 'in').reduce((a, t) => a + t.amount, 0);
  const spend = transactions.filter((t) => t.direction === 'out').reduce((a, t) => a + t.amount, 0);
  const pending = transactions.filter((t) => t.status === 'Pending').reduce((a, t) => a + t.amount, 0);

  return (
    <>
      <PageHeader
        eyebrow="Institution"
        title="Finance"
        description="Fee collection, expenses, grants and payroll outflow."
        actions={<Button variant="outline" size="sm" className="gap-1.5"><Download className="h-4 w-4" /> Export ledger</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total inflow" value={inr(income)} delta="+17%" trend="up" />
        <StatCard label="Total outflow" value={inr(spend)} delta="+4%" trend="down" />
        <StatCard label="Net position" value={inr(income - spend)} trend="up" delta="Healthy" />
        <StatCard label="Pending settlement" value={inr(pending)} hint="3 transactions" />
      </div>

      <SectionCard className="mt-6" title="Revenue vs expense" description="Last six months" bodyClassName="p-4">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenueSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis tickFormatter={(v) => `${v / 100000}L`} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={40} />
            <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} formatter={(v: number) => inr(v)} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expense" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard className="mt-4" title="Transaction ledger" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.label}</TableCell>
                  <TableCell className="text-muted-foreground">{t.party}</TableCell>
                  <TableCell><Badge variant="outline" className="font-normal">{t.category}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{t.date}</TableCell>
                  <TableCell className={t.direction === 'in' ? 'text-right font-semibold text-success' : 'text-right font-semibold text-destructive'}>
                    {t.direction === 'in' ? '+' : '−'}{inr(t.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={t.status === 'Completed' ? 'secondary' : t.status === 'Failed' ? 'destructive' : 'outline'}>{t.status}</Badge>
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

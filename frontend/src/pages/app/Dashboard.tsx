import { Link } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton, useSimulatedLoading } from '@/components/common/Loading';
import { StaggerContainer, StaggerItem } from '@/components/motion';
import { StatCard } from '@/components/common/StatCard';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import {
  attendanceTrend, calendarEvents, classRoster, departmentPerformance, hackathons, marksTrend,
  notifications, opportunities, projects, studentProfile, subjects, teacherClasses, todaySchedule,
} from '@/mock-data';
import { pct } from '@/lib/format';
import {
  BookOpen, Briefcase, CalendarDays, ClipboardList, FileBarChart, FolderKanban, TrendingUp, Trophy, Users,
} from 'lucide-react';

const chartAxis = { stroke: 'hsl(var(--muted-foreground))', fontSize: 11 };
const tooltipStyle = {
  background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))',
  borderRadius: 10, fontSize: 12, color: 'hsl(var(--popover-foreground))',
};

function StudentDashboard() {
  const overall = pct(
    subjects.reduce((a, s) => a + s.attendance.attended, 0),
    subjects.reduce((a, s) => a + s.attendance.total, 0),
  );
  const pending = subjects.flatMap((s) => s.assignments.filter((a) => a.status === 'Pending'));

  return (
    <StaggerContainer stagger={0.06}>
      <StaggerItem className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall attendance" value={`${overall}%`} delta="+1.4%" trend="up" icon={ClipboardList} hint="vs last month" />
        <StatCard label="Overall average" value={`${studentProfile.cgpa}%`} delta="+2.4%" trend="up" icon={FileBarChart} hint="Term 6" />
        <StatCard label="Pending assignments" value={pending.length} icon={BookOpen} hint="Due this fortnight" />
        <StatCard label="Active projects" value={projects.filter((p) => p.status !== 'Completed').length} icon={FolderKanban} hint="You are a member" />
      </StaggerItem>

      <StaggerItem className="mt-6 grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Attendance trend" description="Last six months" bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={attendanceTrend}>
              <defs>
                <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" {...chartAxis} tickLine={false} axisLine={false} />
              <YAxis domain={[60, 100]} {...chartAxis} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#att)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Today's schedule" action={<Link to="/app/calendar" className="text-xs font-medium text-primary">Calendar</Link>} bodyClassName="p-3 space-y-1.5">
          {todaySchedule.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-muted">
              <div className="w-14 shrink-0 text-xs font-medium text-muted-foreground">{c.start}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.subject}</p>
                <p className="truncate text-xs text-muted-foreground">{c.room} · {c.faculty}</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{c.type}</Badge>
            </div>
          ))}
        </SectionCard>
      </StaggerItem>

      <StaggerItem className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Subject attendance" bodyClassName="p-4 space-y-3.5">
          {subjects.slice(0, 5).map((s) => {
            const p = pct(s.attendance.attended, s.attendance.total);
            return (
              <div key={s.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{s.name}</span>
                  <span className={p < 75 ? 'text-destructive' : 'text-muted-foreground'}>{p}%</span>
                </div>
                <Progress value={p} className="h-1.5" />
              </div>
            );
          })}
        </SectionCard>

        <SectionCard title="Result progression" bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={marksTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="sem" {...chartAxis} tickLine={false} axisLine={false} />
              <YAxis domain={[60, 100]} {...chartAxis} tickLine={false} axisLine={false} width={26} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="gpa" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Recommended for you" bodyClassName="p-4 space-y-2.5">
          {opportunities.slice(0, 3).map((o) => (
            <Link key={o.id} to={`/app/opportunities/${o.id}`} className="block rounded-lg border border-border p-3 transition-colors hover:border-ring/40">
              <p className="truncate text-sm font-medium">{o.title}</p>
              <p className="truncate text-xs text-muted-foreground">{o.organization} · {o.type} · {o.mode}</p>
            </Link>
          ))}
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/app/opportunities">Browse all opportunities</Link>
          </Button>
        </SectionCard>
      </StaggerItem>

      <StaggerItem className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Upcoming deadlines" bodyClassName="p-4 space-y-2.5">
          {calendarEvents.slice(0, 5).map((e) => (
            <div key={e.id} className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.date} · {e.time}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{e.category}</Badge>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Hackathons open now" bodyClassName="p-4 space-y-2.5">
          {hackathons.filter((h) => h.registrationOpen).map((h) => (
            <Link key={h.id} to={`/app/hackathons/${h.id}`} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-ring/40">
              <Trophy className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{h.title}</p>
                <p className="truncate text-xs text-muted-foreground">{h.organizer} · {h.prize}</p>
              </div>
            </Link>
          ))}
        </SectionCard>
      </StaggerItem>
    </StaggerContainer>
  );
}

function TeacherDashboard() {
  return (
    <StaggerContainer stagger={0.06}>
      <StaggerItem className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Classes today" value={teacherClasses.length} icon={BookOpen} hint="Across two sections" />
        <StatCard label="Students taught" value={154} icon={Users} hint="This term" />
        <StatCard label="Attendance pending" value={teacherClasses.filter((c) => !c.attendanceTaken).length} icon={ClipboardList} hint="Mark before 6 PM" />
        <StatCard label="Class average" value="76%" delta="+2.1%" trend="up" icon={TrendingUp} hint="Internal assessment" />
      </StaggerItem>

      <StaggerItem className="mt-6 grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" title="Today's classes" bodyClassName="p-3 space-y-1.5">
          {teacherClasses.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-muted">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.subject} · {c.section}</p>
                <p className="text-xs text-muted-foreground">{c.time} · {c.room} · {c.students} students</p>
              </div>
              {c.attendanceTaken
                ? <Badge variant="secondary">Attendance marked</Badge>
                : <Button size="sm" asChild><Link to="/app/attendance">Mark attendance</Link></Button>}
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Needs attention" description="Below 75% attendance" bodyClassName="p-4 space-y-3">
          {classRoster.filter((s) => s.attendance < 75).map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.publicId}</p>
              </div>
              <Badge variant="destructive">{s.attendance}%</Badge>
            </div>
          ))}
        </SectionCard>
      </StaggerItem>

      <StaggerItem className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Department performance" bodyClassName="p-4">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={departmentPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="department" {...chartAxis} tickLine={false} axisLine={false} />
              <YAxis {...chartAxis} tickLine={false} axisLine={false} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              <Bar dataKey="average" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Recent notifications" bodyClassName="p-4 space-y-3">
          {notifications.slice(0, 5).map((n) => (
            <div key={n.id} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{n.title}</p>
                <p className="truncate text-xs text-muted-foreground">{n.body}</p>
              </div>
            </div>
          ))}
        </SectionCard>
      </StaggerItem>
    </StaggerContainer>
  );
}

function NetworkDashboard() {
  return (
    <StaggerContainer stagger={0.06}>
      <StaggerItem className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open opportunities" value={opportunities.length} icon={Briefcase} />
        <StatCard label="Live hackathons" value={hackathons.filter((h) => h.registrationOpen).length} icon={Trophy} />
        <StatCard label="Projects recruiting" value={projects.filter((p) => p.openRoles.length > 0).length} icon={FolderKanban} />
        <StatCard label="Unread notifications" value={notifications.filter((n) => !n.read).length} icon={CalendarDays} />
      </StaggerItem>
      <StaggerItem className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Latest opportunities" bodyClassName="p-4 space-y-2.5">
          {opportunities.slice(0, 4).map((o) => (
            <Link key={o.id} to={`/app/opportunities/${o.id}`} className="block rounded-lg border border-border p-3 transition-colors hover:border-ring/40">
              <p className="text-sm font-medium">{o.title}</p>
              <p className="text-xs text-muted-foreground">{o.organization} · {o.mode} · closes {o.deadline}</p>
            </Link>
          ))}
        </SectionCard>
        <SectionCard title="Projects recruiting" bodyClassName="p-4 space-y-2.5">
          {projects.filter((p) => p.openRoles.length > 0).map((p) => (
            <Link key={p.id} to={`/app/projects/${p.id}`} className="block rounded-lg border border-border p-3 transition-colors hover:border-ring/40">
              <p className="text-sm font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">Open roles: {p.openRoles.join(', ')}</p>
            </Link>
          ))}
        </SectionCard>
      </StaggerItem>
    </StaggerContainer>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const loading = useSimulatedLoading(650);
  if (!user) return null;

  const greeting = `Welcome back, ${user.name.split(' ')[0]}`;
  const description =
    user.role === 'student'
      ? `${user.course} · Term ${user.term} · ${user.institutionName}`
      : user.headline;

  if (loading) return <DashboardSkeleton />;

  return (
    <>
      <PageHeader title={greeting} description={description} eyebrow="Dashboard" />
      {user.role === 'student' && <StudentDashboard />}
      {user.role === 'teacher' && <TeacherDashboard />}
      {!['student', 'teacher'].includes(user.role) && <NetworkDashboard />}
    </>
  );
}

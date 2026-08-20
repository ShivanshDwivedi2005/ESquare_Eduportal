import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, BarChart3, Briefcase, Building2, CalendarDays, CheckCircle2, ClipboardList, Compass,
  FolderKanban, GraduationCap, MessageSquare, Rss, ShieldCheck, Trophy, Users,
} from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import {
  AnimatedGradientText, AnimatedGridPattern, BlurFade, BorderBeam, DotPattern, Marquee, NumberTicker,
  ShimmerButton, SpotlightCard,
} from '@/components/magic';

const modules = [
  { icon: ClipboardList, title: 'Academic operations', body: 'Attendance, marks, timetables and class materials in one auditable record for every student and teacher.' },
  { icon: Rss, title: 'School-wide feed', body: 'Announcements, achievements and project updates with visibility scoped to class, department, school or public.' },
  { icon: FolderKanban, title: 'Student projects', body: 'Publish work, recruit teammates by role and keep a verifiable build history attached to the profile.' },
  { icon: Briefcase, title: 'Opportunities', body: 'Internships, competitions, mentorships and scholarships from verified organizations.' },
  { icon: Trophy, title: 'Hackathons & events', body: 'Registration, team formation, timelines and results for school and corporate hackathons.' },
  { icon: Building2, title: 'School administration', body: 'Admissions pipeline, HR records, finance ledgers and department analytics for administrators.' },
];

const roles = [
  { title: 'Student', body: 'Academics, feed, projects, opportunities, messaging and a professional profile.' },
  { title: 'Teacher', body: 'Class rosters, attendance marking, marks entry, materials and announcements.' },
  { title: 'Principal & Admin', body: 'School-wide analytics, departments, staff and approvals.' },
  { title: 'HR & Finance', body: 'Employee records, payroll cycles, fee collection and transaction ledgers.' },
  { title: 'Admissions', body: 'Application pipeline from enquiry to enrolment with document review.' },
  { title: 'Organization', body: 'Post opportunities, run hackathons and review student applications.' },
];

const stats = [
  { value: 340, suffix: '+', label: 'Schools onboarded' },
  { value: 1.2, suffix: 'M', decimals: 1, label: 'Verified student profiles' },
  { value: 18, suffix: 'k', label: 'Opportunities published' },
  { value: 99.9, suffix: '%', decimals: 1, label: 'Platform uptime' },
];

const marqueeItems = [
  'Greenwood International School', 'Riverdale Public School', 'Nimbus Labs', 'BuildFest 2026',
  'Sunrise Academy', 'Heritage High', 'Orbit Foundation', 'Lakeside School',
];

export default function Index() {
  const [year] = useState(() => new Date().getFullYear());
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  return (
    <div className="min-h-screen bg-background">
      <motion.div style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary" />

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <motion.span
              whileHover={{ rotate: -8, scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <GraduationCap className="h-4 w-4" />
            </motion.span>
            <span className="font-display text-lg font-extrabold tracking-tight">ESQUARE</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#modules" className="transition-colors hover:text-foreground">Platform</a>
            <a href="#roles" className="transition-colors hover:text-foreground">Roles</a>
            <a href="#network" className="transition-colors hover:text-foreground">Network</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button>
            <Button asChild className="hidden sm:inline-flex"><Link to="/signup">Get started</Link></Button>
          </div>
        </div>
      </header>

      <main>
        {/* ------------------------------- Hero ------------------------------- */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <AnimatedGridPattern className="[mask-image:radial-gradient(60%_60%_at_50%_0%,black,transparent)] opacity-70" />
            <div className="absolute inset-x-0 -top-40 h-[520px] aurora opacity-70" />
          </div>

          <div className="container py-20 text-center md:py-28">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Badge variant="secondary" className="relative mb-5 gap-1.5 overflow-hidden rounded-full px-3 py-1 font-medium">
                <BorderBeam duration={6} />
                Verified school identity for every learner
              </Badge>
            </motion.div>

            <h1 className="mx-auto max-w-4xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl">
              {['The operating system for', 'schools and the students', 'inside them'].map((line, i) => (
                <motion.span
                  key={line}
                  className="block"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(10px)' }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.7, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] }}
                >
                  {i === 1 ? <AnimatedGradientText>{line}</AnimatedGradientText> : line}
                </motion.span>
              ))}
            </h1>

            <motion.p
              className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground md:text-lg"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              ESQUARE combines school administration with a professional student network — attendance and marks
              on one side, projects, opportunities and mentorship on the other.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to="/signup">
                <ShimmerButton>Create your account <ArrowRight className="h-4 w-4" /></ShimmerButton>
              </Link>
              <Button size="lg" variant="outline" className="rounded-full" asChild>
                <Link to="/login">Explore a role workspace</Link>
              </Button>
            </motion.div>

            <div className="mt-14 grid grid-cols-2 gap-6 border-t border-border pt-10 md:grid-cols-4">
              {stats.map((s, i) => (
                <BlurFade key={s.label} delay={0.1 * i}>
                  <p className="font-display text-2xl font-extrabold md:text-3xl">
                    <NumberTicker value={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} />
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground md:text-sm">{s.label}</p>
                </BlurFade>
              ))}
            </div>
          </div>

          <div className="relative border-t border-border py-5">
            <Marquee speed={38} className="[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
              {marqueeItems.map((m) => (
                <span key={m} className="whitespace-nowrap rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground">
                  {m}
                </span>
              ))}
            </Marquee>
          </div>
        </section>

        {/* ------------------------------ Modules ----------------------------- */}
        <section id="modules" className="container py-20 md:py-24">
          <BlurFade className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Platform</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Every school workflow, one consistent system</h2>
            <p className="mt-3 text-muted-foreground">
              Modules share the same identity layer, so a marks entry, a project update and an internship application
              all resolve to the same verified person.
            </p>
          </BlurFade>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => (
              <BlurFade key={m.title} delay={0.06 * i}>
                <SpotlightCard className="surface-card hover-lift h-full rounded-xl">
                  <div className="p-6">
                    <motion.span
                      whileHover={{ rotate: -6, scale: 1.08 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 16 }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"
                    >
                      <m.icon className="h-5 w-5" />
                    </motion.span>
                    <h3 className="mt-4 font-display text-base font-semibold">{m.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                  </div>
                </SpotlightCard>
              </BlurFade>
            ))}
          </div>
        </section>

        {/* ------------------------------- Roles ------------------------------ */}
        <section id="roles" className="relative overflow-hidden border-y border-border bg-surface-muted py-20 md:py-24">
          <DotPattern className="[mask-image:radial-gradient(70%_60%_at_50%_50%,black,transparent)] opacity-60" />
          <div className="container relative">
            <BlurFade className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Role-based access</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Nine roles, nine purpose-built workspaces</h2>
            </BlurFade>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map((r, i) => (
                <BlurFade key={r.title} delay={0.05 * i}>
                  <motion.article
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    className="h-full rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <h3 className="font-display text-sm font-semibold">{r.title}</h3>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                  </motion.article>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------ Network ----------------------------- */}
        <section id="network" className="container py-20 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <BlurFade>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">The network</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">A professional identity that starts in school</h2>
              <p className="mt-4 text-muted-foreground">
                Students accumulate verified coursework, projects, hackathon results and internships on a single public
                profile. Organizations discover talent from real signal instead of a one-page résumé.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  { icon: Users, text: 'Follow schools, organizations and peers across campuses' },
                  { icon: Compass, text: 'Discover projects and teams recruiting for a specific role' },
                  { icon: MessageSquare, text: 'Direct, group, class and organization messaging' },
                  { icon: CalendarDays, text: 'Unified calendar for classes, exams, deadlines and events' },
                  { icon: BarChart3, text: 'Analytics for students, teachers and administrators' },
                ].map((i, idx) => (
                  <motion.li
                    key={i.text}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.45, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <i.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{i.text}</span>
                  </motion.li>
                ))}
              </ul>
            </BlurFade>

            <BlurFade delay={0.15}>
              <div className="surface-card relative overflow-hidden p-6">
                <BorderBeam duration={10} />
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <p className="font-display font-semibold">Rahul Verma</p>
                    <p className="text-xs text-muted-foreground">Class 10-A • Greenwood International School</p>
                  </div>
                  <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 py-4 text-center">
                  {[[86.2, 'Overall %', 1], [7, 'Projects', 0], [612, 'Connections', 0]].map(([v, l, d]) => (
                    <div key={l as string} className="rounded-lg bg-surface-muted py-3">
                      <p className="font-display text-lg font-bold">
                        <NumberTicker value={v as number} decimals={d as number} />
                      </p>
                      <p className="text-[11px] text-muted-foreground">{l as string}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t border-border pt-4 text-sm">
                  <p className="font-medium">Recent activity</p>
                  <p className="text-muted-foreground">Shipped prototype v0.3 of Smart Traffic Management</p>
                  <p className="text-muted-foreground">Applied to Junior Robotics Intern at Nimbus Labs</p>
                  <p className="text-muted-foreground">Registered for BuildFest 2026</p>
                </div>
              </div>
            </BlurFade>
          </div>
        </section>

        {/* -------------------------------- CTA ------------------------------- */}
        <section className="relative overflow-hidden border-t border-border bg-surface-muted py-20">
          <div className="pointer-events-none absolute inset-0 aurora opacity-50" />
          <BlurFade className="container relative text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Bring your school onto ESQUARE</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Set up departments, invite teachers and give every student a verified profile in a single onboarding flow.
            </p>
            <div className="mt-7 flex justify-center">
              <Link to="/signup"><ShimmerButton>Get started <ArrowRight className="h-4 w-4" /></ShimmerButton></Link>
            </div>
          </BlurFade>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">ESQUARE</span>
          </div>
          <p>© {year} ESQUARE. Academic and professional infrastructure for schools.</p>
          <ThemeToggle />
        </div>
      </footer>
    </div>
  );
}

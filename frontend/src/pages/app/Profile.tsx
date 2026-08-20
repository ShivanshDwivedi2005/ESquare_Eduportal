import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { PostCard } from '@/components/feed/PostCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { posts, projects, studentProfile } from '@/mock-data';
import { useAuthStore } from '@/stores/authStore';
import { roleLabel } from '@/lib/roles';
import { initials } from '@/lib/format';
import { Github, Globe, Linkedin, MapPin, Pencil, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuthStore();
  if (!user) return null;
  const p = studentProfile;
  const myPosts = posts.filter((x) => x.authorId === user.id || x.authorHandle === user.username);

  return (
    <>
      <PageHeader
        eyebrow="You"
        title="Profile"
        description="Your public professional identity on ESQUARE."
        actions={<Button variant="outline" size="sm" className="gap-1.5"><Pencil className="h-4 w-4" /> Edit profile</Button>}
      />

      <div className="surface-card overflow-hidden">
        <div className="h-24 bg-[linear-gradient(120deg,hsl(var(--primary))_0%,hsl(var(--info))_100%)]" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-primary-soft font-display text-xl font-bold text-primary">
                {initials(user.name)}
              </span>
              <div className="pb-1">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                  {user.name} {user.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
                </h2>
                <p className="text-sm text-muted-foreground">{user.headline}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              <Badge variant="secondary">{roleLabel[user.role]}</Badge>
              <Badge variant="outline">{user.publicId}</Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {user.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {user.location}</span>}
            <span className="flex items-center gap-1.5"><Github className="h-3.5 w-3.5" /> {p.links.github}</span>
            <span className="flex items-center gap-1.5"><Linkedin className="h-3.5 w-3.5" /> {p.links.linkedin}</span>
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> {p.links.website}</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Average', `${p.cgpa}%`], ['Projects', p.counters.projects],
              ['Connections', p.counters.connections], ['Posts', p.counters.posts],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg bg-surface-muted p-3 text-center">
                <p className="font-display text-lg font-bold">{value}</p>
                <p className="text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="about" className="mt-5">
        <TabsList className="flex-wrap">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <SectionCard title="Bio"><p className="text-sm leading-relaxed text-muted-foreground">{p.bio}</p></SectionCard>
            <SectionCard title="Education" bodyClassName="p-5 space-y-4">
              {p.education.map((e) => (
                <div key={e.degree} className="border-l-2 border-primary pl-4">
                  <p className="text-sm font-medium">{e.degree}</p>
                  <p className="text-sm text-muted-foreground">{e.institution}</p>
                  <p className="text-xs text-muted-foreground">{e.period}</p>
                </div>
              ))}
            </SectionCard>
          </div>
          <aside className="space-y-4">
            <SectionCard title="Skills" bodyClassName="p-5">
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map((s) => <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>)}
              </div>
            </SectionCard>
            <SectionCard title="Interests" bodyClassName="p-5">
              <div className="flex flex-wrap gap-1.5">
                {p.interests.map((s) => <Badge key={s} variant="outline" className="font-normal">{s}</Badge>)}
              </div>
            </SectionCard>
            <SectionCard title="Certifications" bodyClassName="p-5 space-y-3">
              {p.certifications.map((c) => (
                <div key={c.title}>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.issuer} · {c.year}</p>
                </div>
              ))}
            </SectionCard>
          </aside>
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.slice(0, 3).map((pr) => (
              <Link key={pr.id} to={`/app/projects/${pr.id}`} className="surface-card hover-lift p-5">
                <Badge variant="secondary">{pr.status}</Badge>
                <p className="mt-2.5 font-display font-semibold">{pr.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pr.summary}</p>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <SectionCard bodyClassName="p-5 space-y-4">
            {p.achievements.map((a) => (
              <div key={a.title} className="border-l-2 border-primary pl-4">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.issuer} · {a.year}</p>
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        <TabsContent value="experience" className="mt-4">
          <SectionCard bodyClassName="p-5 space-y-5">
            {p.experience.map((e) => (
              <div key={e.role} className="border-l-2 border-primary pl-4">
                <p className="text-sm font-semibold">{e.role}</p>
                <p className="text-sm text-muted-foreground">{e.org} · {e.period}</p>
                <p className="mt-1 text-sm text-muted-foreground">{e.summary}</p>
              </div>
            ))}
          </SectionCard>
        </TabsContent>

        <TabsContent value="posts" className="mt-4 space-y-4">
          {myPosts.length ? myPosts.map((post) => <PostCard key={post.id} post={post} />)
            : <SectionCard><p className="text-sm text-muted-foreground">You have not published any posts yet.</p></SectionCard>}
        </TabsContent>
      </Tabs>
    </>
  );
}

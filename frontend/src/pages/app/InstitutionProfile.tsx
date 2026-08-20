import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { PostCard } from '@/components/feed/PostCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { institutions, posts } from '@/mock-data';
import { useAppStore } from '@/stores/appStore';
import { compact, initials } from '@/lib/format';
import { Globe, MapPin, ShieldCheck } from 'lucide-react';

export default function InstitutionProfile() {
  const { slug } = useParams();
  const inst = institutions.find((i) => i.slug === slug);
  const { followedEntities, toggle } = useAppStore();

  if (!inst) return <EmptyState title="Institution not found" />;
  const following = followedEntities.includes(inst.id);
  const feed = posts.filter((p) => p.authorId === inst.id);

  return (
    <>
      <PageHeader eyebrow={inst.type} title={inst.name} description={`${inst.city} · Established ${inst.established}`}
        actions={
          <>
            <Button variant="outline" size="sm">Request association</Button>
            <Button size="sm" variant={following ? 'secondary' : 'default'} onClick={() => toggle('followedEntities', inst.id)}>
              {following ? 'Following' : 'Follow'}
            </Button>
          </>
        }
      />

      <div className="surface-card mb-5 flex flex-wrap items-center gap-5 p-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft font-display text-lg font-bold text-primary">
          {initials(inst.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-display font-semibold">
            {inst.name} {inst.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
          </p>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {inst.city}</span>
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> {inst.website}</span>
            <span>{compact(inst.students)} students</span>
            <span>{compact(inst.followers)} followers</span>
          </div>
        </div>
        <Badge variant="outline">{inst.publicId}</Badge>
      </div>

      <Tabs defaultValue="about">
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-4">
          <SectionCard title="Overview"><p className="text-sm leading-relaxed text-muted-foreground">{inst.description}</p></SectionCard>
        </TabsContent>

        <TabsContent value="departments" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {inst.departments.map((d) => (
              <div key={d} className="surface-card p-4"><p className="text-sm font-medium">{d}</p></div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="programs" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {inst.programs.map((p) => <Badge key={p} variant="secondary" className="font-normal">{p}</Badge>)}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="mt-4 space-y-4">
          {feed.length ? feed.map((p) => <PostCard key={p.id} post={p} />) : <EmptyState title="No posts yet" />}
        </TabsContent>
      </Tabs>
    </>
  );
}

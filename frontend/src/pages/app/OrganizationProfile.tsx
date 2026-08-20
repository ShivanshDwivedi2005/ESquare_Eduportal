import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { PostCard } from '@/components/feed/PostCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hackathons, opportunities, organizations, posts } from '@/mock-data';
import { useAppStore } from '@/stores/appStore';
import { compact, initials } from '@/lib/format';
import { MapPin, ShieldCheck } from 'lucide-react';

export default function OrganizationProfile() {
  const { slug } = useParams();
  const org = organizations.find((o) => o.slug === slug);
  const { followedEntities, toggle } = useAppStore();

  if (!org) return <EmptyState title="Organization not found" />;
  const following = followedEntities.includes(org.id);
  const orgOpps = opportunities.filter((o) => o.organizationId === org.id);
  const orgHacks = hackathons.filter((h) => h.organizerId === org.id);
  const feed = posts.filter((p) => p.authorId === org.id);

  return (
    <>
      <PageHeader eyebrow={org.type} title={org.name} description={`${org.industry} · ${org.location}`}
        actions={
          <Button size="sm" variant={following ? 'secondary' : 'default'} onClick={() => toggle('followedEntities', org.id)}>
            {following ? 'Following' : 'Follow'}
          </Button>
        }
      />

      <div className="surface-card mb-5 flex flex-wrap items-center gap-5 p-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft font-display text-lg font-bold text-primary">
          {initials(org.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-display font-semibold">
            {org.name} {org.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
          </p>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {org.location}</span>
            <span>{compact(org.followers)} followers</span>
          </div>
        </div>
        <Badge variant="outline">{org.publicId}</Badge>
      </div>

      <Tabs defaultValue="about">
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="hackathons">Hackathons</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-4">
          <SectionCard title="Overview"><p className="text-sm leading-relaxed text-muted-foreground">{org.description}</p></SectionCard>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-4 space-y-3">
          {orgOpps.length ? orgOpps.map((o) => (
            <Link key={o.id} to={`/app/opportunities/${o.id}`} className="surface-card hover-lift block p-4">
              <p className="font-medium">{o.title}</p>
              <p className="text-xs text-muted-foreground">{o.type} · {o.mode} · closes {o.deadline}</p>
            </Link>
          )) : <EmptyState title="No open opportunities" />}
        </TabsContent>

        <TabsContent value="hackathons" className="mt-4 space-y-3">
          {orgHacks.length ? orgHacks.map((h) => (
            <Link key={h.id} to={`/app/hackathons/${h.id}`} className="surface-card hover-lift block p-4">
              <p className="font-medium">{h.title}</p>
              <p className="text-xs text-muted-foreground">{h.startDate} · {h.mode} · {h.prize}</p>
            </Link>
          )) : <EmptyState title="No hackathons hosted yet" />}
        </TabsContent>

        <TabsContent value="posts" className="mt-4 space-y-4">
          {feed.length ? feed.map((p) => <PostCard key={p.id} post={p} />) : <EmptyState title="No posts yet" />}
        </TabsContent>
      </Tabs>
    </>
  );
}

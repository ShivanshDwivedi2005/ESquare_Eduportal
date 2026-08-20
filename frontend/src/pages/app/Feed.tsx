import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { PostCard } from '@/components/feed/PostCard';
import { SkeletonPostCard, useSimulatedLoading } from '@/components/common/Loading';
import { SectionCard } from '@/components/common/SectionCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { posts as seedPosts, suggestedPeople, trendingTags, hackathons } from '@/mock-data';
import { useAuthStore } from '@/stores/authStore';
import type { Post, PostCategory, PostVisibility } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const categories: (PostCategory | 'All')[] = ['All', 'Announcement', 'Achievement', 'Project', 'Hackathon', 'Internship', 'Academic'];
const visibilities: PostVisibility[] = ['Public', 'Followers', 'Institution', 'Department', 'Class'];

export default function Feed() {
  const { user } = useAuthStore();
  const loading = useSimulatedLoading(700);
  const [items, setItems] = useState<Post[]>(seedPosts);
  const [filter, setFilter] = useState<PostCategory | 'All'>('All');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('General');
  const [visibility, setVisibility] = useState<PostVisibility>('Public');

  const visible = useMemo(
    () => (filter === 'All' ? items : items.filter((p) => p.category === filter)),
    [items, filter],
  );

  const publish = () => {
    if (!content.trim() || !user) return;
    setItems((prev) => [
      {
        id: `p-${Date.now()}`, authorId: user.id, authorName: user.name, authorRole: user.headline ?? 'Member',
        authorHandle: user.username, authorVerified: user.verified, category, visibility, content,
        tags: [], createdAt: 'now', likes: 0, reposts: 0, comments: [],
      },
      ...prev,
    ]);
    setContent('');
    toast.success('Post published');
  };

  return (
    <>
      <PageHeader title="Feed" description="Announcements, achievements and opportunities from your network." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <SectionCard bodyClassName="p-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an update, achievement or opportunity…"
              className="min-h-[88px] resize-none border-0 p-0 shadow-none focus-visible:ring-0"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Select value={category} onValueChange={(v) => setCategory(v as PostCategory)}>
                <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['General', 'Announcement', 'Achievement', 'Academic', 'Project', 'Event', 'Hackathon', 'Internship'].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as PostVisibility)}>
                <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {visibilities.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" className="ml-auto" onClick={publish} disabled={!content.trim()}>Publish</Button>
            </div>
          </SectionCard>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  filter === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonPostCard key={i} />)
              : visible.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </div>

        <aside className="hidden space-y-4 lg:block">
          <SectionCard title="Trending" bodyClassName="p-4">
            <div className="flex flex-wrap gap-1.5">
              {trendingTags.map((t) => (
                <Badge key={t} variant="secondary" className="font-normal">{t}</Badge>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="People to follow" bodyClassName="p-4 space-y-3">
            {suggestedPeople.map((p) => (
              <div key={p.handle} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.headline}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => toast.success(`Following ${p.name}`)}>Follow</Button>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Closing soon" bodyClassName="p-4 space-y-3">
            {hackathons.filter((h) => h.registrationOpen).map((h) => (
              <Link key={h.id} to={`/app/hackathons/${h.id}`} className="block rounded-lg border border-border p-3 transition-colors hover:border-ring/40">
                <p className="text-sm font-medium">{h.title}</p>
                <p className="text-xs text-muted-foreground">{h.startDate} · {h.mode} · {h.prize}</p>
              </Link>
            ))}
          </SectionCard>
        </aside>
      </div>
    </>
  );
}

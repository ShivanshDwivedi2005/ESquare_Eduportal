import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { PostCard } from '@/components/feed/PostCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { organizations, posts as seed } from '@/mock-data';
import type { Post, PostCategory } from '@/types';
import { toast } from 'sonner';

export default function OrgPosts() {
  const org = organizations[0];
  const [items, setItems] = useState<Post[]>(seed.filter((p) => p.authorId === org.id));
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('Announcement');

  const publish = () => {
    if (!content.trim()) return;
    setItems((prev) => [
      {
        id: `p-${Date.now()}`, authorId: org.id, authorName: org.name, authorRole: org.type,
        authorHandle: org.slug, authorVerified: org.verified, category, visibility: 'Public',
        content, tags: [], createdAt: 'now', likes: 0, reposts: 0, comments: [],
      },
      ...prev,
    ]);
    setContent('');
    toast.success('Post published');
  };

  return (
    <>
      <PageHeader eyebrow="Organization" title="Posts" description="Announcements and updates published to the network." />

      <SectionCard className="mb-4" bodyClassName="p-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share an announcement, hiring update or event…"
          className="min-h-[88px] resize-none border-0 p-0 shadow-none focus-visible:ring-0"
        />
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <Select value={category} onValueChange={(v) => setCategory(v as PostCategory)}>
            <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['Announcement', 'Internship', 'Job', 'Event', 'Hackathon', 'Workshop'].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="ml-auto" onClick={publish} disabled={!content.trim()}>Publish</Button>
        </div>
      </SectionCard>

      <div className="space-y-4">
        {items.map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </>
  );
}

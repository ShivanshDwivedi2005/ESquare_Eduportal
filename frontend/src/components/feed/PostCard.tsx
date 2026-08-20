import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Heart, Link2, MessageCircle, Repeat2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import type { Post } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';
import { duration, ease } from '@/lib/motion';

const entityHref = (p: Post) => {
  if (!p.linkedEntity) return '#';
  const map = { project: '/app/projects/', hackathon: '/app/hackathons/', opportunity: '/app/opportunities/' };
  return map[p.linkedEntity.kind] + p.linkedEntity.id;
};

export function PostCard({ post }: { post: Post }) {
  const { likedPosts, savedPosts, toggle } = useAppStore();
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState('');
  const [localComments, setLocalComments] = useState(post.comments);
  const liked = likedPosts.includes(post.id);
  const saved = savedPosts.includes(post.id);

  return (
    <motion.article
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: duration.ui, ease: ease.out }}
      className="surface-card p-5 transition-shadow hover:shadow-lg"
    >
      <header className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
          {initials(post.authorName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-semibold">{post.authorName}</p>
            {post.authorVerified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
            <span className="text-xs text-muted-foreground">· {post.createdAt}</span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{post.authorRole} · @{post.authorHandle}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Badge variant="secondary" className="text-[11px]">{post.category}</Badge>
          <Badge variant="outline" className="hidden text-[11px] sm:inline-flex">{post.visibility}</Badge>
        </div>
      </header>

      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{post.content}</p>

      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <span key={t} className="text-xs font-medium text-primary">#{t}</span>
          ))}
        </div>
      )}

      {post.linkedEntity && (
        <Link
          to={entityHref(post)}
          className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm transition-colors hover:border-ring/40"
        >
          <Link2 className="h-4 w-4 text-primary" />
          <span className="truncate font-medium">{post.linkedEntity.label}</span>
          <span className="ml-auto text-xs capitalize text-muted-foreground">{post.linkedEntity.kind}</span>
        </Link>
      )}

      <footer className="mt-4 flex items-center gap-1 border-t border-border pt-3">
        <Button variant="ghost" size="sm" className={cn('gap-1.5', liked && 'text-primary')} onClick={() => toggle('likedPosts', post.id)}>
          <motion.span key={String(liked)} initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
            <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
          </motion.span>
          {post.likes + (liked ? 1 : 0)}
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setShowComments((v) => !v)}>
          <MessageCircle className="h-4 w-4" /> {localComments.length}
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Repeat2 className="h-4 w-4" /> {post.reposts}
        </Button>
        <Button
          variant="ghost" size="icon" aria-label="Save post" className={cn('ml-auto', saved && 'text-primary')}
          onClick={() => toggle('savedPosts', post.id)}
        >
          <motion.span key={String(saved)} initial={{ scale: 0.7, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 480, damping: 20 }}>
            <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
          </motion.span>
        </Button>
      </footer>

      <AnimatePresence initial={false}>
      {showComments && (
        <motion.div
          key="comments"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: duration.ui, ease: ease.out }}
          className="overflow-hidden"
        >
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {localComments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[10px] font-semibold">
                {initials(c.authorName)}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold">{c.authorName} <span className="font-normal text-muted-foreground">· {c.createdAt}</span></p>
                <p className="text-sm text-muted-foreground">{c.content}</p>
              </div>
            </div>
          ))}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              setLocalComments((c) => [...c, { id: `c-${Date.now()}`, authorName: 'Rahul Verma', authorHandle: 'rahulverma', content: draft, createdAt: 'now' }]);
              setDraft('');
            }}
          >
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a comment…" className="h-9" />
            <Button type="submit" size="sm">Post</Button>
          </form>
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.article>
  );
}

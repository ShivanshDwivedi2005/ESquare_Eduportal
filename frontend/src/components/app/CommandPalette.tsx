import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import { hackathons, institutions, opportunities, organizations, projects } from '@/mock-data';
import { navByRole } from '@/lib/roles';
import { useAuthStore } from '@/stores/authStore';

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  const pages = (user ? navByRole[user.role] : []).flatMap((g) => g.items);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search people, institutions, projects, opportunities…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {pages.map((p) => (
            <CommandItem key={p.url + p.title} onSelect={() => go(p.url)}>
              <p.icon className="mr-2 h-4 w-4" />
              {p.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Institutions">
          {institutions.map((i) => (
            <CommandItem key={i.id} onSelect={() => go(`/app/institutions/${i.slug}`)}>{i.name}</CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Organizations">
          {organizations.map((o) => (
            <CommandItem key={o.id} onSelect={() => go(`/app/organizations/${o.slug}`)}>{o.name}</CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Projects">
          {projects.map((p) => (
            <CommandItem key={p.id} onSelect={() => go(`/app/projects/${p.id}`)}>{p.title}</CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Opportunities">
          {opportunities.map((o) => (
            <CommandItem key={o.id} onSelect={() => go(`/app/opportunities/${o.id}`)}>{o.title}</CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Hackathons">
          {hackathons.map((h) => (
            <CommandItem key={h.id} onSelect={() => go(`/app/hackathons/${h.id}`)}>{h.title}</CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

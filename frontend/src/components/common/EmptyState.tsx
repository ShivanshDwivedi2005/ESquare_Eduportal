import { Inbox } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-display text-base font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

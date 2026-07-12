import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-12 w-12 rounded-full bg-canvas-surface border border-canvas-border flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-ink-muted" />
      </div>
      <h3 className="font-display font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-muted max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}

import type { ReactNode } from "react";
import { PageGuideButton } from "@/components/onboarding/page-guide";
import type { PageGuideId } from "@/lib/onboarding-content";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  guide,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  /** Adds a "How this works" panel for this page. */
  guide?: PageGuideId;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1">
        {eyebrow ? <p className="text-xs font-medium text-primary">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions || guide ? (
        <div className="flex flex-wrap items-center gap-2">
          {guide ? <PageGuideButton id={guide} /> : null}
          {actions}
        </div>
      ) : null}
    </div>
  );
}

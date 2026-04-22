import { FolderKanban, PencilLine, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AccountGroupBucket } from "@/features/account-groups/utils";
import { cn } from "@/lib/utils";
import { quotaBarColor, quotaBarTrack } from "@/utils/account-status";
import { formatCompactNumber, formatPercentNullable } from "@/utils/formatters";

type AccountGroupSummaryCardProps = {
  group: AccountGroupBucket;
  onEdit?: () => void;
};

function SummaryQuota({
  label,
  percent,
  remaining,
  capacity,
}: {
  label: string;
  percent: number | null;
  remaining: number;
  capacity: number;
}) {
  const clamped = percent === null ? 0 : Math.max(0, Math.min(100, percent));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-semibold">{formatPercentNullable(percent)}</span>
      </div>
      <div className={cn("h-2 overflow-hidden rounded-full", quotaBarTrack(clamped))}>
        <div
          className={cn("h-full rounded-full transition-all duration-300", quotaBarColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {formatCompactNumber(remaining)} / {formatCompactNumber(capacity)}
      </div>
    </div>
  );
}

export function AccountGroupSummaryCard({ group, onEdit }: AccountGroupSummaryCardProps) {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm shadow-black/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/60 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <FolderKanban className="h-3.5 w-3.5" />
            {group.isUngrouped ? "Ungrouped Pool" : "Account Group"}
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{group.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {group.accountCount} accounts · {group.issueCount} need attention
          </p>
        </div>
        {onEdit ? (
          <Button type="button" variant="outline" className="gap-1.5" onClick={onEdit}>
            <PencilLine className="h-4 w-4" />
            Edit Group
          </Button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border bg-muted/25 p-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Member Snapshot
          </div>
          <p className="mt-3 text-sm leading-relaxed">
            {group.accounts.slice(0, 4).map((account) => account.email).join(" · ") || "No accounts assigned yet."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryQuota
            label="5h Remaining"
            percent={group.primaryRemainingPercent}
            remaining={group.primaryRemainingCredits}
            capacity={group.primaryCapacityCredits}
          />
          <SummaryQuota
            label="Weekly Remaining"
            percent={group.secondaryRemainingPercent}
            remaining={group.secondaryRemainingCredits}
            capacity={group.secondaryCapacityCredits}
          />
        </div>
      </div>
    </div>
  );
}

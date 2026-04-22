import { AlertTriangle, ArrowUpRight, FolderKanban, Users } from "lucide-react";
import { usePrivacyStore } from "@/hooks/use-privacy";
import type { AccountGroupBucket } from "@/features/account-groups/utils";
import { cn } from "@/lib/utils";
import { quotaBarColor, quotaBarTrack } from "@/utils/account-status";
import { formatCompactNumber, formatPercentNullable } from "@/utils/formatters";

type GroupCardProps = {
  group: AccountGroupBucket;
  onOpen?: () => void;
};

function GroupQuotaBar({
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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">{formatPercentNullable(percent)}</span>
      </div>
      <div className={cn("h-1.5 overflow-hidden rounded-full", quotaBarTrack(clamped))}>
        <div
          className={cn("h-full rounded-full transition-all duration-300", quotaBarColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="text-[11px] text-muted-foreground">
        {formatCompactNumber(remaining)} / {formatCompactNumber(capacity)}
      </div>
    </div>
  );
}

export function GroupCard({ group, onOpen }: GroupCardProps) {
  const blurred = usePrivacyStore((s) => s.blurred);
  const memberPreview = group.accounts.slice(0, 3).map((account) => account.email).join(" · ");

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onOpen ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      } : undefined}
      className={cn(
        "rounded-2xl border bg-card/95 p-4 shadow-sm shadow-black/5",
        onOpen ? "cursor-pointer transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25" : "",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/70 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <FolderKanban className="h-3 w-3" />
            Group
          </div>
          <h3 className="truncate text-lg font-semibold tracking-tight">{group.name}</h3>
          <p className="text-xs text-muted-foreground">
            {group.accountCount} accounts
            {group.issueCount > 0 ? ` · ${group.issueCount} need attention` : " · healthy overview"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            {group.accountCount}
          </span>
          {group.issueCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              {group.issueCount}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <GroupQuotaBar
          label="5h Remaining"
          percent={group.primaryRemainingPercent}
          remaining={group.primaryRemainingCredits}
          capacity={group.primaryCapacityCredits}
        />
        <GroupQuotaBar
          label="Weekly Remaining"
          percent={group.secondaryRemainingPercent}
          remaining={group.secondaryRemainingCredits}
          capacity={group.secondaryCapacityCredits}
        />
      </div>

      <div className="mt-4 rounded-xl border border-dashed bg-muted/35 p-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Members</div>
        <p className={cn("mt-1 text-sm leading-relaxed", blurred ? "privacy-blur" : "")}>
          {memberPreview || "No accounts assigned"}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5 text-xs font-medium text-muted-foreground">
        <span>Open Group</span>
        <ArrowUpRight className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

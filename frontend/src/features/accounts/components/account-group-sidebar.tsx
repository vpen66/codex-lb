import { FolderKanban, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AccountGroupBucket } from "@/features/account-groups/utils";
import { cn } from "@/lib/utils";
import { formatPercentNullable, formatSlug } from "@/utils/formatters";

const STATUS_FILTER_OPTIONS = ["all", "active", "paused", "rate_limited", "quota_exceeded", "deactivated"] as const;

type AccountGroupSidebarProps = {
  groups: AccountGroupBucket[];
  selectedGroupKey: string | null;
  statusFilter: string;
  draggedAccountId: string | null;
  dropTargetGroupKey: string | null;
  onSelect: (groupKey: string) => void;
  onDropTargetChange: (groupKey: string | null) => void;
  onDropAccount: (accountId: string, groupKey: string) => void | Promise<void>;
  onStatusFilterChange: (status: string) => void;
  onCreateGroup: () => void;
};

export function AccountGroupSidebar({
  groups,
  selectedGroupKey,
  statusFilter,
  draggedAccountId,
  dropTargetGroupKey,
  onSelect,
  onDropTargetChange,
  onDropAccount,
  onStatusFilterChange,
  onCreateGroup,
}: AccountGroupSidebarProps) {
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return groups;
    }
    return groups.filter((group) => group.name.toLowerCase().includes(needle));
  }, [groups, search]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Button type="button" onClick={onCreateGroup} className="w-full justify-center">
          Create Group
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search groups..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "all" ? "All statuses" : formatSlug(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
            No groups match this search.
          </div>
        ) : (
          filteredGroups.map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => onSelect(group.key)}
              onDragOver={(event) => {
                const accountId = draggedAccountId || event.dataTransfer.getData("text/plain");
                if (!accountId) {
                  return;
                }
                event.preventDefault();
                if (dropTargetGroupKey !== group.key) {
                  onDropTargetChange(group.key);
                }
              }}
              onDrop={(event) => {
                const accountId = draggedAccountId || event.dataTransfer.getData("text/plain");
                if (!accountId) {
                  return;
                }
                event.preventDefault();
                void onDropAccount(accountId, group.key);
              }}
              className={cn(
                "w-full rounded-2xl border p-3 text-left transition-colors",
                draggedAccountId && "transition-all",
                selectedGroupKey === group.key
                  ? "border-primary/40 bg-primary/5"
                  : "bg-card hover:bg-accent/40",
                dropTargetGroupKey === group.key && "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {group.isUngrouped ? "Pool" : "Group"}
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold">{group.name}</div>
                </div>
                <div className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                  {group.accountCount}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Weekly Remaining</span>
                <span>{formatPercentNullable(group.secondaryRemainingPercent)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

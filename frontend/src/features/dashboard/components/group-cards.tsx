import { Layers3 } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { GroupCard } from "@/features/dashboard/components/group-card";
import type { AccountGroupBucket } from "@/features/account-groups/utils";

export type GroupCardsProps = {
  groups: AccountGroupBucket[];
  onOpenGroup?: (group: AccountGroupBucket) => void;
};

export function GroupCards({ groups, onOpenGroup }: GroupCardsProps) {
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Layers3}
        title="No grouped accounts yet"
        description="Create a group or assign accounts to reduce dashboard clutter."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {groups.map((group, index) => (
        <div key={group.key} className="animate-fade-in-up" style={{ animationDelay: `${index * 60}ms` }}>
          <GroupCard group={group} onOpen={() => onOpenGroup?.(group)} />
        </div>
      ))}
    </div>
  );
}

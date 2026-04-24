import type { AccountGroup } from "@/features/account-groups/schemas";
import type { AccountSummary } from "@/features/accounts/schemas";
import type { RemainingItem } from "@/features/dashboard/utils";
import { buildDonutPalette } from "@/utils/colors";

export const UNGROUPED_GROUP_KEY = "ungrouped";
export const UNGROUPED_GROUP_NAME = "Ungrouped";

export type AccountGroupBucket = {
  id: string | null;
  key: string;
  name: string;
  isUngrouped: boolean;
  accounts: AccountSummary[];
  accountIds: string[];
  accountCount: number;
  issueCount: number;
  primaryCapacityCredits: number;
  primaryRemainingCredits: number;
  secondaryCapacityCredits: number;
  secondaryRemainingCredits: number;
  primaryRemainingPercent: number | null;
  secondaryRemainingPercent: number | null;
};

function bucketKey(groupId: string | null | undefined): string {
  return groupId ?? UNGROUPED_GROUP_KEY;
}

function createEmptyBucket(
  groupId: string | null,
  name: string,
  isUngrouped: boolean,
): AccountGroupBucket {
  return {
    id: groupId,
    key: bucketKey(groupId),
    name,
    isUngrouped,
    accounts: [],
    accountIds: [],
    accountCount: 0,
    issueCount: 0,
    primaryCapacityCredits: 0,
    primaryRemainingCredits: 0,
    secondaryCapacityCredits: 0,
    secondaryRemainingCredits: 0,
    primaryRemainingPercent: null,
    secondaryRemainingPercent: null,
  };
}

export function buildAccountGroupBuckets(
  accounts: AccountSummary[],
  persistedGroups: AccountGroup[] = [],
): AccountGroupBucket[] {
  const buckets = new Map<string, AccountGroupBucket>();

  for (const group of persistedGroups) {
    buckets.set(group.id, createEmptyBucket(group.id, group.name, false));
  }

  for (const account of accounts) {
    const groupId = account.accountGroupId ?? null;
    const key = bucketKey(groupId);
    const existing =
      buckets.get(key) ??
      createEmptyBucket(groupId, account.accountGroupName ?? UNGROUPED_GROUP_NAME, groupId == null);

    existing.accounts.push(account);
    existing.accountIds.push(account.accountId);
    existing.accountCount += 1;
    if (account.status !== "active") {
      existing.issueCount += 1;
    }
    if (account.windowMinutesPrimary != null) {
      existing.primaryCapacityCredits += account.capacityCreditsPrimary ?? 0;
      existing.primaryRemainingCredits += account.remainingCreditsPrimary ?? 0;
    }
    if (account.windowMinutesSecondary != null) {
      existing.secondaryCapacityCredits += account.capacityCreditsSecondary ?? 0;
      existing.secondaryRemainingCredits += account.remainingCreditsSecondary ?? 0;
    }
    buckets.set(key, existing);
  }

  const result = [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      accounts: [...bucket.accounts].sort((a, b) => a.email.localeCompare(b.email)),
      accountIds: [...bucket.accountIds].sort((a, b) => a.localeCompare(b)),
      primaryRemainingPercent:
        bucket.primaryCapacityCredits > 0
          ? (bucket.primaryRemainingCredits / bucket.primaryCapacityCredits) * 100
          : null,
      secondaryRemainingPercent:
        bucket.secondaryCapacityCredits > 0
          ? (bucket.secondaryRemainingCredits / bucket.secondaryCapacityCredits) * 100
          : null,
    }))
    .sort((a, b) => {
      if (a.isUngrouped !== b.isUngrouped) {
        return a.isUngrouped ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

  return result;
}

export function groupRemainingItems(
  items: RemainingItem[],
  accounts: AccountSummary[],
  isDark = false,
): RemainingItem[] {
  const groupIndex = new Map<string, { name: string; accountIds: Set<string>; value: number }>();
  const accountGroupById = new Map(
    accounts.map((account) => [
      account.accountId,
      {
        key: bucketKey(account.accountGroupId),
        name: account.accountGroupName ?? UNGROUPED_GROUP_NAME,
      },
    ]),
  );

  for (const item of items) {
    const group = accountGroupById.get(item.accountId) ?? {
      key: UNGROUPED_GROUP_KEY,
      name: UNGROUPED_GROUP_NAME,
    };
    const existing = groupIndex.get(group.key) ?? {
      name: group.name,
      accountIds: new Set<string>(),
      value: 0,
    };
    existing.accountIds.add(item.accountId);
    existing.value += item.value;
    groupIndex.set(group.key, existing);
  }

  const palette = buildDonutPalette(groupIndex.size || 1, isDark);
  return [...groupIndex.entries()].map(([key, value], index) => ({
    accountId: key,
    label: value.name,
    labelSuffix: value.accountIds.size > 1 ? ` (${value.accountIds.size})` : "",
    isEmail: false,
    value: value.value,
    remainingPercent: null,
    color: palette[index % palette.length],
  }));
}

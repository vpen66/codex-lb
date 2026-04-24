import { describe, expect, it } from "vitest";

import { buildAccountGroupBuckets } from "@/features/account-groups/utils";
import { createAccountGroup, createAccountSummary } from "@/test/mocks/factories";

describe("buildAccountGroupBuckets", () => {
  it("does not count weekly-only accounts toward 5h group totals", () => {
    const group = createAccountGroup({
      id: "grp_free",
      name: "Free Pool",
      accountIds: ["acc-1", "acc-2"],
      accountCount: 2,
    });
    const accounts = [
      createAccountSummary({
        accountId: "acc-1",
        email: "free-1@example.com",
        displayName: "free-1@example.com",
        planType: "free",
        accountGroupId: "grp_free",
        accountGroupName: "Free Pool",
        usage: {
          primaryRemainingPercent: null,
          secondaryRemainingPercent: 100,
        },
        resetAtPrimary: null,
        windowMinutesPrimary: null,
        capacityCreditsPrimary: 33.75,
        remainingCreditsPrimary: null,
        resetAtSecondary: "2026-01-08T12:00:00.000Z",
        windowMinutesSecondary: 10_080,
        capacityCreditsSecondary: 1_134,
        remainingCreditsSecondary: 1_134,
      }),
      createAccountSummary({
        accountId: "acc-2",
        email: "free-2@example.com",
        displayName: "free-2@example.com",
        planType: "free",
        accountGroupId: "grp_free",
        accountGroupName: "Free Pool",
        usage: {
          primaryRemainingPercent: null,
          secondaryRemainingPercent: 80,
        },
        resetAtPrimary: null,
        windowMinutesPrimary: null,
        capacityCreditsPrimary: 33.75,
        remainingCreditsPrimary: null,
        resetAtSecondary: "2026-01-08T12:00:00.000Z",
        windowMinutesSecondary: 10_080,
        capacityCreditsSecondary: 1_134,
        remainingCreditsSecondary: 907.2,
      }),
    ];

    const [bucket] = buildAccountGroupBuckets(accounts, [group]);

    expect(bucket.primaryCapacityCredits).toBe(0);
    expect(bucket.primaryRemainingCredits).toBe(0);
    expect(bucket.primaryRemainingPercent).toBeNull();
    expect(bucket.secondaryCapacityCredits).toBe(2_268);
    expect(bucket.secondaryRemainingCredits).toBeCloseTo(2_041.2);
    expect(bucket.secondaryRemainingPercent).toBeCloseTo(90);
  });
});

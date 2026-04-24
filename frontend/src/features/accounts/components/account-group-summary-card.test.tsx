import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AccountGroupSummaryCard } from "@/features/accounts/components/account-group-summary-card";
import { buildAccountGroupBuckets } from "@/features/account-groups/utils";
import { createAccountGroup, createAccountSummary } from "@/test/mocks/factories";

describe("AccountGroupSummaryCard", () => {
  it("does not render the member snapshot block", () => {
    const group = createAccountGroup({
      id: "grp_ops",
      name: "Operations",
      accountIds: ["acc-1", "acc-2"],
      accountCount: 2,
    });
    const bucket = buildAccountGroupBuckets([
      createAccountSummary({
        accountId: "acc-1",
        email: "primary@example.com",
        accountGroupId: "grp_ops",
        accountGroupName: "Operations",
      }),
      createAccountSummary({
        accountId: "acc-2",
        email: "secondary@example.com",
        accountGroupId: "grp_ops",
        accountGroupName: "Operations",
      }),
    ], [group])[0];

    render(<AccountGroupSummaryCard group={bucket} />);

    expect(screen.queryByText("Member Snapshot")).not.toBeInTheDocument();
    expect(screen.queryByText(/primary@example\.com/)).not.toBeInTheDocument();
    expect(screen.getByText("5h Remaining")).toBeInTheDocument();
    expect(screen.getByText("Weekly Remaining")).toBeInTheDocument();
  });
});

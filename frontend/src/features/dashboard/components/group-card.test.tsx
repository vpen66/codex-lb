import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GroupCard } from "@/features/dashboard/components/group-card";
import { createAccountGroup, createAccountSummary } from "@/test/mocks/factories";
import { buildAccountGroupBuckets } from "@/features/account-groups/utils";

describe("GroupCard", () => {
  it("does not render member preview content", () => {
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

    render(<GroupCard group={bucket} />);

    expect(screen.queryByText("Members")).not.toBeInTheDocument();
    expect(screen.queryByText(/primary@example\.com/)).not.toBeInTheDocument();
    expect(screen.getByText("Open Group")).toBeInTheDocument();
  });
});

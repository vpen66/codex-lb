import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "@/App";
import { renderWithProviders } from "@/test/utils";

describe("accounts flow integration", () => {
  it("supports group creation, account selection, and pause/resume actions", async () => {
    const user = userEvent.setup({ delay: null });

    window.history.pushState({}, "", "/accounts");
    renderWithProviders(<App />);

    expect(await screen.findByRole("heading", { name: "Accounts" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Operations/ })).toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Paused" }));
    expect(await screen.findByRole("button", { name: /Operations/ })).toBeInTheDocument();
    expect(screen.queryByText("primary@example.com")).not.toBeInTheDocument();
    expect(await screen.findByText("secondary@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "All statuses" }));

    await user.click(await screen.findByText("secondary@example.com"));
    expect(
      await within(await screen.findByRole("region", { name: "Selected account details" })).findByText("secondary@example.com"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Group" }));
    await user.type(await screen.findByLabelText("Group Name"), "VIP");
    await user.click(await screen.findByRole("checkbox", { name: "Assign secondary@example.com" }));
    await user.click(screen.getByRole("button", { name: "Create Group" }));

    expect(await screen.findByRole("button", { name: /VIP/ })).toBeInTheDocument();
    expect((await screen.findAllByText("secondary@example.com")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /Operations/ }));
    act(() => {
      window.history.pushState({}, "", "/accounts?account=acc_secondary");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(await screen.findByRole("heading", { name: "VIP" })).toBeInTheDocument();
    const accountDetail = await screen.findByRole("region", { name: "Selected account details" });
    expect(await within(accountDetail).findByText("secondary@example.com")).toBeInTheDocument();
    expect(await screen.findByText("Token Status")).toBeInTheDocument();

    const resumeButton = within(accountDetail).queryByRole("button", { name: "Resume" });
    if (resumeButton) {
      await user.click(resumeButton);
      await waitFor(() => {
        expect(within(accountDetail).getByRole("button", { name: "Pause" })).toBeInTheDocument();
      });
    } else {
      await user.click(within(accountDetail).getByRole("button", { name: "Pause" }));
      await waitFor(() => {
        expect(within(accountDetail).getByRole("button", { name: "Resume" })).toBeInTheDocument();
      });
    }
  });
});

import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
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
    expect((await screen.findAllByText("secondary@example.com")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Quota exceeded"));
    expect(await screen.findByText("No accounts match this status")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "All statuses" }));
    expect(await screen.findByRole("button", { name: /Operations/ })).toBeInTheDocument();
    expect((await screen.findAllByText("primary@example.com")).length).toBeGreaterThan(0);

    const membersHeading = await screen.findByRole("heading", { name: "Members" });
    const membersSection = membersHeading.closest("section");
    if (!membersSection) {
      throw new Error("Members section not found");
    }

    await user.click(within(membersSection).getByText("secondary@example.com"));
    const initialAccountDialog = await screen.findByRole("dialog", { name: "Account details" });
    expect(
      await within(initialAccountDialog).findByRole("region", { name: "Selected account details" }),
    ).toBeInTheDocument();
    expect(await within(initialAccountDialog).findByText("secondary@example.com")).toBeInTheDocument();
    await user.click(within(initialAccountDialog).getByRole("button", { name: "Close" }));

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

    expect(await screen.findByRole("heading", { name: "VIP", hidden: true })).toBeInTheDocument();
    const accountDialog = await screen.findByRole("dialog", { name: "Account details" });
    const accountDetail = within(accountDialog).getByRole("region", { name: "Selected account details" });
    expect(await within(accountDetail).findByText("secondary@example.com")).toBeInTheDocument();
    expect(await within(accountDialog).findByText("Token Status")).toBeInTheDocument();

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

  it("supports dragging a member card into another group", async () => {
    const user = userEvent.setup({ delay: null });
    const dragStore = new Map<string, string>();
    const dataTransfer = {
      dropEffect: "move",
      effectAllowed: "all",
      files: [],
      items: [],
      types: [],
      clearData: () => {},
      getData: (key: string) => dragStore.get(key) ?? "",
      setData: (key: string, value: string) => {
        dragStore.set(key, value);
      },
      setDragImage: () => {},
    };

    window.history.pushState({}, "", "/accounts");
    renderWithProviders(<App />);

    expect(await screen.findByRole("heading", { name: "Accounts" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Operations/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New Group" }));
    await user.type(await screen.findByLabelText("Group Name"), "VIP");
    await user.click(screen.getByRole("button", { name: "Create Group" }));

    await user.click(await screen.findByRole("button", { name: /Operations/ }));

    const membersHeading = await screen.findByRole("heading", { name: "Members" });
    const membersSection = membersHeading.closest("section");
    if (!membersSection) {
      throw new Error("Members section not found");
    }

    const sourceText = within(membersSection).getByText("secondary@example.com");
    const sourceCard = sourceText.closest("[draggable='true']");
    if (!sourceCard) {
      throw new Error("Draggable account card not found");
    }

    const vipGroupButton = await screen.findByRole("button", { name: /VIP/ });

    fireEvent.dragStart(sourceCard, { dataTransfer });
    fireEvent.dragOver(vipGroupButton, { dataTransfer });
    fireEvent.drop(vipGroupButton, { dataTransfer });
    fireEvent.dragEnd(sourceCard, { dataTransfer });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "VIP", hidden: true })).toBeInTheDocument();
    });

    const updatedMembersHeading = await screen.findByRole("heading", { name: "Members" });
    const updatedMembersSection = updatedMembersHeading.closest("section");
    if (!updatedMembersSection) {
      throw new Error("Updated members section not found");
    }

    expect(await within(updatedMembersSection).findByText("secondary@example.com")).toBeInTheDocument();
  });
});

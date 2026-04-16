import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RecentRequestsTable } from "@/features/dashboard/components/recent-requests-table";

const ISO = "2026-01-01T12:00:00+00:00";
const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const PAGINATION_PROPS = {
  total: 1,
  limit: 25,
  offset: 0,
  hasMore: false,
  onLimitChange: vi.fn(),
  onOffsetChange: vi.fn(),
};

function renderTable(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("RecentRequestsTable", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("renders rows with status badges and navigates to account and request details", () => {
    renderTable(
      <RecentRequestsTable
        {...PAGINATION_PROPS}
        accounts={[
          {
            accountId: "acc-primary",
            email: "primary@example.com",
            displayName: "Primary Account",
            planType: "plus",
            status: "active",
            accountGroupId: "grp-ops",
            accountGroupName: "Operations",
            additionalQuotas: [],
          },
        ]}
        requests={[
          {
            logId: 1,
            requestedAt: ISO,
            accountId: "acc-primary",
            apiKeyName: "Key Alpha",
            requestId: "req-1",
            model: "gpt-5.1",
            serviceTier: "default",
            requestedServiceTier: "priority",
            actualServiceTier: "default",
            transport: "websocket",
            status: "rate_limit",
            errorCode: "rate_limit_exceeded",
            errorMessage: "Rate limit reached",
            tokens: 1200,
            cachedInputTokens: 200,
            reasoningEffort: "high",
            costUsd: 0.01,
            latencyMs: 1000,
          },
        ]}
      />,
    );

    expect(screen.getByText("Primary Account")).toBeInTheDocument();
    expect(screen.getByText("Key Alpha")).toBeInTheDocument();
    expect(screen.getByText("gpt-5.1 (high, default)")).toBeInTheDocument();
    expect(screen.getByText("Requested priority")).toBeInTheDocument();
    expect(screen.getByText("WS")).toBeInTheDocument();
    expect(screen.getByText("Rate limit")).toBeInTheDocument();
    expect(screen.getByText("rate_limit_exceeded")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Primary Account" }));
    expect(navigateMock).toHaveBeenCalledWith("/accounts?group=grp-ops&account=acc-primary");

    fireEvent.click(screen.getByRole("button", { name: "View Details" }));
    expect(navigateMock).toHaveBeenCalledWith("/request-logs/1");
  });

  it("renders empty state", () => {
    renderTable(<RecentRequestsTable {...PAGINATION_PROPS} total={0} accounts={[]} requests={[]} />);
    expect(screen.getByText("No request logs match the current filters.")).toBeInTheDocument();
  });

  it("renders placeholder transport for legacy rows", () => {
    renderTable(
      <RecentRequestsTable
        {...PAGINATION_PROPS}
        accounts={[]}
        requests={[
          {
            logId: 2,
            requestedAt: ISO,
            accountId: "acc-legacy",
            apiKeyName: null,
            requestId: "req-legacy",
            model: "gpt-5.1",
            serviceTier: null,
            requestedServiceTier: null,
            actualServiceTier: null,
            transport: null,
            status: "ok",
            errorCode: null,
            errorMessage: null,
            tokens: 1,
            cachedInputTokens: null,
            reasoningEffort: null,
            costUsd: 0,
            latencyMs: 1,
          },
        ]}
      />,
    );

    expect(screen.getAllByText("--")[0]).toBeInTheDocument();
  });

  it("shows details action for non-error rows too", () => {
    renderTable(
      <RecentRequestsTable
        {...PAGINATION_PROPS}
        accounts={[]}
        requests={[
          {
            logId: 3,
            requestedAt: ISO,
            accountId: "acc-legacy",
            apiKeyName: null,
            requestId: "req-error-code",
            model: "gpt-5.1",
            serviceTier: null,
            requestedServiceTier: null,
            actualServiceTier: null,
            transport: "http",
            status: "error",
            errorCode: "upstream_error",
            errorMessage: null,
            tokens: 1,
            cachedInputTokens: null,
            reasoningEffort: null,
            costUsd: 0,
            latencyMs: 1,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "View Details" }));
    expect(navigateMock).toHaveBeenCalledWith("/request-logs/3");
  });
});

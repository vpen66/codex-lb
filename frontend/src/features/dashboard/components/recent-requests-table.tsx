import { Inbox } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { isEmailLabel } from "@/components/blur-email";
import { usePrivacyStore } from "@/hooks/use-privacy";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/features/dashboard/components/filters/pagination-controls";
import type { AccountSummary, RequestLog } from "@/features/dashboard/schemas";
import { UNGROUPED_GROUP_KEY } from "@/features/account-groups/utils";
import { REQUEST_STATUS_LABELS } from "@/utils/constants";
import {
  formatCompactNumber,
  formatCurrency,
  formatModelLabel,
  formatTimeLong,
} from "@/utils/formatters";

const STATUS_CLASS_MAP: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20 dark:text-emerald-400",
  rate_limit: "bg-orange-500/15 text-orange-700 border-orange-500/20 hover:bg-orange-500/20 dark:text-orange-400",
  quota: "bg-red-500/15 text-red-700 border-red-500/20 hover:bg-red-500/20 dark:text-red-400",
  error: "bg-zinc-500/15 text-zinc-700 border-zinc-500/20 hover:bg-zinc-500/20 dark:text-zinc-400",
};

const TRANSPORT_LABELS: Record<string, string> = {
  http: "HTTP",
  websocket: "WS",
};

const TRANSPORT_CLASS_MAP: Record<string, string> = {
  http: "bg-slate-500/10 text-slate-700 border-slate-500/20 hover:bg-slate-500/15 dark:text-slate-300",
  websocket: "bg-sky-500/15 text-sky-700 border-sky-500/20 hover:bg-sky-500/20 dark:text-sky-300",
};

export type RecentRequestsTableProps = {
  requests: RequestLog[];
  accounts: AccountSummary[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  onLimitChange: (limit: number) => void;
  onOffsetChange: (offset: number) => void;
};

export function RecentRequestsTable({
  requests,
  accounts,
  total,
  limit,
  offset,
  hasMore,
  onLimitChange,
  onOffsetChange,
}: RecentRequestsTableProps) {
  const navigate = useNavigate();
  const blurred = usePrivacyStore((s) => s.blurred);

  const accountLabelMap = useMemo(() => {
    const index = new Map<string, string>();
    for (const account of accounts) {
      index.set(account.accountId, account.displayName || account.email || account.accountId);
    }
    return index;
  }, [accounts]);

  /** Account IDs whose label is an email. */
  const emailLabelIds = useMemo(() => {
    const ids = new Set<string>();
    for (const account of accounts) {
      const label = account.displayName || account.email;
      if (isEmailLabel(label, account.email)) {
        ids.add(account.accountId);
      }
    }
    return ids;
  }, [accounts]);

  const accountRouteMap = useMemo(() => {
    const index = new Map<string, string>();
    for (const account of accounts) {
      const params = new URLSearchParams({
        group: account.accountGroupId ?? UNGROUPED_GROUP_KEY,
        account: account.accountId,
      });
      index.set(account.accountId, `/accounts?${params.toString()}`);
    }
    return index;
  }, [accounts]);

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No request logs"
        description="No request logs match the current filters."
      />
    );
  }

  return (
    <div className="space-y-3">
    <div className="rounded-xl border bg-card">
      <div className="relative overflow-x-auto">
        <Table className="min-w-[1160px] table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-28 pl-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Time</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Account</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">API Key</TableHead>
              <TableHead className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Model</TableHead>
              <TableHead className="w-20 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Transport</TableHead>
              <TableHead className="w-24 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Status</TableHead>
              <TableHead className="w-24 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Tokens</TableHead>
              <TableHead className="w-16 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Cost</TableHead>
              <TableHead className="w-72 pr-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => {
              const time = formatTimeLong(request.requestedAt);
              const accountLabel = request.accountId ? (accountLabelMap.get(request.accountId) ?? request.accountId) : "—";
              const accountRoute = request.accountId
                ? (accountRouteMap.get(request.accountId) ?? `/accounts?${new URLSearchParams({ account: request.accountId }).toString()}`)
                : null;
              const isEmailLabel = !!(request.accountId && emailLabelIds.has(request.accountId));
              const errorPreview = request.errorMessage || request.errorCode || "-";
              const hasError = !!(request.errorCode || request.errorMessage);
              const visibleServiceTier = request.actualServiceTier ?? request.serviceTier;
              const showRequestedTier =
                !!request.requestedServiceTier && request.requestedServiceTier !== visibleServiceTier;

              return (
                <TableRow key={request.requestId}>
                  <TableCell className="pl-4 align-top">
                    <div className="leading-tight">
                      <div className="text-sm font-medium">{time.time}</div>
                      <div className="text-xs text-muted-foreground">{time.date}</div>
                    </div>
                  </TableCell>
                  <TableCell className="truncate align-top text-sm">
                    {accountRoute ? (
                      <button
                        type="button"
                        className="max-w-full truncate text-left font-medium text-foreground transition-colors hover:text-primary"
                        onClick={() => navigate(accountRoute)}
                      >
                        {isEmailLabel && blurred ? (
                          <span className="privacy-blur">{accountLabel}</span>
                        ) : (
                          accountLabel
                        )}
                      </button>
                    ) : (
                      isEmailLabel && blurred ? (
                        <span className="privacy-blur">{accountLabel}</span>
                      ) : (
                        accountLabel
                      )
                    )}
                  </TableCell>
                  <TableCell className="truncate align-top text-xs text-muted-foreground">
                    {request.apiKeyName || "--"}
                  </TableCell>
                  <TableCell className="truncate align-top">
                    <div className="leading-tight">
                      <span className="font-mono text-xs">
                        {formatModelLabel(request.model, request.reasoningEffort, visibleServiceTier)}
                      </span>
                      {showRequestedTier ? (
                        <div className="text-[11px] text-muted-foreground">
                          Requested {request.requestedServiceTier}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    {request.transport ? (
                      <Badge
                        variant="outline"
                        className={TRANSPORT_CLASS_MAP[request.transport] ?? TRANSPORT_CLASS_MAP.http}
                      >
                        {TRANSPORT_LABELS[request.transport] ?? request.transport}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge
                      variant="outline"
                      className={STATUS_CLASS_MAP[request.status] ?? STATUS_CLASS_MAP.error}
                    >
                      {REQUEST_STATUS_LABELS[request.status] ?? request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right align-top font-mono text-xs tabular-nums">
                    <div className="leading-tight">
                      <div>{formatCompactNumber(request.tokens)}</div>
                      {request.cachedInputTokens != null && request.cachedInputTokens > 0 && (
                        <div className="text-[11px] text-muted-foreground">
                          {formatCompactNumber(request.cachedInputTokens)} Cached
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right align-top font-mono text-xs tabular-nums">
                    {formatCurrency(request.costUsd)}
                  </TableCell>
                  <TableCell className="pr-4 align-top whitespace-normal">
                    {hasError ? (
                      <div className="space-y-2">
                        {request.errorCode ? (
                          <div>
                            <Badge variant="outline" className="max-w-full font-mono text-[10px]">
                              <span className="truncate">{request.errorCode}</span>
                            </Badge>
                          </div>
                        ) : null}
                        <p className="line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">
                          {errorPreview}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[11px]"
                          onClick={() => navigate(`/request-logs/${request.logId}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => navigate(`/request-logs/${request.logId}`)}
                      >
                        View Details
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>

      <div className="flex justify-end">
        <PaginationControls
          total={total}
          limit={limit}
          offset={offset}
          hasMore={hasMore}
          onLimitChange={onLimitChange}
          onOffsetChange={onOffsetChange}
        />
      </div>
    </div>
  );
}

import { ArrowLeft, Clock3, Database, FileSearch, FolderKanban, Timer } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AlertMessage } from "@/components/alert-message";
import { CopyButton } from "@/components/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRequestLogDetail } from "@/features/dashboard/hooks/use-request-log-detail";
import { REQUEST_STATUS_LABELS } from "@/utils/constants";
import {
  formatCompactNumber,
  formatCurrency,
  formatModelLabel,
  formatTimeLong,
} from "@/utils/formatters";

const STATUS_CLASS_MAP: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  rate_limit: "bg-orange-500/15 text-orange-700 border-orange-500/20 dark:text-orange-400",
  quota: "bg-red-500/15 text-red-700 border-red-500/20 dark:text-red-400",
  error: "bg-zinc-500/15 text-zinc-700 border-zinc-500/20 dark:text-zinc-400",
};

const TRANSPORT_LABELS: Record<string, string> = {
  http: "HTTP",
  websocket: "WS",
};

function DetailField({
  label,
  value,
  mono = false,
  copyValue,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyValue?: string;
}) {
  return (
    <div className="space-y-1.5 rounded-2xl border bg-card/80 p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>{label}</span>
        {copyValue ? <CopyButton value={copyValue} label={`Copy ${label}`} iconOnly /> : null}
      </div>
      <p className={`break-all text-sm leading-relaxed ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

export function RequestLogDetailPage() {
  const navigate = useNavigate();
  const params = useParams();
  const parsedLogId = Number(params.logId);
  const logId = Number.isFinite(parsedLogId) ? parsedLogId : null;
  const detailQuery = useRequestLogDetail(logId);
  const detail = detailQuery.data;

  const time = useMemo(
    () => (detail ? formatTimeLong(detail.requestedAt) : null),
    [detail],
  );

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2 gap-1.5 text-muted-foreground"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Request Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect a single request outside the paginated table context.
          </p>
        </div>
      </div>

      {detailQuery.error instanceof Error ? (
        <AlertMessage variant="error">{detailQuery.error.message}</AlertMessage>
      ) : null}

      {!detail ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-36 rounded-2xl border bg-card/60" />
          <div className="h-36 rounded-2xl border bg-card/60" />
          <div className="h-36 rounded-2xl border bg-card/60" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
            <section className="rounded-3xl border bg-card p-5 shadow-sm shadow-black/5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={STATUS_CLASS_MAP[detail.status] ?? STATUS_CLASS_MAP.error}>
                  {REQUEST_STATUS_LABELS[detail.status] ?? detail.status}
                </Badge>
                {detail.transport ? (
                  <Badge variant="outline">{TRANSPORT_LABELS[detail.transport] ?? detail.transport}</Badge>
                ) : null}
                {detail.accountGroupName ? (
                  <Badge variant="outline" className="gap-1.5">
                    <FolderKanban className="h-3 w-3" />
                    {detail.accountGroupName}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailField label="Request ID" value={detail.requestId} mono copyValue={detail.requestId} />
                <DetailField
                  label="Model"
                  value={formatModelLabel(
                    detail.model,
                    detail.reasoningEffort,
                    detail.actualServiceTier ?? detail.serviceTier,
                  )}
                  mono
                />
                <DetailField
                  label="Account"
                  value={detail.accountEmail ?? detail.accountId ?? "—"}
                  copyValue={detail.accountEmail ?? detail.accountId ?? undefined}
                />
                <DetailField label="API Key" value={detail.apiKeyName ?? "—"} />
                <DetailField
                  label="Requested At"
                  value={time ? `${time.time} ${time.date}` : "—"}
                />
                <DetailField
                  label="Service Tier"
                  value={detail.actualServiceTier ?? detail.serviceTier ?? "—"}
                />
              </div>
            </section>

            <section className="rounded-3xl border bg-card p-5 shadow-sm shadow-black/5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Performance
              </h2>
              <div className="mt-4 grid gap-3">
                <DetailField label="Latency" value={detail.latencyMs != null ? `${detail.latencyMs} ms` : "—"} />
                <DetailField
                  label="First Token"
                  value={detail.latencyFirstTokenMs != null ? `${detail.latencyFirstTokenMs} ms` : "—"}
                />
                <DetailField label="Total Tokens" value={formatCompactNumber(detail.tokens ?? 0)} mono />
                <DetailField label="Cost" value={formatCurrency(detail.costUsd)} mono />
              </div>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-3xl border bg-card p-5 shadow-sm shadow-black/5">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Token Breakdown
                </h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <DetailField label="Input" value={formatCompactNumber(detail.inputTokens ?? 0)} mono />
                <DetailField label="Cached Input" value={formatCompactNumber(detail.cachedInputTokens ?? 0)} mono />
                <DetailField label="Output" value={formatCompactNumber(detail.outputTokens ?? 0)} mono />
                <DetailField label="Reasoning" value={formatCompactNumber(detail.reasoningTokens ?? 0)} mono />
              </div>
            </section>

            <section className="rounded-3xl border bg-card p-5 shadow-sm shadow-black/5">
              <div className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Error Detail
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                <DetailField label="Error Code" value={detail.errorCode ?? "—"} mono />
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    <Timer className="h-3.5 w-3.5" />
                    Error Message
                    {detail.errorMessage ? (
                      <CopyButton value={detail.errorMessage} label="Copy error message" iconOnly />
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
                    {detail.errorMessage ?? "No error detail recorded."}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-3xl border bg-card p-5 shadow-sm shadow-black/5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Clock3 className="h-4 w-4" />
              Context
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <DetailField label="Log ID" value={String(detail.logId)} mono copyValue={String(detail.logId)} />
              <DetailField label="Transport" value={detail.transport ?? "—"} />
              <DetailField label="Requested Tier" value={detail.requestedServiceTier ?? "—"} />
              <DetailField label="Actual Tier" value={detail.actualServiceTier ?? "—"} />
              <DetailField
                label="Account ID"
                value={detail.accountId ?? "—"}
                mono
                copyValue={detail.accountId ?? undefined}
              />
              <DetailField
                label="Account Email"
                value={detail.accountEmail ?? "—"}
                copyValue={detail.accountEmail ?? undefined}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";

import { getRequestLogDetail } from "@/features/dashboard/api";

export function useRequestLogDetail(logId: number | null) {
  return useQuery({
    queryKey: ["dashboard", "request-log-detail", logId],
    queryFn: () => getRequestLogDetail(logId!),
    enabled: typeof logId === "number" && Number.isFinite(logId),
    refetchOnWindowFocus: true,
  });
}

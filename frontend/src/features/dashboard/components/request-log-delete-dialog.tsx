import { useEffect, useMemo, useState } from "react";

import { AlertMessage } from "@/components/alert-message";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toIsoDateTime } from "@/utils/formatters";

type RequestLogDeleteDialogProps = {
  open: boolean;
  pending: boolean;
  initialSince: string;
  initialUntil: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (range: { since: string; until: string }) => Promise<void> | void;
};

export function RequestLogDeleteDialog({
  open,
  pending,
  initialSince,
  initialUntil,
  onOpenChange,
  onConfirm,
}: RequestLogDeleteDialogProps) {
  const [sinceInput, setSinceInput] = useState("");
  const [untilInput, setUntilInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSinceInput(initialSince);
    setUntilInput(initialUntil);
    setFormError(null);
  }, [initialSince, initialUntil, open]);

  const validationError = useMemo(() => {
    if (!sinceInput || !untilInput) {
      return "Start and end times are required.";
    }
    const sinceIso = toIsoDateTime(sinceInput);
    const untilIso = toIsoDateTime(untilInput);
    if (!sinceIso || !untilIso) {
      return "Enter valid start and end times.";
    }
    if (new Date(sinceIso).getTime() > new Date(untilIso).getTime()) {
      return "Start time must be earlier than or equal to end time.";
    }
    return null;
  }, [sinceInput, untilInput]);

  const handleConfirm = async () => {
    const since = toIsoDateTime(sinceInput);
    const until = toIsoDateTime(untilInput);
    if (!since || !until || validationError) {
      setFormError(validationError ?? "Enter a valid delete range.");
      return;
    }
    setFormError(null);
    await onConfirm({ since, until });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Delete Request Logs</DialogTitle>
          <DialogDescription>
            Delete all request logs in the selected time range. Current account, model, and status filters are not applied.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {formError ? <AlertMessage variant="error">{formError}</AlertMessage> : null}
          <div className="grid gap-2">
            <Label htmlFor="request-log-delete-since">From</Label>
            <Input
              id="request-log-delete-since"
              type="datetime-local"
              value={sinceInput}
              onChange={(event) => setSinceInput(event.target.value)}
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="request-log-delete-until">To</Label>
            <Input
              id="request-log-delete-until"
              type="datetime-local"
              value={untilInput}
              onChange={(event) => setUntilInput(event.target.value)}
              disabled={pending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={() => void handleConfirm()} disabled={pending}>
            Delete Logs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

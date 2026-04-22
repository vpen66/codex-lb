import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
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
import type { AccountGroupBucket } from "@/features/account-groups/utils";
import type { AccountSummary } from "@/features/accounts/schemas";

export type AccountGroupDialogProps = {
  open: boolean;
  busy: boolean;
  mode: "create" | "edit";
  accounts: AccountSummary[];
  group: AccountGroupBucket | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { name: string; accountIds: string[] }) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function AccountGroupDialog({
  open,
  busy,
  mode,
  accounts,
  group,
  onOpenChange,
  onSubmit,
  onDelete,
}: AccountGroupDialogProps) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(group?.name ?? "");
    setSearch("");
    setSelectedIds(group?.accountIds ?? []);
  }, [group, open]);

  const filteredAccounts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return accounts;
    }
    return accounts.filter((account) => {
      return (
        account.email.toLowerCase().includes(needle) ||
        account.accountId.toLowerCase().includes(needle) ||
        account.planType.toLowerCase().includes(needle)
      );
    });
  }, [accounts, search]);

  const toggleAccount = (accountId: string, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, accountId])] : current.filter((id) => id !== accountId),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Group" : "Edit Group"}</DialogTitle>
          <DialogDescription>
            Name the group and choose which accounts belong to it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="For example: Ops, VIP, Backup Pool"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="group-account-search">Accounts</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="group-account-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter accounts by email or ID..."
                className="pl-9"
              />
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border bg-muted/20 p-3">
              {filteredAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matching accounts.</p>
              ) : (
                filteredAccounts.map((account) => {
                  const checked = selectedIds.includes(account.accountId);
                  return (
                    <label
                      key={account.accountId}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card px-3 py-2.5 transition-colors hover:bg-accent/40"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleAccount(account.accountId, value === true)}
                        aria-label={`Assign ${account.email}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{account.email}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {account.planType} · {account.status}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div>
            {mode === "edit" && onDelete ? (
              <Button type="button" variant="destructive" onClick={() => void onDelete()} disabled={busy}>
                Delete Group
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void onSubmit({ name, accountIds: selectedIds })}
              disabled={busy}
            >
              {mode === "create" ? "Create Group" : "Save Group"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

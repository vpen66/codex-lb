import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FolderOpen, Plus, Upload } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { AlertMessage } from "@/components/alert-message";
import { LoadingOverlay } from "@/components/layout/loading-overlay";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useDialogState } from "@/hooks/use-dialog-state";
import { AccountGroupDialog } from "@/features/accounts/components/account-group-dialog";
import { AccountGroupSidebar } from "@/features/accounts/components/account-group-sidebar";
import { AccountGroupSummaryCard } from "@/features/accounts/components/account-group-summary-card";
import { AccountDetail } from "@/features/accounts/components/account-detail";
import { AccountsSkeleton } from "@/features/accounts/components/accounts-skeleton";
import { ImportDialog } from "@/features/accounts/components/import-dialog";
import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { useOauth } from "@/features/accounts/hooks/use-oauth";
import { useAccountGroups } from "@/features/account-groups/hooks/use-account-groups";
import { buildAccountGroupBuckets } from "@/features/account-groups/utils";
import { AccountCard } from "@/features/dashboard/components/account-card";
import { buildDuplicateAccountIdSet } from "@/utils/account-identifiers";
import { getErrorMessageOrNull } from "@/utils/errors";

const OauthDialog = lazy(() =>
  import("@/features/accounts/components/oauth-dialog").then((m) => ({ default: m.OauthDialog })),
);

export function AccountsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState("all");
  const {
    accountsQuery,
    importMutation,
    pauseMutation,
    resumeMutation,
    deleteMutation,
  } = useAccounts();
  const {
    groupsQuery,
    createMutation: createGroupMutation,
    updateMutation: updateGroupMutation,
    deleteMutation: deleteGroupMutation,
  } = useAccountGroups();
  const oauth = useOauth();

  const importDialog = useDialogState();
  const oauthDialog = useDialogState();
  const deleteDialog = useDialogState<string>();
  const groupDialog = useDialogState<{ mode: "create" | "edit"; groupId: string | null }>();

  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const persistedGroups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);
  const duplicateAccountIds = useMemo(() => buildDuplicateAccountIdSet(accounts), [accounts]);
  const selectedAccountId = searchParams.get("account");
  const selectedGroupKey = searchParams.get("group");
  const allGroups = useMemo(
    () => buildAccountGroupBuckets(accounts, persistedGroups),
    [accounts, persistedGroups],
  );
  const filteredAccounts = useMemo(
    () => accounts.filter((account) => statusFilter === "all" || account.status === statusFilter),
    [accounts, statusFilter],
  );
  const groups = useMemo(
    () => buildAccountGroupBuckets(filteredAccounts, persistedGroups)
      .filter((group) => statusFilter === "all" || group.accountCount > 0),
    [filteredAccounts, persistedGroups, statusFilter],
  );

  const handleSelectGroup = useCallback((groupKey: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("group", groupKey);
    nextSearchParams.delete("account");
    setSearchParams(nextSearchParams);
  }, [searchParams, setSearchParams]);

  const handleCloseAccountDetail = useCallback(() => {
    if (!selectedAccountId) {
      return;
    }
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("account");
    setSearchParams(nextSearchParams);
  }, [searchParams, selectedAccountId, setSearchParams]);

  const selectedAccountGroup = useMemo(() => {
    if (!selectedAccountId) {
      return null;
    }
    return groups.find((group) => group.accounts.some((account) => account.accountId === selectedAccountId)) ?? null;
  }, [groups, selectedAccountId]);

  const resolvedSelectedGroup = useMemo(() => {
    if (groups.length === 0) {
      return null;
    }
    if (selectedAccountGroup) {
      return selectedAccountGroup;
    }
    if (selectedGroupKey) {
      return groups.find((group) => group.key === selectedGroupKey) ?? groups[0];
    }
    return groups[0];
  }, [groups, selectedAccountGroup, selectedGroupKey]);

  const handleSelectAccount = useCallback((accountId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (resolvedSelectedGroup) {
      nextSearchParams.set("group", resolvedSelectedGroup.key);
    }
    nextSearchParams.set("account", accountId);
    setSearchParams(nextSearchParams);
  }, [resolvedSelectedGroup, searchParams, setSearchParams]);

  const selectedAccount = useMemo(
    () =>
      selectedAccountId
        ? resolvedSelectedGroup?.accounts.find((account) => account.accountId === selectedAccountId) ?? null
        : null,
    [resolvedSelectedGroup, selectedAccountId],
  );

  const mutationBusy =
    importMutation.isPending ||
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    deleteMutation.isPending ||
    createGroupMutation.isPending ||
    updateGroupMutation.isPending ||
    deleteGroupMutation.isPending;

  const mutationError =
    getErrorMessageOrNull(importMutation.error) ||
    getErrorMessageOrNull(pauseMutation.error) ||
    getErrorMessageOrNull(resumeMutation.error) ||
    getErrorMessageOrNull(deleteMutation.error) ||
    getErrorMessageOrNull(groupsQuery.error) ||
    getErrorMessageOrNull(createGroupMutation.error) ||
    getErrorMessageOrNull(updateGroupMutation.error) ||
    getErrorMessageOrNull(deleteGroupMutation.error);

  const editableGroup = useMemo(() => {
    if (!resolvedSelectedGroup?.id) {
      return null;
    }
    return persistedGroups.find((group) => group.id === resolvedSelectedGroup.id) ?? null;
  }, [persistedGroups, resolvedSelectedGroup]);

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize accounts into groups, inspect pooled quota, and drill into members only when needed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="gap-1.5" onClick={() => importDialog.show()}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button type="button" variant="outline" className="gap-1.5" onClick={() => oauthDialog.show()}>
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
          <Button type="button" className="gap-1.5" onClick={() => groupDialog.show({ mode: "create", groupId: null })}>
            <FolderOpen className="h-4 w-4" />
            New Group
          </Button>
        </div>
      </div>

      {mutationError ? <AlertMessage variant="error">{mutationError}</AlertMessage> : null}

      {!accountsQuery.data || !groupsQuery.data ? (
        <AccountsSkeleton />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={statusFilter === "all" ? "No accounts connected yet" : "No accounts match this status"}
          description={
            statusFilter === "all"
              ? "Import or authenticate an account before organizing them into groups."
              : "Try another status filter or switch back to All statuses."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="rounded-3xl border bg-card p-4">
            <AccountGroupSidebar
              groups={groups}
              selectedGroupKey={resolvedSelectedGroup?.key ?? null}
              statusFilter={statusFilter}
              onSelect={handleSelectGroup}
              onStatusFilterChange={setStatusFilter}
              onCreateGroup={() => groupDialog.show({ mode: "create", groupId: null })}
            />
          </div>

          <div className="space-y-4">
            {resolvedSelectedGroup ? (
              <>
                <AccountGroupSummaryCard
                  group={resolvedSelectedGroup}
                  onEdit={editableGroup ? () => groupDialog.show({ mode: "edit", groupId: editableGroup.id }) : undefined}
                />

                <section className="space-y-4 rounded-3xl border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
                      Members
                    </h2>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {resolvedSelectedGroup.accounts.length === 0 ? (
                    <EmptyState
                      icon={FolderOpen}
                      title="No accounts in this group"
                      description="Edit the group to assign accounts."
                    />
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {resolvedSelectedGroup.accounts.map((account) => (
                        <div
                          key={account.accountId}
                          className={selectedAccountId === account.accountId ? "rounded-2xl ring-2 ring-primary/25" : ""}
                        >
                          <AccountCard
                            account={account}
                            showAccountId={duplicateAccountIds.has(account.accountId)}
                            onSelect={handleSelectAccount}
                            onAction={(currentAccount, action) => {
                              if (action === "details") {
                                handleSelectAccount(currentAccount.accountId);
                                return;
                              }
                              if (action === "resume") {
                                void resumeMutation.mutateAsync(currentAccount.accountId);
                                return;
                              }
                              if (action === "reauth") {
                                handleSelectAccount(currentAccount.accountId);
                                oauthDialog.show();
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            ) : (
              <EmptyState
                icon={FolderOpen}
                title={statusFilter === "all" ? "No groups available" : "No accounts match this status"}
                description={
                  statusFilter === "all"
                    ? "Create a group to start organizing imported accounts."
                    : "Try another status filter or switch back to All statuses."
                }
              />
            )}
          </div>
        </div>
      )}

      <ImportDialog
        open={importDialog.open}
        busy={importMutation.isPending}
        error={getErrorMessageOrNull(importMutation.error)}
        onOpenChange={importDialog.onOpenChange}
        onImport={async (file) => {
          await importMutation.mutateAsync(file);
        }}
      />

      <Suspense fallback={null}>
        <OauthDialog
          open={oauthDialog.open}
          state={oauth.state}
          onOpenChange={oauthDialog.onOpenChange}
          onStart={async (method) => {
            await oauth.start(method);
          }}
          onComplete={async () => {
            await oauth.complete();
            await accountsQuery.refetch();
          }}
          onManualCallback={async (callbackUrl) => {
            await oauth.manualCallback(callbackUrl);
          }}
          onReset={oauth.reset}
        />
      </Suspense>

      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete account"
        description="This action removes the account from the load balancer configuration."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onOpenChange={deleteDialog.onOpenChange}
        onConfirm={() => {
          if (!deleteDialog.data) {
            return;
          }
          const deletedAccountId = deleteDialog.data;
          void deleteMutation.mutateAsync(deletedAccountId).finally(() => {
            if (deletedAccountId === selectedAccountId) {
              handleCloseAccountDetail();
            }
            deleteDialog.hide();
          });
        }}
      />

      <Dialog open={selectedAccount != null} onOpenChange={(open) => !open && handleCloseAccountDetail()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-4xl">
          <DialogTitle className="sr-only">Account details</DialogTitle>
          <DialogDescription className="sr-only">
            Usage, token state, and actions for the selected account.
          </DialogDescription>
          <AccountDetail
            account={selectedAccount}
            variant="dialog"
            showAccountId={selectedAccount ? duplicateAccountIds.has(selectedAccount.accountId) : false}
            busy={mutationBusy}
            onPause={(accountId) => void pauseMutation.mutateAsync(accountId)}
            onResume={(accountId) => void resumeMutation.mutateAsync(accountId)}
            onDelete={(accountId) => deleteDialog.show(accountId)}
            onReauth={() => oauthDialog.show()}
          />
        </DialogContent>
      </Dialog>

      <AccountGroupDialog
        open={groupDialog.open}
        busy={mutationBusy}
        mode={groupDialog.data?.mode ?? "create"}
        accounts={accounts}
        group={
          groupDialog.data?.mode === "edit" && groupDialog.data.groupId
            ? allGroups.find((group) => group.id === groupDialog.data?.groupId) ?? null
            : null
        }
        onOpenChange={groupDialog.onOpenChange}
        onSubmit={async (payload) => {
          if (groupDialog.data?.mode === "edit" && groupDialog.data.groupId) {
            const updated = await updateGroupMutation.mutateAsync({
              groupId: groupDialog.data.groupId,
              payload,
            });
            groupDialog.hide();
            handleSelectGroup(updated.id);
            return;
          }
          const created = await createGroupMutation.mutateAsync(payload);
          groupDialog.hide();
          handleSelectGroup(created.id);
        }}
        onDelete={
          groupDialog.data?.mode === "edit" && groupDialog.data.groupId
            ? async () => {
                await deleteGroupMutation.mutateAsync(groupDialog.data!.groupId!);
                groupDialog.hide();
                const nextSearchParams = new URLSearchParams(searchParams);
                nextSearchParams.delete("group");
                nextSearchParams.delete("account");
                setSearchParams(nextSearchParams);
              }
            : undefined
        }
      />

      <LoadingOverlay visible={!!accountsQuery.data && mutationBusy} label="Updating accounts..." />
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createAccountGroup,
  deleteAccountGroup,
  listAccountGroups,
  updateAccountGroup,
} from "@/features/account-groups/api";

function invalidateGroupRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ["account-groups", "list"] });
  void queryClient.invalidateQueries({ queryKey: ["accounts", "list"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useAccountGroups() {
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: ["account-groups", "list"],
    queryFn: listAccountGroups,
    select: (data) => data.groups,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const createMutation = useMutation({
    mutationFn: createAccountGroup,
    onSuccess: () => {
      toast.success("Group created");
      invalidateGroupRelatedQueries(queryClient);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create group");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ groupId, payload }: { groupId: string; payload: unknown }) =>
      updateAccountGroup(groupId, payload),
    onSuccess: () => {
      toast.success("Group updated");
      invalidateGroupRelatedQueries(queryClient);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update group");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccountGroup,
    onSuccess: () => {
      toast.success("Group deleted");
      invalidateGroupRelatedQueries(queryClient);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete group");
    },
  });

  return { groupsQuery, createMutation, updateMutation, deleteMutation };
}

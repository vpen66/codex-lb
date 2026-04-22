import { del, get, post, put } from "@/lib/api-client";
import {
  AccountGroupDeleteResponseSchema,
  AccountGroupSchema,
  AccountGroupsResponseSchema,
  AccountGroupUpsertSchema,
} from "@/features/account-groups/schemas";

const ACCOUNT_GROUPS_PATH = "/api/account-groups";

export function listAccountGroups() {
  return get(ACCOUNT_GROUPS_PATH, AccountGroupsResponseSchema);
}

export function createAccountGroup(payload: unknown) {
  const validated = AccountGroupUpsertSchema.parse(payload);
  return post(ACCOUNT_GROUPS_PATH, AccountGroupSchema, { body: validated });
}

export function updateAccountGroup(groupId: string, payload: unknown) {
  const validated = AccountGroupUpsertSchema.parse(payload);
  return put(`${ACCOUNT_GROUPS_PATH}/${encodeURIComponent(groupId)}`, AccountGroupSchema, {
    body: validated,
  });
}

export function deleteAccountGroup(groupId: string) {
  return del(`${ACCOUNT_GROUPS_PATH}/${encodeURIComponent(groupId)}`, AccountGroupDeleteResponseSchema);
}

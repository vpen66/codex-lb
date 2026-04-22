import { z } from "zod";

export const AccountGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  accountIds: z.array(z.string()),
  accountCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const AccountGroupsResponseSchema = z.object({
  groups: z.array(AccountGroupSchema),
});

export const AccountGroupUpsertSchema = z.object({
  name: z.string().min(1),
  accountIds: z.array(z.string()).default([]),
});

export const AccountGroupDeleteResponseSchema = z.object({
  status: z.string(),
});

export type AccountGroup = z.infer<typeof AccountGroupSchema>;
export type AccountGroupsResponse = z.infer<typeof AccountGroupsResponseSchema>;
export type AccountGroupUpsert = z.infer<typeof AccountGroupUpsertSchema>;

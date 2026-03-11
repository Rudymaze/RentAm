import { z } from 'zod';

export const SuspendUserSchema = z.object({
  user_id: z.string().uuid(),
  duration_days: z.number().int().min(1).max(365),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

export const BanUserSchema = z.object({
  user_id: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

export const ResolveComplaintSchema = z.object({
  complaint_id: z.string().uuid(),
  resolution_notes: z.string().min(10).max(1000),
  action: z.enum(['warn_user', 'suspend_user', 'ban_user', 'no_action']),
  suspend_days: z.number().int().min(1).max(365).optional(),
});

export const DismissComplaintSchema = z.object({
  complaint_id: z.string().uuid(),
  resolution_notes: z.string().max(500).optional(),
});

export type SuspendUserInput = z.infer<typeof SuspendUserSchema>;
export type BanUserInput = z.infer<typeof BanUserSchema>;
export type ResolveComplaintInput = z.infer<typeof ResolveComplaintSchema>;
export type DismissComplaintInput = z.infer<typeof DismissComplaintSchema>;

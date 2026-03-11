export type UserStatus = 'active' | 'suspended' | 'banned';
export type ComplaintReason = 'spam' | 'scam_or_fraud' | 'inappropriate_content' | 'harassment' | 'other';
export type ComplaintStatus = 'new' | 'investigating' | 'resolved' | 'dismissed';
export type ModerationActionType =
  | 'suspend_user'
  | 'ban_user'
  | 'unsuspend_user'
  | 'warn_user'
  | 'resolve_complaint'
  | 'dismiss_complaint';
export type ResourceType = 'listing' | 'user' | 'inquiry';

export interface ModerationUser {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role: 'tenant' | 'landlord' | 'agent' | 'admin';
  status: UserStatus;
  status_reason: string | null;
  suspended_until: Date | null;
  moderation_notes: string | null;
  created_at: Date;
  updated_at: Date;
  isSuspended(): boolean;
  isBanned(): boolean;
  isActive(): boolean;
  canLogin(): boolean;
}

export interface Complaint {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  resource_type: ResourceType;
  resource_id: string;
  reason: ComplaintReason;
  details: string | null;
  status: ComplaintStatus;
  admin_id: string | null;
  resolution_notes: string | null;
  created_at: Date;
  updated_at: Date;
  getDisplayName(): string;
}

export interface ModerationAdminAction {
  id: string;
  admin_id: string;
  action_type: ModerationActionType;
  target_user_id: string | null;
  target_complaint_id: string | null;
  details: Record<string, unknown>;
  created_at: Date;
}

export function createModerationUser(
  data: Omit<ModerationUser, 'isSuspended' | 'isBanned' | 'isActive' | 'canLogin'>
): ModerationUser {
  return {
    ...data,
    isSuspended() {
      if (data.status !== 'suspended') return false;
      if (!data.suspended_until) return true;
      return new Date(data.suspended_until) > new Date();
    },
    isBanned() {
      return data.status === 'banned';
    },
    isActive() {
      return data.status === 'active';
    },
    canLogin() {
      if (data.status === 'banned') return false;
      if (data.status === 'suspended' && data.suspended_until) {
        return new Date(data.suspended_until) <= new Date();
      }
      return true;
    },
  };
}

export function createComplaint(
  data: Omit<Complaint, 'getDisplayName'>,
  resourceTitle?: string
): Complaint {
  return {
    ...data,
    getDisplayName() {
      return resourceTitle ?? `${data.resource_type} (${data.resource_id.slice(0, 8)}...)`;
    },
  };
}

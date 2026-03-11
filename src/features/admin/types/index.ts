export type FraudAlertType =
  | 'suspicious_listing'
  | 'duplicate_listing'
  | 'fake_photos'
  | 'unrealistic_pricing'
  | 'landlord_unverified'
  | 'rapid_submissions'
  | 'payment_fraud';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'new' | 'investigating' | 'resolved' | 'dismissed';
export type AlertResolution = 'false_positive' | 'action_taken' | 'escalated_to_legal';

export interface FraudAlertEvidence {
  suspicious_fields?: string[];
  metadata?: Record<string, unknown>;
  analysis_results?: Record<string, unknown>;
}

export interface FraudAlert {
  id: string;
  alert_type: FraudAlertType;
  severity: AlertSeverity;
  listing_id: string | null;
  user_id: string | null;
  description: string;
  evidence: FraudAlertEvidence | null;
  status: AlertStatus;
  assigned_to: string | null;
  investigation_notes: string | null;
  resolution: AlertResolution | null;
  created_at: Date;
  updated_at: Date;
  resolved_at: Date | null;
}

export type AdminActionType =
  | 'approve_listing'
  | 'reject_listing'
  | 'appeal_approved'
  | 'appeal_denied'
  | 'suspend_user'
  | 'ban_user'
  | 'unsuspend_user'
  | 'warn_user'
  | 'delete_user'
  | 'update_city'
  | 'create_promotion_tier'
  | 'update_promotion_tier'
  | 'dismiss_fraud_alert'
  | 'resolve_fraud_alert'
  | 'resolve_complaint'
  | 'dismiss_complaint';

export type ResourceType = 'listing' | 'user' | 'city' | 'promotion_tier' | 'fraud_alert' | 'complaint';

export interface AdminActionLog {
  id: string;
  admin_id: string;
  action_type: AdminActionType;
  resource_type: ResourceType;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface DashboardMetrics {
  total_listings: number;
  active_listings: number;
  pending_listings: number;
  rejected_listings: number;
  expired_listings: number;
  avg_approval_time_hours: number;
  total_users: number;
  total_tenants: number;
  total_landlords: number;
  promotion_revenue_fcfa: number;
  fraud_alerts_count: number;
  inquiries_this_month: number;
}

export interface MetricsTrends {
  listings_trend: number;
  users_trend: number;
  revenue_trend: number;
  last_updated: Date;
}

export interface ListingsAnalyticsMetrics {
  total_listings: number;
  active_listings: number;
  pending_listings: number;
  rejected_listings: number;
  expired_listings: number;
  avg_days_to_approval: number;
}

export interface UsersAnalyticsMetrics {
  total_users: number;
  active_users_30d: number;
  total_tenants: number;
  total_landlords: number;
  new_users_this_month: number;
  retention_rate: number;
}

export interface PromotionAnalyticsMetrics {
  total_revenue_fcfa: number;
  revenue_this_month_fcfa: number;
  active_promotions: number;
  completed_promotions: number;
  avg_duration_days: number;
  avg_roi_percent: number;
}

export interface ChartDataPoint<T = string> {
  x: T;
  y: number;
  metadata?: Record<string, unknown>;
}

export interface FilterOptions {
  dateRange: 7 | 30 | 90 | 'custom';
  startDate?: Date;
  endDate?: Date;
  city_id?: string;
  listing_type?: 'rent' | 'sale';
  status?: string;
  severity?: AlertSeverity;
  alert_type?: FraudAlertType;
}

export type PromotionTierName = 'basic' | 'standard' | 'premium';
export type PromotionStatus = 'pending_payment' | 'active' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type SearchPlacement = 'standard' | 'featured' | 'top';

export interface PromotionFeature {
  feature_key: string;
  feature_name: string;
  included: boolean;
}

export interface VisibilityBoost {
  search_placement: SearchPlacement;
  featured_badge: boolean;
  highlighted: boolean;
  estimated_impressions_per_day: number;
}

export interface PromotionTier {
  id: string;
  tier_name: PromotionTierName;
  display_name: string; // bilingual resolved by caller
  description: string;
  duration_days: number;
  price_fcfa: number;
  features: PromotionFeature[];
  visibility_boost: VisibilityBoost;
  display_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PromotionMetrics {
  impressions: number;
  clicks: number;
  ctr: number;           // click-through rate %
  conversions: number;
  conversion_rate: number;
  estimated_roi: number;
}

export interface VisibilitySettings {
  featured_badge: boolean;
  search_placement: SearchPlacement;
  highlighted: boolean;
}

export interface ListingPromotion {
  id: string;
  listing_id: string;
  landlord_id: string;
  tier: PromotionTierName;
  status: PromotionStatus;
  start_date: Date | null;
  end_date: Date | null;
  cost_fcfa: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_transaction_id: string | null;
  visibility_settings: VisibilitySettings;
  metrics: PromotionMetrics;
  renewal_count: number;
  auto_renew: boolean;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PurchasePromotionRequest {
  listing_id: string;
  tier: PromotionTierName;
  payment_method: 'credit_card' | 'mobile_money' | 'bank_transfer';
  auto_renew?: boolean;
}

export interface PurchasePromotionResponse {
  success: boolean;
  promotion?: ListingPromotion;
  payment_url?: string;
  error?: string;
}

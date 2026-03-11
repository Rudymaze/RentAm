export type VerificationType =
  | 'auto_approved'
  | 'auto_flagged'
  | 'manual_approved'
  | 'manual_rejected'
  | 'manual_flagged_for_review'
  | 'deep_verification_passed'
  | 'deep_verification_failed';

export type VerificationResult = 'passed' | 'failed' | 'flagged_for_manual_review';

export type RejectionReason =
  | 'photos_fake'
  | 'location_invalid'
  | 'pricing_unrealistic'
  | 'insufficient_description'
  | 'landlord_unverified'
  | 'duplicate_listing'
  | 'policy_violation'
  | 'other';

export interface VerificationChecklistItems {
  photos_authentic: boolean;
  location_valid: boolean;
  pricing_reasonable: boolean;
  description_detailed: boolean;
  landlord_verified: boolean;
}

export interface AutoVerificationFlags {
  image_quality_score?: number;
  location_accuracy?: number;
  price_anomaly_score?: number;
  description_length_ok?: boolean;
  landlord_verification_status?: string;
}

export interface ListingVerificationLog {
  readonly id: string;
  readonly listing_id: string;
  readonly admin_id: string | null;
  readonly verification_type: VerificationType;
  readonly verification_result: VerificationResult;
  readonly checklist_items: VerificationChecklistItems | null;
  readonly rejection_reason: RejectionReason | null;
  readonly admin_notes: string | null;
  readonly auto_verification_flags: AutoVerificationFlags | null;
  readonly verified_at: Date | null;
  readonly created_at: Date;
}

export interface PendingListing {
  id: string;
  title: string;
  landlord_name: string;
  city_name: string;
  listing_type: 'rent' | 'sale';
  created_at: Date;
  thumbnail_url?: string;
  status: 'pending_review';
}

export interface ListingImage {
  id: string;
  url: string;
  thumbnail_url: string | null;
  display_order: number;
}

export interface LandlordInfo {
  id: string;
  name: string;
  phone: string | null;
  business_name: string | null;
  avatar_url: string | null;
  verified_at: Date | null;
}

export interface ListingDetail {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string[];
  city_id: string;
  city_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  listing_type: 'rent' | 'sale';
  rental_price: number | null;
  sale_price: number | null;
  images: ListingImage[];
  landlord: LandlordInfo;
  created_at: Date;
  submission_ip: string | null;
}

export interface VerificationChecklist {
  photos_authentic?: boolean;
  location_valid?: boolean;
  pricing_reasonable?: boolean;
  description_detailed?: boolean;
  landlord_verified?: boolean;
}

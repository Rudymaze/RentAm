export interface ChecklistItems {
  photos_authentic: boolean;
  location_valid: boolean;
  pricing_reasonable: boolean;
  description_detailed: boolean;
  landlord_verified: boolean;
}

export interface PhotoVerification {
  reverse_search_clean: boolean;
  metadata_valid: boolean;
  dimensions_reasonable: boolean;
  exif_data_present: boolean;
  stock_photo_detected: boolean;
}

export type LandlordVerificationStatus = 'verified' | 'unverified' | 'suspicious';

export interface AutoVerificationFlags {
  image_quality_score: number; // 0-100
  location_accuracy: number;   // 0-100
  price_anomaly_score: number; // 0-100
  description_length_ok: boolean;
  landlord_verification_status: LandlordVerificationStatus;
}

export type RejectionReason =
  | 'photos_fake'
  | 'location_invalid'
  | 'pricing_unrealistic'
  | 'insufficient_description'
  | 'landlord_unverified'
  | 'duplicate_listing'
  | 'policy_violation'
  | 'other';

export type VerificationType =
  | 'auto_approved'
  | 'auto_flagged'
  | 'manual_approved'
  | 'manual_rejected'
  | 'manual_flagged_for_review'
  | 'deep_verification_passed'
  | 'deep_verification_failed';

export type VerificationResult = 'passed' | 'failed' | 'flagged_for_manual_review';

export interface VerificationLog {
  id: string;
  listing_id: string;
  admin_id: string | null;
  verification_type: VerificationType;
  verification_result: VerificationResult;
  checklist_items?: ChecklistItems;
  photo_verification?: PhotoVerification;
  rejection_reason?: RejectionReason;
  admin_notes?: string;
  auto_verification_flags?: AutoVerificationFlags;
  verification_duration_seconds?: number;
  verified_at: Date | null;
  created_at: Date;
}

export interface VerificationRequest {
  listing_id: string;
  verification_type: VerificationType;
  checklist_items?: Partial<ChecklistItems>;
  photo_verification?: Partial<PhotoVerification>;
  rejection_reason?: RejectionReason;
  admin_notes?: string;
}

export interface VerificationResponse {
  success: boolean;
  log?: VerificationLog;
  error?: string;
}

export enum RejectionReason {
  PHOTOS_FAKE = 'photos_fake',
  LOCATION_INVALID = 'location_invalid',
  PRICING_UNREALISTIC = 'pricing_unrealistic',
  DESCRIPTION_INSUFFICIENT = 'insufficient_description',
  LANDLORD_UNVERIFIED = 'landlord_unverified',
  DUPLICATE_LISTING = 'duplicate_listing',
  POLICY_VIOLATION = 'policy_violation',
  OTHER = 'other',
}

export enum AppealDecisionReason {
  STILL_PHOTOS_FAKE = 'still_photos_fake',
  STILL_LOCATION_INVALID = 'still_location_invalid',
  STILL_PRICING_UNREALISTIC = 'still_pricing_unrealistic',
  STILL_DESCRIPTION_INSUFFICIENT = 'still_description_insufficient',
  STILL_LANDLORD_UNVERIFIED = 'still_landlord_unverified',
  STILL_DUPLICATE = 'still_duplicate',
  STILL_POLICY_VIOLATION = 'still_policy_violation',
  OTHER = 'other',
}

export enum VerificationType {
  MANUAL_VERIFICATION_IN_PROGRESS = 'manual_verification_in_progress',
  MANUAL_APPROVED = 'manual_approved',
  MANUAL_REJECTED = 'manual_rejected',
  APPEAL_SUBMITTED = 'appeal_submitted',
  APPEAL_APPROVED = 'appeal_approved',
  APPEAL_DENIED = 'appeal_denied',
}

export type AppealStatus = 'under_appeal' | 'appeal_approved' | 'appeal_denied';

export interface RejectionData {
  listing_id: string;
  rejection_reason: RejectionReason;
  rejection_notes?: string;
  admin_notes?: string;
  rejected_at: Date;
  rejected_by: string;
}

export interface AppealData {
  listing_id: string;
  appeal_explanation: string;
  appeal_evidence_urls: string[];
  appeal_submitted_at: Date;
  appeal_status: AppealStatus;
}

export interface VerificationLogEntry {
  id: string;
  listing_id: string;
  verification_type: VerificationType;
  rejection_reason?: RejectionReason;
  appeal_decision_reason?: AppealDecisionReason;
  admin_notes: string | null;
  verified_at: Date;
  admin_name: string;
}

export interface ListingWithAppealContext {
  // Standard listing fields
  id: string;
  title: string;
  status: string;
  listing_type: 'rent' | 'sale';
  created_at: Date;
  updated_at: Date;
  // Rejection context
  rejected_at: Date | null;
  rejection_reason: RejectionReason | null;
  rejection_notes: string | null;
  // Appeal context
  appeal_explanation: string | null;
  appeal_evidence_urls: string[];
  appeal_status: AppealStatus | null;
  // History
  verification_history: VerificationLogEntry[];
}

export type MoveInTimeline = 'immediate' | '1-3 months' | 'flexible';

export interface TenantPreferences {
  preferredCities: readonly string[];
  propertyTypes: readonly string[];
  budgetMin: number;
  budgetMax: number;
  moveInTimeline: MoveInTimeline;
}

export interface LandlordProfile {
  businessName: string;
  phoneNumber: string; // +237XXXXXXXXX
  registrationNumber?: string;
  primaryCity: string;
  propertyTypes: readonly string[];
  yearsOfExperience: number;
}

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: 'tenant' | 'landlord';
  onboardingCompleted: boolean;
  onboardingCompletedAt: string | null;
  tenantPreferences: TenantPreferences | null;
  landlordProfile: LandlordProfile | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingStatus {
  onboardingCompleted: boolean;
  role: string;
  redirectTo: string;
}

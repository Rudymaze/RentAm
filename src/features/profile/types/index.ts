export type UserRole = 'tenant' | 'landlord' | 'agent' | 'admin';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  role?: UserRole;
  // Tenant-specific
  preferred_cities?: string[] | null;
  preferred_property_types?: string[] | null;
  // Landlord/agent-specific
  business_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  full_name: string;
  phone_number: string;
}

export type ProfileUpdatePayload = ProfileFormData;

export interface ProfileResponse {
  success: boolean;
  data?: Profile;
  error?: string;
}

export interface AvatarUploadResponse {
  success: boolean;
  avatar_url?: string;
  error?: string;
}

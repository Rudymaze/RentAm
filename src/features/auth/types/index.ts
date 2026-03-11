import { z } from 'zod';

// -------------------------------------------------------
// Role
// -------------------------------------------------------
export type UserRole = 'tenant' | 'landlord' | 'agent' | 'admin';

// -------------------------------------------------------
// Database model types
// -------------------------------------------------------
export interface OAuthMetadata {
  provider_name: string;
  provider_id: string;
  raw_user_meta_data: Record<string, unknown>;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  email: string | null;
  phone_number: string | null;
  status: 'active' | 'suspended' | 'banned';
  oauth_provider: string | null;
  oauth_id: string | null;
  oauth_metadata: OAuthMetadata | null;
  updated_at: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// -------------------------------------------------------
// Form data types
// -------------------------------------------------------
export interface SignUpFormData {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export interface LoginFormData {
  email: string;
  password: string;
}

// -------------------------------------------------------
// Zod validation schemas
// -------------------------------------------------------
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const signUpSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(['tenant', 'landlord', 'agent'] as const),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignUpSchema = z.infer<typeof signUpSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;

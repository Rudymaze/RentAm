import { UserRole } from '@/lib/auth-context';

const LANDLORD_ROLES: UserRole[] = ['landlord', 'agent'];
const ADMIN_ROLES: UserRole[] = ['admin'];

export function isLandlordOrAgent(role: UserRole): boolean {
  return LANDLORD_ROLES.includes(role);
}

export function isAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function canManageListings(role: UserRole): boolean {
  return isLandlordOrAgent(role) || isAdmin(role);
}

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export function validateFullName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) return { valid: false, error: 'Full name is required' };
  if (name.trim().length > 100) return { valid: false, error: 'Full name must be 100 characters or fewer' };
  return { valid: true };
}

export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim().length === 0) return { valid: false, error: 'Phone number is required' };
  if (!PHONE_REGEX.test(phone.trim())) {
    return { valid: false, error: 'Phone number format is invalid (e.g. +237612345678)' };
  }
  return { valid: true };
}

export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Avatar must be a JPEG or PNG image' };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { valid: false, error: 'Avatar must be smaller than 2 MB' };
  }
  return { valid: true };
}

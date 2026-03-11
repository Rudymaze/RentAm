import { createClient } from '@/lib/supabase/client';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export interface UploadResult {
  url: string;
  path: string;
}

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new FileValidationError('File size must not exceed 5MB');
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new FileValidationError('Only JPEG and PNG files are allowed');
  }
}

/**
 * Upload an appeal evidence file to Supabase Storage.
 * Files are stored under listing-appeals/{userId}/{listingId}/{filename}
 */
export async function uploadAppealEvidence(
  file: File,
  userId: string,
  listingId: string
): Promise<UploadResult> {
  validateFile(file);

  const supabase = createClient();
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${userId}/${listingId}/${filename}`;

  const { error } = await supabase.storage
    .from('listing-appeals')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from('listing-appeals').getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Upload a property listing image to Supabase Storage.
 * Files are stored under listings/{userId}/{listingId}/{filename}
 */
export async function uploadListingImage(
  file: File,
  userId: string,
  listingId: string
): Promise<UploadResult> {
  validateFile(file);

  const supabase = createClient();
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${userId}/${listingId}/${filename}`;

  const { error } = await supabase.storage
    .from('listings')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from('listings').getPublicUrl(path);
  return { url: data.publicUrl, path };
}

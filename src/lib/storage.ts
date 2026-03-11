import { createClient } from '@/lib/supabase/client';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageValidationError';
  }
}

function validate(file: File): void {
  if (file.size > MAX_SIZE) throw new StorageValidationError('File must not exceed 5MB');
  if (!ALLOWED_TYPES.includes(file.type))
    throw new StorageValidationError('Only PDF, JPEG, and PNG files are allowed');
}

/**
 * Upload an inquiry attachment. Returns the public URL.
 */
export async function uploadInquiryAttachment(
  file: File,
  userId: string,
  inquiryId: string
): Promise<string> {
  validate(file);
  const supabase = createClient();
  const ext = file.name.split('.').pop();
  const path = `${userId}/${inquiryId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('inquiry-attachments')
    .upload(path, file, { contentType: file.type });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from('inquiry-attachments').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete an inquiry attachment by its storage path.
 */
export async function deleteInquiryAttachment(path: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from('inquiry-attachments').remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

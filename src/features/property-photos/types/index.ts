import { z } from 'zod';

export interface PropertyImage {
  id: string;
  listing_id: string;
  storage_path: string;
  url: string;
  thumbnail_url?: string;
  display_order: number;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  uploaded_by: string;
  uploaded_at: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface PropertyImageUploadRequest {
  listing_id?: string;
  draft_id?: string;
  files: File[];
}

export interface PropertyImageReorderRequest {
  listing_id: string;
  imageOrder: Array<{ id: string; display_order: number }>;
}

// -------------------------------------------------------
// Validation schemas
// -------------------------------------------------------
const ALLOWED_MIME = ['image/jpeg', 'image/png'] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const uploadImageSchema = z.object({
  mime_type: z.enum(ALLOWED_MIME, { errorMap: () => ({ message: 'Only JPEG and PNG files are allowed' }) }),
  file_size: z
    .number()
    .max(MAX_FILE_SIZE, 'File must be smaller than 5 MB'),
  width: z
    .number()
    .min(400, 'Image width must be at least 400 px')
    .max(8000, 'Image width must not exceed 8000 px')
    .optional(),
  height: z
    .number()
    .min(300, 'Image height must be at least 300 px')
    .max(8000, 'Image height must not exceed 8000 px')
    .optional(),
});

export const reorderImageSchema = z.object({
  listing_id: z.string().uuid(),
  imageOrder: z
    .array(
      z.object({
        id: z.string().uuid(),
        display_order: z.number().int().min(0),
      })
    )
    .min(1, 'imageOrder must contain at least one item'),
});

export const thumbnailRequestSchema = z.object({
  width: z.number().int().min(1).default(400),
  height: z.number().int().min(1).default(300),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;
export type ReorderImageInput = z.infer<typeof reorderImageSchema>;
export type ThumbnailRequestInput = z.infer<typeof thumbnailRequestSchema>;

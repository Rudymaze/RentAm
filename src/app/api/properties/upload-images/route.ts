import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser, unauthorizedResponse, forbiddenResponse, serverErrorResponse } from '../_helpers';
import { uploadImageSchema } from '@/features/property-photos/types';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const MAX_FILES = 10;
const UPLOADS_PER_HOUR = 100;
const BUCKET = 'property-images';

export async function POST(req: NextRequest) {
  const { supabase, user, authError } = await getSupabaseAndUser();
  if (authError || !user) return unauthorizedResponse();

  // Verify landlord or agent role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['landlord', 'agent'].includes(profile.role)) {
    return forbiddenResponse('Only landlords and agents can upload images');
  }

  // Rate limit: 100 uploads/hour
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count: hourlyCount } = await supabase
    .from('property_images')
    .select('id', { count: 'exact', head: true })
    .eq('uploaded_by', user.id)
    .gte('uploaded_at', oneHourAgo);

  if ((hourlyCount ?? 0) >= UPLOADS_PER_HOUR) {
    return NextResponse.json({ success: false, error: 'Hourly upload limit reached (100/hour)' }, { status: 429 });
  }

  let formData: FormData;
  try { formData = await req.formData(); } catch {
    return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 });
  }

  const files = formData.getAll('files') as File[];
  const listingId = formData.get('listing_id') as string | null;
  const draftId = formData.get('draft_id') as string | null;

  if (!files.length) {
    return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ success: false, error: `Maximum ${MAX_FILES} images allowed` }, { status: 400 });
  }

  const folder = listingId ?? `drafts/${user.id}`;
  const now = new Date().toISOString();
  const uploadedImages: any[] = [];

  // Get current max display_order for the listing
  let nextOrder = 0;
  if (listingId) {
    const { data: existing } = await supabase
      .from('property_images')
      .select('display_order')
      .eq('listing_id', listingId)
      .is('deleted_at', null)
      .order('display_order', { ascending: false })
      .limit(1);
    nextOrder = (existing?.[0]?.display_order ?? -1) + 1;
  }

  for (const file of files) {
    const validation = uploadImageSchema.safeParse({ mime_type: file.type, file_size: file.size });
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: `Invalid file "${file.name}": ${validation.error.issues[0].message}`,
      }, { status: 400 });
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const imageId = randomUUID();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract dimensions
    let width: number | undefined;
    let height: number | undefined;
    let thumbBuffer: Buffer;
    try {
      const meta = await sharp(buffer).metadata();
      width = meta.width;
      height = meta.height;
      thumbBuffer = await sharp(buffer).resize(400, 300, { fit: 'cover' }).toFormat(ext === 'png' ? 'png' : 'jpeg').toBuffer();
    } catch {
      return serverErrorResponse(`Failed to process image "${file.name}"`);
    }

    const mainPath = `listings/${folder}/${imageId}.${ext}`;
    const thumbPath = `listings/${folder}/${imageId}_thumb.${ext}`;

    const { error: mainErr } = await supabase.storage.from(BUCKET).upload(mainPath, buffer, { contentType: file.type, upsert: false });
    if (mainErr) return serverErrorResponse(`Failed to upload "${file.name}"`);

    await supabase.storage.from(BUCKET).upload(thumbPath, thumbBuffer, { contentType: file.type, upsert: false });

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(mainPath);
    const { data: { publicUrl: thumbUrl } } = supabase.storage.from(BUCKET).getPublicUrl(thumbPath);

    const record: any = {
      id: imageId,
      storage_path: mainPath,
      url: publicUrl,
      thumbnail_url: thumbUrl,
      display_order: nextOrder,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
      uploaded_at: now,
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
      ...(listingId ? { listing_id: listingId } : {}),
    };

    if (listingId) {
      const { error: dbErr } = await supabase.from('property_images').insert(record);
      if (dbErr) return serverErrorResponse('Failed to save image record');
    }

    uploadedImages.push({ ...record });
    nextOrder++;
  }

  // If draft, update draft images array
  if (draftId && uploadedImages.length > 0) {
    const { data: draft } = await supabase
      .from('property_listing_drafts')
      .select('draft_data')
      .eq('id', draftId)
      .eq('user_id', user.id)
      .single();

    if (draft) {
      const existingImages = (draft.draft_data as any)?.images ?? [];
      const merged = [...existingImages, ...uploadedImages.map(img => ({ url: img.url, order: img.display_order, uploadedAt: now }))];
      await supabase
        .from('property_listing_drafts')
        .update({ draft_data: { ...(draft.draft_data as any), images: merged } })
        .eq('id', draftId);
    }
  }

  return NextResponse.json({ success: true, data: { images: uploadedImages } }, { status: 201 });
}

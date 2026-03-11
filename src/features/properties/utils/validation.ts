import { z } from 'zod';

export const listingFormSchema = z
  .object({
    title: z
      .string()
      .min(5, 'Title must be at least 5 characters')
      .max(200, 'Title must be 200 characters or fewer'),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters')
      .max(5000, 'Description must be 5000 characters or fewer'),
    property_type: z.enum(['apartment', 'house', 'villa', 'commercial', 'land']),
    bedrooms: z.number().int().min(0).max(20).nullable(),
    bathrooms: z.number().int().min(0).max(20).nullable(),
    city_id: z.string().uuid('Invalid city'),
    address: z.string().min(5, 'Address is required').max(500),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    amenities: z.array(z.string()).default([]),
    listing_type: z.enum(['rent', 'sale']),
    rental_price: z.number().int().min(0).nullable(),
    sale_price: z.number().int().min(0).nullable(),
    images: z
      .array(
        z.object({
          url: z.string().url(),
          order: z.number().int().min(0),
          uploadedAt: z.string(),
        })
      )
      .min(1, 'At least one image is required')
      .max(20, 'Maximum 20 images allowed'),
  })
  .refine(
    (data) => {
      if (data.listing_type === 'rent') return data.rental_price !== null && data.rental_price > 0;
      return data.sale_price !== null && data.sale_price > 0;
    },
    {
      message: 'A valid price is required for the selected listing type',
      path: ['rental_price'],
    }
  );

export type ListingFormSchema = z.infer<typeof listingFormSchema>;

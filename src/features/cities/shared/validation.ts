import { z } from 'zod';

export const CAMEROON_REGIONS = [
  'Adamawa',
  'Centre',
  'East',
  'Far North',
  'Littoral',
  'North',
  'North West',
  'South',
  'South West',
  'West',
] as const;

export type CameroonRegion = typeof CAMEROON_REGIONS[number];

export const CitySchema = z.object({
  nameEn: z.string().min(2, 'Name must be at least 2 characters').max(100),
  nameFr: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  region: z.enum(CAMEROON_REGIONS, { errorMap: () => ({ message: 'Invalid Cameroon region' }) }),
  latitude: z
    .number()
    .min(1.67, 'Latitude must be within Cameroon bounds')
    .max(13.0, 'Latitude must be within Cameroon bounds'),
  longitude: z
    .number()
    .min(8.5, 'Longitude must be within Cameroon bounds')
    .max(16.0, 'Longitude must be within Cameroon bounds'),
  population: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const CityFormSchema = CitySchema;

export const CitySearchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(100),
  language: z.enum(['en', 'fr']).default('en'),
  limit: z.number().int().min(1).max(50).default(10),
});

export type CityInput = z.infer<typeof CitySchema>;
export type CitySearchInput = z.infer<typeof CitySearchSchema>;
